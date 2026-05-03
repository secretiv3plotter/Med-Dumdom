import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import medTrackerService from '../../../domain/services/MedTrackerService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';
const TOP_OVERLAY_HEIGHT = moderateScale(170);

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
  inventoryCount: '',
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

const MEAL_CONTEXT_OPTIONS = ['before', 'during', 'after'];
const ASSOCIATED_MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'];
const UNIT_OPTIONS = ['tablet', 'ml', 'units', 'custom'];

const capitalize = (value) => String(value || '')
  .trim()
  .replace(/^\w/, (char) => char.toUpperCase());

const parseDateInput = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return '--';
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return text;
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }
  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  const displayHour = hours % 12 || 12;
  const displayMeridiem = hours >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minutes} ${displayMeridiem}`;
};

const normalizeTimeInput = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return '';
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    return '';
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return '';
    }

    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    return '';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parsePositiveInteger = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
};

const parseNonNegativeInteger = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric < 0) {
    return null;
  }

  return numeric;
};

const formatDoseWithUnit = (doseSize, unit) => {
  const normalizedUnit = String(unit || '').trim();
  return normalizedUnit ? `${doseSize} ${normalizedUnit}` : String(doseSize);
};

const formatScheduleEntry = (entry, unit = '') => {
  if (entry.scheduleType === 'meal') {
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\n${capitalize(entry.mealContext)} ${capitalize(entry.associatedMeal)} at ${formatTime(entry.mealTime)}`;
  }

  return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAt ${formatTime(entry.scheduledTime)}`;
};

function ScheduleEntryText({ entry, unit = '' }) {
  if (entry.scheduleType === 'meal') {
    return (
      <Text style={styles.scheduleCardTitle}>
        Take <Text style={styles.scheduleTextStrong}>{formatDoseWithUnit(entry.doseSize, unit)}</Text>
        {'\n'}
        <Text style={styles.scheduleTextStrong}>
          {capitalize(entry.mealContext)} {capitalize(entry.associatedMeal)}
        </Text>{' '}
        at <Text style={styles.scheduleTextStrong}>{formatTime(entry.mealTime)}</Text>
      </Text>
    );
  }

  return (
    <Text style={styles.scheduleCardTitle}>
      Take <Text style={styles.scheduleTextStrong}>{formatDoseWithUnit(entry.doseSize, unit)}</Text>
      {'\n'}At <Text style={styles.scheduleTextStrong}>{formatTime(entry.scheduledTime)}</Text>
    </Text>
  );
}

const buildFormStateFromMedicine = (medicine) => ({
  medName: medicine.medName || '',
  unitStrength: medicine.unitStrength || '',
  unit: medicine.unit || '',
  totalDailyAmount: medicine.totalDailyAmount ? String(medicine.totalDailyAmount) : '',
  startDate: medicine.startDate ? medicine.startDate.toISOString().slice(0, 10) : '',
  endDate: medicine.endDate ? medicine.endDate.toISOString().slice(0, 10) : '',
  instructions: medicine.instructions || '',
  inventoryCount:
    medicine.inventoryCount === undefined || medicine.inventoryCount === null
      ? ''
      : String(medicine.inventoryCount),
  prescriberContact: medicine.prescriberContact || '',
});

const buildScheduleEntriesFromMedicine = (medicine) =>
  Array.isArray(medicine.dailySched)
    ? medicine.dailySched.map((entry) => ({ ...entry }))
    : [];

const buildScheduleDraftFromEntry = (entry) => ({
  scheduleType: entry.scheduleType === 'meal' ? 'meal' : 'time',
  doseSize: entry.doseSize ? String(entry.doseSize) : '',
  scheduledTime: entry.scheduleType === 'time' ? entry.scheduledTime || '' : '',
  mealContext: entry.scheduleType === 'meal' ? entry.mealContext || 'after' : 'after',
  associatedMeal: entry.scheduleType === 'meal' ? entry.associatedMeal || 'breakfast' : 'breakfast',
  mealTime: entry.scheduleType === 'meal' ? entry.mealTime || '' : '',
});

const getStatus = (entry) => {
  if (entry.isTaken) {
    return { label: 'Taken', bgColor: '#E9F8EF', textColor: colors.success };
  }

  const now = new Date();
  if (entry.isMissed(now, now)) {
    return { label: 'Missed', bgColor: '#FDECEC', textColor: colors.error };
  }

  if (entry.isDue(now, now)) {
    return { label: 'Due now', bgColor: '#FDECEC', textColor: colors.error };
  }

  if (entry.isPending(now, now)) {
    return { label: 'Pending', bgColor: '#EEF2FF', textColor: colors.brand };
  }

  return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
};

const getScheduleStatusStyle = (medicine, scheduleIndex) => {
  const now = new Date();
  const status = medicine.getScheduleStatus(scheduleIndex, now, now);

  if (status === 'taken') {
    return { status, label: 'Taken', bgColor: '#BFDBFE', textColor: '#1D4ED8' };
  }

  if (status === 'missed') {
    return { status, label: 'Missed', bgColor: '#FECACA', textColor: '#B91C1C' };
  }

  if (status === 'due') {
    return { status, label: 'Due now', bgColor: '#BBF7D0', textColor: '#15803D' };
  }

  if (status === 'pending') {
    return { status, label: 'Pending', bgColor: '#FEF08A', textColor: '#854D0E' };
  }

  return { status, label: 'Upcoming', bgColor: colors.surface, textColor: colors.bodyMuted };
};

const completedScheduleStyle = {
  status: 'completed',
  label: 'Completed',
  bgColor: '#DCFCE7',
  textColor: '#166534',
};

const isToday = (isoString, now = new Date()) => {
  if (!isoString) {
    return false;
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toDateString() === now.toDateString();
};

const isMedicineCompletedToday = (medicine, now = new Date()) =>
  Array.isArray(medicine.dailySched) &&
  medicine.dailySched.length > 0 &&
  medicine.dailySched.every((entry) => entry.status === 'taken' && isToday(entry.takenAt, now));

const formatDateTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}, ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatLastTakenMessage = (isoString) => {
  if (!isoString) {
    return '';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today.getTime());
  yesterday.setDate(yesterday.getDate() - 1);

  const takenDay = new Date(date.getTime());
  takenDay.setHours(0, 0, 0, 0);

  const timeText = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (takenDay.getTime() === today.getTime()) {
    return `Last taken at ${timeText} today`;
  }

  if (takenDay.getTime() === yesterday.getTime()) {
    return `Last taken at ${timeText} yesterday`;
  }

  return `Last taken at ${timeText} on ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const getLatestTakenAt = (medicine) => {
  const takenAtValues = (medicine.dailySched || [])
    .filter((entry) => entry.status === 'taken')
    .map((entry) => entry.takenAt)
    .filter(Boolean)
    .sort();

  return takenAtValues[takenAtValues.length - 1] || null;
};

