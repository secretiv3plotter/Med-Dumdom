import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import {
  ConfirmationDialogModal,
  MedicineDetailsPopup,
  MedicineEditorPopup,
  MedicineListSection,
  MedTrackerHeader,
} from '../components/MedTrackerScreenLayout';
import medTrackerService from '../../../domain/services/MedTrackerService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import { ROUTES } from '../../../app/navigation/routes';
import { colors } from '../../../shared/theme';
import {
  buildFormStateFromMedicine,
  buildMedicineSearchText,
  buildScheduleDraftFromEntry,
  buildScheduleEntriesFromMedicine,
  getMedicineDuplicateKey,
  getSortTime,
  hasDuplicateScheduleEntry,
  hasDuplicateSchedules,
  isBeforeDate,
  normalizeSearchText,
  normalizeTimeInput,
  parseDateInput,
  parsePositiveInteger,
  startOfToday,
  sumDoseSizes,
} from '../utils/medTrackerUtils';

const CURRENT_USER_ID = 'current-user';
const FOOTER_NAV_Z_INDEX = 30;
const LIVE_STATUS_REFRESH_MS = 1000;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const EMPTY_FORM = {
  medName: '',
  unitStrength: '',
  unit: '',
  totalDailyAmount: '',
  startDate: '',
  endDate: '',
  instructions: '',
  prescriberContact: '',
};

const EMPTY_SCHEDULE_DRAFT = {
  scheduleType: 'time',
  doseSize: '',
  scheduledTime: '',
  mealContext: 'before',
  associatedMeal: 'breakfast',
  mealTime: '',
};