const getSchedulePreviewItems = (medicine) => {
  const now = new Date();
  const scheduleItems = (medicine.dailySched || []).map((entry, index) => ({
    entry,
    index,
    statusStyle: getScheduleStatusStyle(medicine, index),
  }));

  const currentActiveItem = scheduleItems.find(({ index, statusStyle }) =>
    (statusStyle.status === 'due' || statusStyle.status === 'pending') &&
    medicine.isScheduleActionAvailable(index, now, now)
  );
  if (currentActiveItem) {
    return [currentActiveItem];
  }

  const upcomingItems = scheduleItems.filter(({ statusStyle }) => statusStyle.status === 'upcoming');
  if (upcomingItems.length) {
    return [upcomingItems[0]];
  }

  return scheduleItems.slice(0, 1);
};

const sumDoseSizes = (scheduleEntries) =>
  scheduleEntries.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

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
    return [...medicines].sort((left, right) => {
      if (left.isTaken !== right.isTaken) {
        return left.isTaken ? 1 : -1;
      }

      return left.medName.localeCompare(right.medName);
    });
  }, [medicines]);

  const refresh = () => setVersion((current) => current + 1);

  const resetEditor = () => {
    setEditorMode(null);
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
  };

  const openCreateEditor = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
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
    setIsDetailsVisible(false);
    setEditorMode('edit');
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const handleDeleteMedicine = () => {
    if (!selectedMedicine) {
      return;
    }

    activeMedTrackerService.softDeleteMedEntry(CURRENT_USER_ID, selectedMedicine.medEntryId);
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
      };
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

  const removeScheduleEntry = (indexToRemove) => {
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
    const inventoryCountText = formState.inventoryCount.trim();
    const inventoryCount = inventoryCountText ? parseNonNegativeInteger(inventoryCountText) : null;
    const prescriberContact = formState.prescriberContact.trim();

    if (!medName || !unitStrength || !unit || !totalDailyAmount || !startDate) {
      setFormError('Complete the required medication fields.');
      return;
    }

    if (endDateText && !endDate) {
      setFormError('Select a valid end date.');
      return;
    }

    if (inventoryCountText && inventoryCount === null) {
      setFormError('Inventory count must be a whole number.');
      return;
    }

    if (!scheduleEntries.length) {
      setFormError('Add at least one schedule item.');
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
      inventoryCount,
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
      <View style={styles.stickyTop}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation?.navigate?.(ROUTES.HOME)} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Med Tracker</Text>
            <Text style={styles.subtitle}>Track daily strengths, schedules, and inventory in one place.</Text>
          </View>
          <AddButton onPress={openCreateEditor} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listSection}>
          {sortedMedicines.map((medicine) => {
            const schedulePreviewItems = getSchedulePreviewItems(medicine);
            const latestTakenAt = getLatestTakenAt(medicine);
            const completedToday = isMedicineCompletedToday(medicine);

            return (
              <Pressable
                key={medicine.medEntryId}
                accessibilityRole="button"
                accessibilityLabel={`${medicine.medName} details`}
                onPress={() => {
                  setSelectedMedicineId(medicine.medEntryId);
                  setIsDetailsVisible(true);
                }}
                style={styles.medicineListItem}
              >
                <View style={styles.medicineListHeader}>
                  <View style={styles.cardHeaderBlock}>
                    <Text style={styles.cardHeaderName}>{medicine.medName}</Text>
                    <Text style={styles.cardHeaderMeta}>
                      {`${medicine.unitStrength} • ${medicine.totalDailyAmount} ${medicine.unit} per day`}
                    </Text>
                  </View>
                </View>

                <View style={styles.schedulePreviewList}>
                  {completedToday ? (
                    <View
                      style={[
                        styles.scheduleCard,
                        styles.scheduleCardInList,
                        { backgroundColor: completedScheduleStyle.bgColor },
                      ]}
                    >
                      <View style={styles.scheduleCardRow}>
                        <Text style={styles.scheduleCardTitle}>
                          All medicines for today have been taken.
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: completedScheduleStyle.bgColor }]}>
                          <Text style={[styles.statusText, { color: completedScheduleStyle.textColor }]}>
                            {completedScheduleStyle.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                  schedulePreviewItems.map(({ entry, index, statusStyle }) => {
                    const now = new Date();
                    const isTaken = statusStyle.status === 'taken';
                    const canSelectStatus = medicine.isScheduleActionAvailable(index, now, now);

                    return (
                      <View
                        key={`${medicine.medEntryId}-preview-schedule-${index}`}
                        style={[
                          styles.scheduleCard,
                          styles.scheduleCardInList,
                          { backgroundColor: statusStyle.bgColor },
                        ]}
                      >
                        <View style={styles.scheduleCardRow}>
                          <ScheduleEntryText entry={entry} unit={medicine.unit} />
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                              {statusStyle.label}
                            </Text>
                          </View>
                        </View>

                        {isTaken ? (
                          <Text style={styles.scheduleMetaText}>
                            Taken {formatDateTime(entry.takenAt)}
                          </Text>
                        ) : null}

                        {statusStyle.status === 'upcoming' && latestTakenAt ? (
                          <Text style={styles.scheduleMetaText}>
                            {formatLastTakenMessage(latestTakenAt)}
                          </Text>
                        ) : null}

                        {canSelectStatus ? (
                          <View style={styles.scheduleActionRow}>
                            <ActionButton
                              label="Taken"
                              onPress={(event) => {
                                event?.stopPropagation?.();
                                requestScheduleStatusChange(medicine, index, 'taken');
                              }}
                              variant={entry.status === 'taken' ? 'solid' : 'outline'}
                              style={styles.scheduleActionButton}
                            />
                            <ActionButton
                              label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
                              variant={entry.status === 'skipped' ? 'solid' : 'outline'}
                              onPress={(event) => {
                                event?.stopPropagation?.();
                                requestScheduleStatusChange(medicine, index, 'skipped');
                              }}
                              style={styles.scheduleActionButton}
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <LargePopup
        visible={isDetailsVisible && Boolean(selectedMedicine)}
        onClose={() => {
          setIsDetailsVisible(false);
        }}
        header={
          selectedMedicine ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Medicine Details</Text>
                <Text style={styles.detailsMedicineName}>{selectedMedicine.medName}</Text>
              </View>
              <View style={styles.detailActionsTop}>
                <EditButton onPress={openEditEditor} />
                <DeleteButton onPress={handleDeleteMedicine} />
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
      >
        {selectedMedicine ? (
          <>
            <DetailItem label="Medication name" value={selectedMedicine.medName} />
            <DetailItem label="Unit strength" value={selectedMedicine.unitStrength} />
            <DetailItem label="Total daily amount" value={`${selectedMedicine.totalDailyAmount} ${selectedMedicine.unit}`} />
            <DetailItem label="Start date" value={formatDate(selectedMedicine.startDate)} />
            <DetailItem label="End date" value={selectedMedicine.endDate ? formatDate(selectedMedicine.endDate) : 'Indefinite'} />
            <DetailItem label="Instructions" value={selectedMedicine.instructions || '--'} />
            <DetailItem
              label="Inventory count"
              value={selectedMedicine.inventoryCount === null ? '--' : String(selectedMedicine.inventoryCount)}
            />
            <DetailItem label="Prescriber contact" value={selectedMedicine.prescriberContact || '--'} />

            <View style={styles.scheduleSection}>
              <Text style={styles.sectionLabel}>Daily schedule</Text>
              {selectedMedicine.dailySched.map((entry, index) => {
                const scheduleStatus = getScheduleStatusStyle(selectedMedicine, index);
                const isTaken = scheduleStatus.status === 'taken';
                const now = new Date();
                const canSelectStatus = selectedMedicine.isScheduleActionAvailable(index, now, now);

                return (
                  <View
                    key={`${selectedMedicine.medEntryId}-schedule-${index}`}
                    style={[styles.scheduleCard, { backgroundColor: scheduleStatus.bgColor }]}
                  >
                    <View style={styles.scheduleCardRow}>
                      <ScheduleEntryText entry={entry} unit={selectedMedicine.unit} />
                      <View style={[styles.statusBadge, { backgroundColor: scheduleStatus.bgColor }]}>
                        <Text style={[styles.statusText, { color: scheduleStatus.textColor }]}>
                          {scheduleStatus.label}
                        </Text>
                      </View>
                    </View>

                    {isTaken ? (
                      <Text style={styles.scheduleMetaText}>
                        Taken {formatDateTime(entry.takenAt)}
                      </Text>
                    ) : null}

                    {canSelectStatus ? (
                      <View style={styles.scheduleActionRow}>
                        <ActionButton
                          label="Taken"
                          onPress={() => requestScheduleStatusChange(selectedMedicine, index, 'taken')}
                          variant={entry.status === 'taken' ? 'solid' : 'outline'}
                          style={styles.scheduleActionButton}
                        />
                        <ActionButton
                          label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
                          variant={entry.status === 'skipped' ? 'solid' : 'outline'}
                          onPress={() => requestScheduleStatusChange(selectedMedicine, index, 'skipped')}
                          style={styles.scheduleActionButton}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.footerActionsRow}>
              <ActionButton
                label="Close"
                variant="outline"
                onPress={() => {
                  setIsDetailsVisible(false);
                }}
              />
            </View>
          </>
        ) : null}
      </LargePopup>

      <LargePopup
        visible={editorMode === 'create' || editorMode === 'edit'}
        onClose={resetEditor}
        header={
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>{editorMode === 'edit' ? 'Edit Medicine' : 'Add Medicine'}</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.formColumn}>
          <InputBar
            placeholder="Name of the medicine"
            value={formState.medName}
            onChangeText={(value) => setFormState((current) => ({ ...current, medName: value }))}
          />
          <InputBar
            placeholder="Unit strength (e.g. 500 mg)"
            value={formState.unitStrength}
            onChangeText={(value) => setFormState((current) => ({ ...current, unitStrength: value }))}
          />
          <View style={styles.scheduleBuilder}>
            <Text style={styles.sectionLabel}>Unit</Text>
            <View style={styles.segmentRow}>
              {UNIT_OPTIONS.map((option) => (
                <SegmentButton
                  key={option}
                  label={option === 'custom' ? 'Custom' : option === 'ml' ? 'mL' : capitalize(option)}
                  selected={
                    option === 'custom' ? !['tablet', 'ml', 'units'].includes(formState.unit) : formState.unit === option
                  }
                  onPress={() =>
                    setFormState((current) => ({
                      ...current,
                      unit: option === 'custom' ? '' : option,
                    }))
                  }
                />
              ))}
            </View>
            {!['tablet', 'ml', 'units'].includes(formState.unit) ? (
              <InputBar
                placeholder="Custom unit"
                value={formState.unit}
                onChangeText={(value) => setFormState((current) => ({ ...current, unit: value }))}
              />
            ) : null}
          </View>
          <InputBar
            placeholder="Total daily amount"
            keyboardType="number-pad"
            value={formState.totalDailyAmount}
            onChangeText={(value) => setFormState((current) => ({ ...current, totalDailyAmount: value }))}
          />
          <NativeDateTimeField
            label="Start date"
            placeholder="Select start date"
            accessibilityLabel="Start date"
            value={formState.startDate}
            onChange={(value) => setFormState((current) => ({ ...current, startDate: value }))}
          />
          <NativeDateTimeField
            label="End date"
            placeholder="Select end date"
            accessibilityLabel="End date"
            value={formState.endDate}
            onChange={(value) => setFormState((current) => ({ ...current, endDate: value }))}
            optional
          />
          <InputBar
            placeholder="Instructions (optional)"
            value={formState.instructions}
            onChangeText={(value) => setFormState((current) => ({ ...current, instructions: value }))}
          />
          <InputBar
            placeholder="Inventory count (optional)"
            keyboardType="number-pad"
            value={formState.inventoryCount}
            onChangeText={(value) => setFormState((current) => ({ ...current, inventoryCount: value }))}
          />
          <InputBar
            placeholder="Prescriber contact (optional)"
            value={formState.prescriberContact}
            onChangeText={(value) => setFormState((current) => ({ ...current, prescriberContact: value }))}
          />
        </View>

        <View style={styles.scheduleBuilder}>
          <Text style={styles.sectionLabel}>Daily schedule entry</Text>
          <View style={styles.segmentRow}>
            <SegmentButton
              label="Time"
              selected={scheduleDraft.scheduleType === 'time'}
              onPress={() => setScheduleDraft((current) => ({ ...current, scheduleType: 'time' }))}
            />
            <SegmentButton
              label="Meal"
              selected={scheduleDraft.scheduleType === 'meal'}
              onPress={() => setScheduleDraft((current) => ({ ...current, scheduleType: 'meal' }))}
            />
          </View>

          <InputBar
            placeholder="Dose size"
            keyboardType="number-pad"
            value={scheduleDraft.doseSize}
            onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
          />

          {scheduleDraft.scheduleType === 'time' ? (
            <NativeDateTimeField
              mode="time"
              label="Scheduled time"
              placeholder="Select scheduled time"
              accessibilityLabel="Scheduled time"
              value={scheduleDraft.scheduledTime}
              onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
            />
          ) : (
            <>
              <View style={styles.segmentRow}>
                {MEAL_CONTEXT_OPTIONS.map((option) => (
                  <SegmentButton
                    key={option}
                    label={capitalize(option)}
                    selected={scheduleDraft.mealContext === option}
                    onPress={() => setScheduleDraft((current) => ({ ...current, mealContext: option }))}
                  />
                ))}
              </View>

              <View style={styles.segmentRow}>
                {ASSOCIATED_MEAL_OPTIONS.map((option) => (
                  <SegmentButton
                    key={option}
                    label={capitalize(option)}
                    selected={scheduleDraft.associatedMeal === option}
                    onPress={() => setScheduleDraft((current) => ({ ...current, associatedMeal: option }))}
                  />
                ))}
              </View>

              <NativeDateTimeField
                mode="time"
                label="Meal time"
                placeholder="Select meal time"
                accessibilityLabel="Meal time"
                value={scheduleDraft.mealTime}
                onChange={(value) => setScheduleDraft((current) => ({ ...current, mealTime: value }))}
              />
            </>
          )}

          <View style={styles.footerActionsRow}>
            {editingScheduleIndex !== null ? (
              <ActionButton
                label="Cancel edit"
                variant="outline"
                onPress={() => {
                  setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
                  setEditingScheduleIndex(null);
                }}
              />
            ) : null}
            <ActionButton
              label={editingScheduleIndex === null ? 'Add schedule item' : 'Update schedule item'}
              variant="solid"
              onPress={saveScheduleEntry}
            />
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.sectionLabel}>Added schedule items</Text>
          {scheduleEntries.length ? (
            scheduleEntries.map((entry, index) => (
              <View key={`${editorMode || 'create'}-schedule-${index}`} style={styles.scheduleCard}>
                <View style={styles.scheduleCardRow}>
                  <ScheduleEntryText entry={entry} unit={formState.unit} />
                  <View style={styles.scheduleEditActions}>
                    <EditButton onPress={() => editScheduleEntry(index)} />
                    <DeleteButton onPress={() => removeScheduleEntry(index)} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyScheduleText}>No schedule items added yet.</Text>
          )}
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.footerActionsRow}>
          <ActionButton label="Cancel" variant="outline" onPress={resetEditor} />
          <ActionButton
            label={editorMode === 'edit' ? 'Save Medicine' : 'Add Medicine'}
            variant="solid"
            onPress={saveMedicine}
          />
        </View>
      </LargePopup>

      <Modal
        visible={Boolean(pendingScheduleAction)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingScheduleAction(null)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setPendingScheduleAction(null)}>
          <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
            <DialogBox
              title="Change schedule status?"
              message="This schedule item already has a selected status. Confirm to change or clear it."
              actions={[
                { label: 'Cancel', variant: 'outline', onPress: () => setPendingScheduleAction(null) },
                { label: 'Confirm', variant: 'solid', onPress: confirmScheduleStatusChange },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="med" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SegmentButton({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: TOP_OVERLAY_HEIGHT,
    paddingBottom: 150,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  listSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  medicineListItem: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  medicineListHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  selectedMedicineCard: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  cardHeaderName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
  },
  cardHeaderBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
    paddingRight: spacing.sm,
  },
  cardHeaderMeta: {
    ...typography.bodySmall,
    color: colors.body,
  },
  schedulePreviewList: {
    gap: spacing.xxs,
    paddingTop: spacing.xxs,
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  detailsTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.title,
  },
  detailsHeaderRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    minHeight: moderateScale(72),
    paddingRight: 140,
  },
  detailsHeaderTextBlock: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  detailsMedicineName: {
    ...typography.body,
    color: colors.body,
    fontWeight: '600',
  },
  detailRow: {
    gap: spacing.xxs,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  detailValue: {
    ...typography.body,
    color: colors.body,
  },
  detailActionsTop: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formColumn: {
    gap: spacing.sm,
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: moderateScale(420),
  },
  stickyTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: TOP_OVERLAY_HEIGHT,
  },
  scheduleBuilder: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  scheduleSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  scheduleCardInList: {
    padding: spacing.sm,
  },
  scheduleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scheduleCardTitle: {
    ...typography.bodySmall,
    color: colors.body,
    flex: 1,
  },
  scheduleTextStrong: {
    fontWeight: '700',
  },
  scheduleMetaText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  scheduleActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  scheduleActionButton: {
    minWidth: moderateScale(82),
    flexGrow: 1,
  },
  scheduleEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyScheduleText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  toggleRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  segmentButton: {
    minHeight: moderateScale(40),
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  segmentButtonText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
  },
  segmentButtonTextSelected: {
    color: colors.brandText,
  },
});