export default function MedTrackerScreen({ navigation, realm = null }) {
  const [version, setVersion] = useState(0);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [scheduleDraft, setScheduleDraft] = useState(EMPTY_SCHEDULE_DRAFT);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [formError, setFormError] = useState('');
  const [pendingScheduleAction, setPendingScheduleAction] = useState(null);
  const [pendingDeleteMedicine, setPendingDeleteMedicine] = useState(null);
  const [pendingDeleteScheduleIndex, setPendingDeleteScheduleIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [footerNavHeight, setFooterNavHeight] = useState(0);
  const [observedNow, setObservedNow] = useState(() => new Date());

  const activeMedTrackerService = useMemo(
    () => (realm ? new RealmMedTrackerRepository(realm) : medTrackerService),
    [realm],
  );

  const medicines = useMemo(() => activeMedTrackerService.listMedEntries(CURRENT_USER_ID), [activeMedTrackerService, version]);

  const selectedMedicine = useMemo(
    () => medicines.find((medicine) => medicine.medEntryId === selectedMedicineId) || null,
    [medicines, selectedMedicineId]
  );

  const sortedMedicines = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    const visibleMedicines = normalizedQuery
      ? medicines.filter((medicine) => buildMedicineSearchText(medicine).includes(normalizedQuery))
      : medicines;

    return [...visibleMedicines].sort((left, right) => {
      const createdTimeDifference = getSortTime(right.createdAt) - getSortTime(left.createdAt);
      if (createdTimeDifference !== 0) {
        return createdTimeDifference;
      }

      if (left.isTaken !== right.isTaken) {
        return left.isTaken ? 1 : -1;
      }

      return left.medName.localeCompare(right.medName);
    });
  }, [medicines, searchQuery]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Skip updating during form editing to avoid resetting the form
      if (editorMode) return;
      setObservedNow(new Date());
    }, LIVE_STATUS_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [editorMode]);

  const refresh = () => {
    setObservedNow(new Date());
    setVersion((current) => current + 1);
  };

  const resetEditor = () => {
    setEditorMode(null);
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
  };

  const openCreateEditor = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
    setIsDetailsVisible(false);
    setEditorMode('create');
  };

  const openEditEditor = () => {
    if (!selectedMedicine) {
      return;
    }

    setFormError('');
    setFormState(buildFormStateFromMedicine(selectedMedicine));
    setScheduleEntries(buildScheduleEntriesFromMedicine(selectedMedicine));
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
    setIsDetailsVisible(false);
    setEditorMode('edit');
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const requestDeleteMedicine = () => {
    if (!selectedMedicine) {
      return;
    }

    setPendingDeleteMedicine({
      medEntryId: selectedMedicine.medEntryId,
      medName: selectedMedicine.medName,
    });
  };

  const confirmDeleteMedicine = () => {
    if (!pendingDeleteMedicine) {
      return;
    }

    activeMedTrackerService.softDeleteMedEntry(CURRENT_USER_ID, pendingDeleteMedicine.medEntryId);
    setPendingDeleteMedicine(null);
    setIsDetailsVisible(false);
    setSelectedMedicineId(null);
    refresh();
  };

  const applyScheduleStatus = (medEntryId, scheduleIndex, targetStatus, currentStatus = 'pending') => {
    if (!medEntryId) {
      return;
    }

    if (currentStatus === targetStatus) {
      activeMedTrackerService.clearMedScheduleStatus(CURRENT_USER_ID, medEntryId, scheduleIndex);
    } else if (targetStatus === 'taken') {
      activeMedTrackerService.markMedScheduleTaken(CURRENT_USER_ID, medEntryId, scheduleIndex, new Date());
    } else {
      activeMedTrackerService.markMedScheduleSkipped(CURRENT_USER_ID, medEntryId, scheduleIndex, new Date());
    }

    refresh();
  };

  const requestScheduleStatusChange = (medicine, scheduleIndex, targetStatus) => {
    if (!medicine) {
      return;
    }

    const currentStatus = medicine.dailySched[scheduleIndex]?.status || 'pending';
    if (currentStatus === 'taken' || currentStatus === 'skipped') {
      setPendingScheduleAction({
        medEntryId: medicine.medEntryId,
        scheduleIndex,
        targetStatus,
        currentStatus,
      });
      return;
    }

    applyScheduleStatus(medicine.medEntryId, scheduleIndex, targetStatus, currentStatus);
  };

  const confirmScheduleStatusChange = () => {
    if (!pendingScheduleAction) {
      return;
    }

    applyScheduleStatus(
      pendingScheduleAction.medEntryId,
      pendingScheduleAction.scheduleIndex,
      pendingScheduleAction.targetStatus,
      pendingScheduleAction.currentStatus
    );
    setPendingScheduleAction(null);
  };

  const saveScheduleEntry = () => {
    const doseSize = parsePositiveInteger(scheduleDraft.doseSize);
    if (!doseSize) {
      setFormError('Enter a valid dose size for the schedule item.');
      return;
    }

    const activatedAt = new Date().toISOString();
    const scheduleStatusDefaults = {
      status: 'pending',
      takenAt: null,
      skippedAt: null,
      activatedAt,
    };
    let nextEntry;
    if (scheduleDraft.scheduleType === 'meal') {
      const mealTime = normalizeTimeInput(scheduleDraft.mealTime);
      if (!mealTime || !scheduleDraft.mealContext || !scheduleDraft.associatedMeal) {
        setFormError('Fill in meal context, associated meal, and meal time.');
        return;
      }

      nextEntry = {
        scheduleType: 'meal',
        doseSize,
        mealContext: scheduleDraft.mealContext,
        associatedMeal: scheduleDraft.associatedMeal,
        mealTime,
        ...scheduleStatusDefaults,
      };
    } else {
      const scheduledTime = normalizeTimeInput(scheduleDraft.scheduledTime);
      if (!scheduledTime) {
        setFormError('Enter a valid scheduled time.');
        return;
      }

      nextEntry = {
        scheduleType: 'time',
        doseSize,
        scheduledTime,
        ...scheduleStatusDefaults,
      };
    }

    if (hasDuplicateScheduleEntry(scheduleEntries, nextEntry, editingScheduleIndex)) {
      setFormError('This schedule item already exists.');
      return;
    }

    setScheduleEntries((current) => {
      if (editingScheduleIndex === null) {
        return [...current, nextEntry];
      }

      return current.map((entry, index) => (index === editingScheduleIndex ? nextEntry : entry));
    });
    setFormError('');
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setEditingScheduleIndex(null);
  };

  const editScheduleEntry = (indexToEdit) => {
    const entry = scheduleEntries[indexToEdit];
    if (!entry) {
      return;
    }

    setScheduleDraft(buildScheduleDraftFromEntry(entry));
    setEditingScheduleIndex(indexToEdit);
    setFormError('');
  };

  const requestDeleteScheduleEntry = (indexToRemove) => {
    setPendingDeleteScheduleIndex(indexToRemove);
  };

  const confirmDeleteScheduleEntry = () => {
    if (pendingDeleteScheduleIndex === null) {
      return;
    }

    const indexToRemove = pendingDeleteScheduleIndex;
    setScheduleEntries((current) => current.filter((_, index) => index !== indexToRemove));
    setEditingScheduleIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current === indexToRemove) {
        setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
        return null;
      }

      return current > indexToRemove ? current - 1 : current;
    });
    setPendingDeleteScheduleIndex(null);
  };

  const saveMedicine = () => {
    const medName = formState.medName.trim();
    const unitStrength = formState.unitStrength.trim();
    const unit = formState.unit.trim();
    const totalDailyAmount = parsePositiveInteger(formState.totalDailyAmount);
    const startDate = parseDateInput(formState.startDate);
    const endDateText = formState.endDate.trim();
    const endDate = endDateText ? parseDateInput(endDateText) : null;
    const instructions = formState.instructions.trim();
    const prescriberContact = formState.prescriberContact.trim();

    if (!medName || !unit || !totalDailyAmount || !startDate) {
      setFormError('Complete the required medication fields.');
      return;
    }

    if (endDateText && !endDate) {
      setFormError('Select a valid end date.');
      return;
    }

    if (editorMode !== 'edit' && isBeforeDate(startDate, startOfToday())) {
      setFormError('Start date must be today or a future date.');
      return;
    }

    if (!scheduleEntries.length) {
      setFormError('Add at least one schedule item.');
      return;
    }

    const duplicateMedicineKey = getMedicineDuplicateKey({ medName, unitStrength, unit });
    const hasDuplicateMedicine = medicines.some((medicine) =>
      medicine.medEntryId !== selectedMedicine?.medEntryId &&
      getMedicineDuplicateKey(medicine) === duplicateMedicineKey
    );
    if (hasDuplicateMedicine) {
      setFormError('This medicine already exists in your tracker.');
      return;
    }

    if (hasDuplicateSchedules(scheduleEntries)) {
      setFormError('Remove duplicate schedule items before saving.');
      return;
    }

    if (sumDoseSizes(scheduleEntries) !== totalDailyAmount) {
      setFormError('Total daily amount must match the sum of the schedule dose sizes.');
      return;
    }

    const payload = {
      medName,
      unitStrength,
      unit,
      totalDailyAmount,
      dailySched: scheduleEntries,
      startDate,
      endDate,
      instructions,
      prescriberContact,
    };

    if (editorMode === 'edit' && selectedMedicine) {
      activeMedTrackerService.updateMedEntry(CURRENT_USER_ID, selectedMedicine.medEntryId, payload);
    } else {
      activeMedTrackerService.addMedEntry(CURRENT_USER_ID, payload);
    }

    resetEditor();
    setSelectedMedicineId(null);
    refresh();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MedTrackerHeader
        onBack={() => navigation?.navigate?.(ROUTES.HOME)}
        onCreate={openCreateEditor}
      />

      <MedicineListSection
        footerNavHeight={footerNavHeight}
        medicines={sortedMedicines}
        observedNow={observedNow}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMedicine={(medicine) => {
          setSelectedMedicineId(medicine.medEntryId);
          setIsDetailsVisible(true);
        }}
        onReviewRecords={() => navigation?.navigate?.(ROUTES.MED_TRACKER_HISTORY)}
        onScheduleStatusChange={requestScheduleStatusChange}
      />

      <MedicineDetailsPopup
        visible={isDetailsVisible}
        medicine={selectedMedicine}
        observedNow={observedNow}
        onClose={() => setIsDetailsVisible(false)}
        onEdit={openEditEditor}
        onDelete={requestDeleteMedicine}
        onScheduleStatusChange={requestScheduleStatusChange}
      />

      <MedicineEditorPopup
        visible={editorMode === 'create' || editorMode === 'edit'}
        editorMode={editorMode}
        formState={formState}
        scheduleDraft={scheduleDraft}
        scheduleEntries={scheduleEntries}
        editingScheduleIndex={editingScheduleIndex}
        formError={formError}
        setFormState={setFormState}
        setScheduleDraft={setScheduleDraft}
        onCancelScheduleEdit={() => {
          setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
          setEditingScheduleIndex(null);
        }}
        onSaveScheduleEntry={saveScheduleEntry}
        onEditScheduleEntry={editScheduleEntry}
        onDeleteScheduleEntry={requestDeleteScheduleEntry}
        onCancel={resetEditor}
        onSaveMedicine={saveMedicine}
      />

      <ConfirmationDialogModal
        visible={Boolean(pendingScheduleAction)}
        title="Change schedule status?"
        message="This schedule item already has a selected status. Confirm to change or clear it."
        confirmLabel="Confirm"
        onCancel={() => setPendingScheduleAction(null)}
        onConfirm={confirmScheduleStatusChange}
      />

      <ConfirmationDialogModal
        visible={Boolean(pendingDeleteMedicine)}
        title="Delete medicine?"
        message={`Are you sure you want to delete ${pendingDeleteMedicine?.medName || 'this medicine'} from your med tracker?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteMedicine(null)}
        onConfirm={confirmDeleteMedicine}
      />

      <ConfirmationDialogModal
        visible={pendingDeleteScheduleIndex !== null}
        title="Delete schedule item?"
        message="Are you sure you want to delete this schedule item?"
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteScheduleIndex(null)}
        onConfirm={confirmDeleteScheduleEntry}
      />

      <View
        style={styles.footerNav}
        onLayout={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          setFooterNavHeight((currentHeight) => (
            currentHeight === nextHeight ? currentHeight : nextHeight
          ));
        }}
      >
        <NavigationBar selectedTab="med" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: FOOTER_NAV_Z_INDEX,
  },
});
