import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import {
  ConfirmationDialogModal,
  MedicineDetailsPopup,
  MedicineEditorPopup,
  MedicineListSection,
  MedTrackerHeader,
  MedTrackerHeaderContent,
} from '../components/MedTrackerScreenLayout';
import { MEDICINE_EDITOR_STEPS, MEDICINE_SCHEDULE_TYPES } from '../constants/medTrackerEditorSteps';
import medTrackerService from '../../../domain/services/MedTrackerService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import { ROUTES } from '../../../app/navigation/routes';
import { colors } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';
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
  combineDateAndTime,
  getMedicineStatusForSorting,
} from '../utils/medTrackerUtils';

const DEFAULT_UNITS = [
  { unitId: 'def-mg', name: 'mg', isCustom: false },
  { unitId: 'def-capsule', name: 'capsule', isCustom: false },
];

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
  startTime: '',
  endDate: '',
  instructions: '',
  prescriberContact: '',
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysForMonth = (monthOfYear) => {
  const monthIndex = MONTHS.indexOf(monthOfYear);
  return monthIndex === -1 ? 31 : new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();
};

const oneMinuteBefore = (dateValue) => new Date(dateValue.getTime() - 60000);

const getInitialScheduleDraft = (scheduleType) => ({
  doseSize: '',
  scheduledTime: '',
  intervalHours: scheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY ? 1 : '',
  intervalMinutes: scheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY ? 0 : '',
  intervalDays: '',
  intervalWeeks: '',
  intervalMonths: '',
  dayOfWeek: '',
  monthOfYear: '',
  dayOfMonth: '',
});

const getScheduleTypeFromEntries = (entries = []) => {
  const hasWeeklyItem = entries.some((entry) => entry.dayOfWeek);
  const hasMonthlyItem = entries.some((entry) => entry.monthOfYear);
  const intervalItem = entries.find((entry) => entry.intervalMinutes || entry.intervalUnit === 'months');
  const hasAsNeededItem = entries.some((entry) => entry.intervalUnit === 'asNeeded');
  const hasEveryWeeksIntervalItem = intervalItem?.intervalUnit === 'weeks';
  const hasMonthlyIntervalItem = intervalItem?.intervalUnit === 'months';
  const hasEveryFewDaysIntervalItem = !hasEveryWeeksIntervalItem && Number(intervalItem?.intervalMinutes || 0) >= 1440;

  return hasAsNeededItem
    ? MEDICINE_SCHEDULE_TYPES.AS_NEEDED
    : intervalItem
    ? hasEveryWeeksIntervalItem
      ? MEDICINE_SCHEDULE_TYPES.REGULAR_EVERY_WEEKS
      : hasMonthlyIntervalItem
      ? MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY
      : hasEveryFewDaysIntervalItem
      ? MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY
      : MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY
    : hasMonthlyItem
    ? MEDICINE_SCHEDULE_TYPES.MONTHLY
    : hasWeeklyItem
      ? MEDICINE_SCHEDULE_TYPES.WEEKLY
      : MEDICINE_SCHEDULE_TYPES.DAILY;
};

const EMPTY_SCHEDULE_DRAFT = {
  doseSize: '',
  scheduledTime: '',
  intervalHours: '',
  intervalMinutes: '',
  intervalDays: '',
  intervalWeeks: '',
  intervalMonths: '',
  dayOfWeek: '',
  monthOfYear: '',
  dayOfMonth: '',
};

export default function MedTrackerScreen({ navigation, realm = null, trackerService = medTrackerService }) {
  const { currentUser } = useFirebase();
  const [version, setVersion] = useState(0);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [editorStep, setEditorStep] = useState(MEDICINE_EDITOR_STEPS.DETAILS);
  const [selectedScheduleType, setSelectedScheduleType] = useState(MEDICINE_SCHEDULE_TYPES.DAILY);
  const [originalScheduleType, setOriginalScheduleType] = useState(null);
  const [originalScheduleEntries, setOriginalScheduleEntries] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [scheduleDraft, setScheduleDraft] = useState(() => getInitialScheduleDraft(MEDICINE_SCHEDULE_TYPES.DAILY));
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [formError, setFormError] = useState('');
  const [pendingScheduleAction, setPendingScheduleAction] = useState(null);
  const [pendingDeleteMedicine, setPendingDeleteMedicine] = useState(null);
  const [pendingDeleteScheduleIndex, setPendingDeleteScheduleIndex] = useState(null);
  const [showConfirmSaveMedicine, setShowConfirmSaveMedicine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [footerNavHeight, setFooterNavHeight] = useState(0);
  const [observedNow, setObservedNow] = useState(() => new Date());
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();

  const activeMedTrackerService = useMemo(
    () => (realm ? new RealmMedTrackerRepository(realm) : trackerService),
    [realm, trackerService],
  );

  const medicines = useMemo(() => activeMedTrackerService.listMedEntries(currentUser.uid), [activeMedTrackerService, version]);

  useEffect(() => {
    if (!realm) return;

    try {
      const marker = realm.objectForPrimaryKey('MedUnit', 'seeded-marker');
      if (!marker) {
        realm.write(() => {
          realm.create('MedUnit', { unitId: 'seeded-marker', name: 'seeded-marker', isCustom: false });
          const defaults = ['mg', 'capsule'];
          defaults.forEach((name) => {
            realm.create('MedUnit', {
              unitId: `unit-${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name,
              isCustom: false,
            });
          });
        });
        refresh();
      } else {
        // Limit premade units to just mg and capsule for existing sessions
        const existing = Array.from(realm.objects('MedUnit')).filter((u) => !u.isCustom && u.unitId !== 'seeded-marker');
        const toRemove = existing.filter((u) => u.name !== 'mg' && u.name !== 'capsule');
        if (toRemove.length > 0) {
          realm.write(() => {
            toRemove.forEach((u) => {
              realm.delete(u);
            });
          });
          refresh();
        }
      }
    } catch (e) {
      console.warn('Failed to seed default medicine units:', e);
    }
  }, [realm]);

  const units = useMemo(() => {
    if (realm) {
      return new RealmMedUnitRepository(realm).listMedUnits();
    }
    return DEFAULT_UNITS;
  }, [realm, version]);

  const selectedMedicine = useMemo(
    () => medicines.find((medicine) => medicine.medEntryId === selectedMedicineId) || null,
    [medicines, selectedMedicineId]
  );

  const sortedMedicines = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    const visibleMedicines = normalizedQuery
      ? medicines.filter((medicine) => buildMedicineSearchText(medicine).includes(normalizedQuery))
      : medicines;

    const STATUS_RANKS = {
      due: 1,
      pending: 2,
      upcoming: 3,
      missed: 4,
      completed: 5,
    };

    return [...visibleMedicines].sort((left, right) => {
      const leftStatus = getMedicineStatusForSorting(left, observedNow);
      const rightStatus = getMedicineStatusForSorting(right, observedNow);

      const leftRank = STATUS_RANKS[leftStatus] || 99;
      const rightRank = STATUS_RANKS[rightStatus] || 99;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.medName.localeCompare(right.medName);
    });
  }, [medicines, searchQuery, observedNow]);

  const hasActiveSearch = useMemo(() => normalizeSearchText(searchQuery).length > 0, [searchQuery]);

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
    setEditorStep(MEDICINE_EDITOR_STEPS.DETAILS);
    setSelectedScheduleType(MEDICINE_SCHEDULE_TYPES.DAILY);
    setOriginalScheduleType(null);
    setOriginalScheduleEntries([]);
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(getInitialScheduleDraft(MEDICINE_SCHEDULE_TYPES.DAILY));
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
  };

  const openCreateEditor = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(getInitialScheduleDraft(MEDICINE_SCHEDULE_TYPES.DAILY));
    setScheduleEntries([]);
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
    setIsDetailsVisible(false);
    setEditorMode('create');
    setEditorStep(MEDICINE_EDITOR_STEPS.DETAILS);
    setSelectedScheduleType(MEDICINE_SCHEDULE_TYPES.DAILY);
    setOriginalScheduleType(null);
    setOriginalScheduleEntries([]);
  };

  const openEditEditor = () => {
    if (!selectedMedicine) {
      return;
    }

    setFormError('');
    setFormState(buildFormStateFromMedicine(selectedMedicine));
    const savedScheduleEntries = buildScheduleEntriesFromMedicine(selectedMedicine);
    setScheduleEntries(savedScheduleEntries);
    setOriginalScheduleEntries(savedScheduleEntries);

    const intervalItem = (selectedMedicine.dailySched || []).find((entry) => entry.intervalMinutes || entry.intervalUnit === 'months');
    const hasIntervalItem = Boolean(intervalItem);
    const hasEveryWeeksIntervalItem = intervalItem?.intervalUnit === 'weeks';
    const hasMonthlyIntervalItem = intervalItem?.intervalUnit === 'months';
    const hasEveryFewDaysIntervalItem = !hasEveryWeeksIntervalItem && Number(intervalItem?.intervalMinutes || 0) >= 1440;
    const targetScheduleType = getScheduleTypeFromEntries(savedScheduleEntries);

    if (hasIntervalItem) {
      if (intervalItem) {
        setScheduleDraft({
          doseSize: String(intervalItem.doseSize || ''),
          intervalHours: hasEveryFewDaysIntervalItem || hasEveryWeeksIntervalItem ? '' : String(Math.floor(Number(intervalItem.intervalMinutes || 0) / 60)),
          intervalMinutes: hasEveryFewDaysIntervalItem || hasEveryWeeksIntervalItem ? '' : String(Number(intervalItem.intervalMinutes || 0) % 60),
          intervalDays: hasEveryFewDaysIntervalItem ? String(Math.floor(Number(intervalItem.intervalMinutes || 0) / 1440)) : '',
          intervalWeeks: hasEveryWeeksIntervalItem ? String(Math.floor(Number(intervalItem.intervalMinutes || 0) / 10080)) : '',
          intervalMonths: hasMonthlyIntervalItem ? String(intervalItem.intervalCount || '') : '',
          dayOfMonth: hasMonthlyIntervalItem && intervalItem.dayOfMonth ? String(intervalItem.dayOfMonth) : '',
          scheduledTime: hasEveryFewDaysIntervalItem || hasEveryWeeksIntervalItem || hasMonthlyIntervalItem ? intervalItem.scheduledTime : '00:00',
        });
      } else {
        setScheduleDraft(getInitialScheduleDraft(targetScheduleType));
      }
    } else {
      setScheduleDraft(getInitialScheduleDraft(targetScheduleType));
    }
    setEditingScheduleIndex(null);
    setPendingDeleteScheduleIndex(null);
    setIsDetailsVisible(false);
    setEditorMode('edit');
    setEditorStep(MEDICINE_EDITOR_STEPS.DETAILS);
    setSelectedScheduleType(targetScheduleType);
    setOriginalScheduleType(targetScheduleType);
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

    activeMedTrackerService.deleteMedEntry(currentUser.uid, pendingDeleteMedicine.medEntryId);
    setPendingDeleteMedicine(null);
    setIsDetailsVisible(false);
    setSelectedMedicineId(null);
    refresh();
  };

  const handleAddUnit = (name) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;

    const lowercaseName = cleanName.toLowerCase();
    const existing = units.find((u) => u.name.toLowerCase() === lowercaseName);
    if (existing) {
      setFormState((current) => ({ ...current, unit: existing.name }));
      return;
    }

    const newUnit = {
      unitId: `unit-${lowercaseName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: lowercaseName,
      isCustom: true,
    };

    if (realm) {
      try {
        new RealmMedUnitRepository(realm).saveMedUnit(newUnit);
      } catch (e) {
        console.warn('Failed to save custom unit:', e);
      }
    } else {
      DEFAULT_UNITS.push(newUnit);
    }

    setFormState((current) => ({ ...current, unit: lowercaseName }));
    refresh();
  };

  const handleDeleteUnit = (unitId, unitName) => {
    if (realm) {
      try {
        new RealmMedUnitRepository(realm).deleteMedUnit(unitId);
      } catch (e) {
        console.warn('Failed to delete unit:', e);
      }
    }

    if (formState.unit.toLowerCase() === unitName.toLowerCase()) {
      setFormState((current) => ({ ...current, unit: '' }));
    }

    refresh();
  };

  const applyScheduleStatus = (medEntryId, scheduleIndex, targetStatus, currentStatus = 'pending') => {
    if (!medEntryId) {
      return;
    }

    if (targetStatus === 'clear' || currentStatus === targetStatus) {
      activeMedTrackerService.clearMedScheduleStatus(currentUser.uid, medEntryId, scheduleIndex);
    } else if (targetStatus === 'taken') {
      activeMedTrackerService.markMedScheduleTaken(currentUser.uid, medEntryId, scheduleIndex, new Date());
    } else {
      activeMedTrackerService.markMedScheduleSkipped(currentUser.uid, medEntryId, scheduleIndex, new Date());
    }

    refresh();
  };

  const requestScheduleStatusChange = (medicine, scheduleIndex, targetStatus) => {
    if (!medicine) {
      return;
    }

    const currentStatus = medicine.dailySched[scheduleIndex]?.status || 'pending';
    if (targetStatus === 'clear') {
      setPendingScheduleAction({
        medEntryId: medicine.medEntryId,
        medName: medicine.medName,
        scheduleIndex,
        targetStatus,
        currentStatus,
        mode: 'revert',
      });
      return;
    }

    if (currentStatus === 'taken' || currentStatus === 'skipped') {
      setPendingScheduleAction({
        medEntryId: medicine.medEntryId,
        medName: medicine.medName,
        scheduleIndex,
        targetStatus,
        currentStatus,
        mode: currentStatus === targetStatus ? 'revert' : 'change',
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

    const isHourly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY;
    const isWeeklyInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY;
    const isEveryWeeksInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_EVERY_WEEKS;
    const isMonthlyInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY;
    const isAsNeeded = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.AS_NEEDED;
    const isIntervalSchedule = isHourly || isWeeklyInterval || isEveryWeeksInterval || isMonthlyInterval;
    const hasIntervalSchedule = scheduleEntries.some((entry) => entry.intervalMinutes || entry.intervalUnit === 'months');

    const intervalTotalMinutes = isWeeklyInterval
      ? Number(scheduleDraft.intervalDays || 0) * 1440
      : isEveryWeeksInterval
      ? Number(scheduleDraft.intervalWeeks || 0) * 10080
      : isMonthlyInterval
      ? 0
      : Number(scheduleDraft.intervalHours || 0) * 60 + Number(scheduleDraft.intervalMinutes || 0);
    const scheduledTime = isIntervalSchedule || isAsNeeded ? '00:00' : normalizeTimeInput(scheduleDraft.scheduledTime);
    const combinedStart = combineDateAndTime(formState.startDate, isHourly ? formState.startTime : scheduledTime || '00:00') || new Date();
    const activatedAt = isIntervalSchedule
      ? isMonthlyInterval
        ? oneMinuteBefore(combinedStart).toISOString()
        : new Date(combinedStart.getTime() - intervalTotalMinutes * 60000).toISOString()
      : combinedStart.toISOString();
    const scheduleStatusDefaults = {
      status: 'pending',
      takenAt: null,
      skippedAt: null,
      activatedAt,
    };
    if (!scheduledTime) {
      setFormError('Enter a valid scheduled time.');
      return;
    }
    if (!isMonthlyInterval && isIntervalSchedule && intervalTotalMinutes <= 0) {
      setFormError(isWeeklyInterval ? 'Enter how many days between doses.' : isEveryWeeksInterval ? 'Enter how many weeks between doses.' : 'Select a time period greater than 00:00.');
      return;
    }
    if (isMonthlyInterval && !parsePositiveInteger(scheduleDraft.intervalMonths)) {
      setFormError('Enter how many months between doses.');
      return;
    }

    const isWeekly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.WEEKLY;
    const isMonthly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY || isMonthlyInterval;
    const dayOfWeek = isWeekly ? scheduleDraft.dayOfWeek : '';
    const monthOfYear = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY ? scheduleDraft.monthOfYear : '';
    const dayOfMonth = isMonthly ? parsePositiveInteger(scheduleDraft.dayOfMonth) : null;
    if (isWeekly && !dayOfWeek) {
      setFormError('Select a day of the week for the schedule item.');
      return;
    }
    if (selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY && !monthOfYear) {
      setFormError('Select a month for the schedule item.');
      return;
    }
    if (isMonthly && !dayOfMonth) {
      setFormError('Select a day for the schedule item.');
      return;
    }
    if (selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY && dayOfMonth > getDaysForMonth(monthOfYear)) {
      setFormError(`Select a valid day for ${monthOfYear}.`);
      return;
    }

    const nextEntry = {
      doseSize,
      scheduledTime,
      intervalMinutes: isIntervalSchedule && !isMonthlyInterval ? intervalTotalMinutes : null,
      intervalUnit: isAsNeeded ? 'asNeeded' : isWeeklyInterval ? 'days' : isEveryWeeksInterval ? 'weeks' : isMonthlyInterval ? 'months' : '',
      intervalCount: isMonthlyInterval ? parsePositiveInteger(scheduleDraft.intervalMonths) : null,
      dayOfWeek,
      monthOfYear,
      dayOfMonth,
      ...scheduleStatusDefaults,
    };

    if (isIntervalSchedule && hasIntervalSchedule) {
      setScheduleEntries([nextEntry]);
      setFormError('');
      setScheduleDraft(getInitialScheduleDraft(selectedScheduleType));
      return;
    }

    const nextEntries = [nextEntry];

    if (nextEntries.some((entry) => hasDuplicateScheduleEntry(scheduleEntries, entry, null))) {
      setFormError('This schedule item already exists.');
      return;
    }

    setScheduleEntries((current) => [...current, ...nextEntries]);
    setFormError('');
    setScheduleDraft(getInitialScheduleDraft(selectedScheduleType));
  };

  const saveInlineScheduleEntry = (indexToUpdate, updatedFields) => {
    const doseSize = parsePositiveInteger(updatedFields.doseSize);
    if (!doseSize) {
      return 'Enter a valid dose size.';
    }

    const isHourly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY;
    const isWeeklyInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY;
    const isEveryWeeksInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_EVERY_WEEKS;
    const isMonthlyInterval = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY;
    const isAsNeeded = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.AS_NEEDED;
    const isIntervalSchedule = isHourly || isWeeklyInterval || isEveryWeeksInterval || isMonthlyInterval;
    const hasOtherIntervalSchedule = isIntervalSchedule && scheduleEntries.some((entry, index) => (entry.intervalMinutes || entry.intervalUnit === 'months') && index !== indexToUpdate);
    if (hasOtherIntervalSchedule) {
      return isWeeklyInterval
        ? 'Only one every-few-days schedule item is allowed.'
        : isEveryWeeksInterval
        ? 'Only one weekly interval schedule item is allowed.'
        : isMonthlyInterval
        ? 'Only one monthly interval schedule item is allowed.'
        : 'Only one hourly schedule item is allowed.';
    }

    const intervalTotalMinutes = Number(updatedFields.intervalMinutes || 0);
    const scheduledTime = isIntervalSchedule || isAsNeeded ? '00:00' : normalizeTimeInput(updatedFields.scheduledTime);
    if (!scheduledTime) {
      return 'Enter a valid scheduled time.';
    }
    if (!isMonthlyInterval && isIntervalSchedule && intervalTotalMinutes <= 0) {
      return isWeeklyInterval ? 'Enter how many days between doses.' : isEveryWeeksInterval ? 'Enter how many weeks between doses.' : 'Select a time period greater than 00:00.';
    }
    if (isMonthlyInterval && !parsePositiveInteger(updatedFields.intervalCount)) {
      return 'Enter how many months between doses.';
    }

    const isWeekly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.WEEKLY;
    const isMonthly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY || isMonthlyInterval;
    const dayOfWeek = isWeekly ? updatedFields.dayOfWeek : '';
    const monthOfYear = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY ? updatedFields.monthOfYear : '';
    const dayOfMonth = isMonthly ? parsePositiveInteger(updatedFields.dayOfMonth) : null;
    if (isWeekly && !dayOfWeek) {
      return 'Select a day of the week.';
    }
    if (selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY && !monthOfYear) {
      return 'Select a month.';
    }
    if (isMonthly && !dayOfMonth) {
      return 'Select a day.';
    }
    if (selectedScheduleType === MEDICINE_SCHEDULE_TYPES.MONTHLY && dayOfMonth > getDaysForMonth(monthOfYear)) {
      return `Select a valid day for ${monthOfYear}.`;
    }

    const activatedAt = scheduleEntries[indexToUpdate]?.activatedAt || new Date().toISOString();
    const nextEntry = {
      ...scheduleEntries[indexToUpdate],
      doseSize,
      scheduledTime,
      intervalMinutes: isIntervalSchedule && !isMonthlyInterval ? intervalTotalMinutes : null,
      intervalUnit: isAsNeeded ? 'asNeeded' : isWeeklyInterval ? 'days' : isEveryWeeksInterval ? 'weeks' : isMonthlyInterval ? 'months' : '',
      intervalCount: isMonthlyInterval ? parsePositiveInteger(updatedFields.intervalCount) : null,
      dayOfWeek,
      monthOfYear,
      dayOfMonth,
      activatedAt,
    };

    if (hasDuplicateScheduleEntry(scheduleEntries, nextEntry, indexToUpdate)) {
      return 'This schedule item already exists.';
    }

    setScheduleEntries((current) =>
      current.map((entry, index) => (index === indexToUpdate ? nextEntry : entry))
    );
    setEditingScheduleIndex(null);
    return '';
  };

  const editScheduleEntry = (indexToEdit) => {
    const entry = scheduleEntries[indexToEdit];
    if (!entry) {
      return;
    }

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
        setScheduleDraft(getInitialScheduleDraft(selectedScheduleType));
        return null;
      }

      return current > indexToRemove ? current - 1 : current;
    });
    setPendingDeleteScheduleIndex(null);
  };

  const goToScheduleTypeStep = () => {
    const medName = formState.medName.trim();
    const unit = formState.unit.trim();

    if (!medName || !unit) {
      setFormError('Complete the required medicine details.');
      return;
    }

    setFormError('');
    setEditorStep(MEDICINE_EDITOR_STEPS.SCHEDULE_TYPE);
  };

  const goToScheduleStep = () => {
    if (
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.DAILY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.REGULAR_DAILY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.WEEKLY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.REGULAR_EVERY_WEEKS &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.MONTHLY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY &&
      selectedScheduleType !== MEDICINE_SCHEDULE_TYPES.AS_NEEDED
    ) {
      setFormError('Only hourly, daily, weekly, monthly, and as-needed schedules are available right now.');
      return;
    }

    setFormError('');
    setEditorStep(MEDICINE_EDITOR_STEPS.SCHEDULE);
  };

  const goToPreviousEditorStep = () => {
    setFormError('');
    setEditorStep((currentStep) => (
      currentStep === MEDICINE_EDITOR_STEPS.SCHEDULE
        ? MEDICINE_EDITOR_STEPS.SCHEDULE_TYPE
        : MEDICINE_EDITOR_STEPS.DETAILS
    ));
  };

  const saveMedicine = () => {
    const medName = formState.medName.trim();
    const unitStrength = formState.unitStrength.trim();
    const unit = formState.unit.trim();
    const isHourly = selectedScheduleType === MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY;
    const isIntervalSchedule = scheduleEntries.some((entry) => entry.intervalMinutes || entry.intervalUnit === 'months');
    const startDate = combineDateAndTime(formState.startDate, isHourly ? formState.startTime : '00:00');
    const endDateText = formState.endDate.trim();
    const endDate = endDateText ? parseDateInput(endDateText) : null;
    const instructions = formState.instructions.trim();
    const prescriberContact = formState.prescriberContact.trim();
    if (!medName || !unit || !startDate) {
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

    if (endDate && isBeforeDate(endDate, startOfToday())) {
      setFormError('End date must be today or a future date.');
      return;
    }

    if (endDate && isBeforeDate(endDate, startDate)) {
      setFormError('End date cannot be before start date.');
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

    let finalDailySched = scheduleEntries.map((entry) => {
      if (entry.intervalMinutes || entry.intervalUnit === 'months') {
        const intervalStartDate = combineDateAndTime(formState.startDate, isHourly ? formState.startTime : entry.scheduledTime) || startDate;
        return {
          ...entry,
          activatedAt: entry.intervalUnit === 'months'
            ? oneMinuteBefore(intervalStartDate).toISOString()
            : new Date(intervalStartDate.getTime() - entry.intervalMinutes * 60000).toISOString(),
        };
      }
      return entry;
    });

    if (editorMode === 'edit' && selectedMedicine && isIntervalSchedule) {
      const newDoseSize = finalDailySched[0].doseSize;
      const newInterval = finalDailySched[0].intervalMinutes;
      const newIntervalUnit = finalDailySched[0].intervalUnit || '';
      const newIntervalCount = finalDailySched[0].intervalCount || null;
      const newScheduledTime = finalDailySched[0].scheduledTime;
      const originalSched = selectedMedicine.dailySched || [];
      
      finalDailySched = originalSched.map((entry, index) => {
        if (entry.status === 'taken' || entry.status === 'skipped') {
          return {
            ...entry,
            doseSize: newDoseSize,
            intervalMinutes: newInterval,
            intervalUnit: newIntervalUnit,
            intervalCount: newIntervalCount,
            scheduledTime: newScheduledTime,
          };
        }
        
        let nextActivatedAt = null;
        if (index > 0) {
          const prevEntry = originalSched[index - 1];
          const prevActionTime = prevEntry.takenAt || prevEntry.skippedAt;
          if (prevActionTime) {
            nextActivatedAt = new Date(prevActionTime);
          }
        }
        
        if (!nextActivatedAt) {
          const intervalStartDate = combineDateAndTime(formState.startDate, isHourly ? formState.startTime : newScheduledTime) || startDate;
          nextActivatedAt = newIntervalUnit === 'months'
            ? oneMinuteBefore(intervalStartDate)
            : new Date(intervalStartDate.getTime() - newInterval * 60000);
        }

        return {
          ...entry,
          doseSize: newDoseSize,
          intervalMinutes: newInterval,
          intervalUnit: newIntervalUnit,
          intervalCount: newIntervalCount,
          scheduledTime: newScheduledTime,
          activatedAt: nextActivatedAt.toISOString(),
        };
      });
    }

    const totalDailyAmount = sumDoseSizes(finalDailySched);

    const payload = {
      medName,
      unitStrength,
      unit,
      totalDailyAmount,
      dailySched: finalDailySched,
      startDate,
      endDate,
      instructions,
      prescriberContact,
    };

    if (editorMode === 'edit' && selectedMedicine) {
      activeMedTrackerService.updateMedEntry(currentUser.uid, selectedMedicine.medEntryId, payload);
    } else {
      activeMedTrackerService.addMedEntry(currentUser.uid, payload);
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
        pinHeader={pinHeader}
      />

      <MedicineListSection
        footerNavHeight={footerNavHeight}
        medicines={sortedMedicines}
        hasActiveSearch={hasActiveSearch}
        observedNow={observedNow}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMedicine={(medicine) => {
          setSelectedMedicineId(medicine.medEntryId);
          setIsDetailsVisible(true);
        }}
        onReviewRecords={() => navigation?.navigate?.(ROUTES.MED_TRACKER_HISTORY)}
        onScheduleStatusChange={requestScheduleStatusChange}
        headerContent={!pinHeader ? <MedTrackerHeaderContent onCreate={openCreateEditor} /> : null}
        scrollHandlers={{
          onLayout: footerNav.onLayout,
          onContentSizeChange: footerNav.onContentSizeChange,
          onScroll: footerNav.onScroll,
        }}
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
        editorStep={editorStep}
        selectedScheduleType={selectedScheduleType}
        formState={formState}
        units={units}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        scheduleDraft={scheduleDraft}
        scheduleEntries={scheduleEntries}
        editingScheduleIndex={editingScheduleIndex}
        formError={formError}
        setFormState={setFormState}
        setScheduleDraft={setScheduleDraft}
        originalScheduleType={originalScheduleType}
        onSelectScheduleType={(value) => {
          setSelectedScheduleType(value);
          setScheduleDraft(getInitialScheduleDraft(value));
          setEditingScheduleIndex(null);
          if (editorMode === 'edit' && originalScheduleType) {
            setScheduleEntries(value === originalScheduleType ? originalScheduleEntries : []);
          }
          setFormError('');
        }}
        onCancelScheduleEdit={() => {
          setEditingScheduleIndex(null);
        }}
        onSaveScheduleEntry={saveScheduleEntry}
        onSaveInlineScheduleEntry={saveInlineScheduleEntry}
        onEditScheduleEntry={editScheduleEntry}
        onDeleteScheduleEntry={requestDeleteScheduleEntry}
        onCancel={resetEditor}
        onPreviousStep={goToPreviousEditorStep}
        onNextStep={editorStep === MEDICINE_EDITOR_STEPS.DETAILS ? goToScheduleTypeStep : goToScheduleStep}
        onSaveMedicine={() => { if (editorMode === 'edit') { setShowConfirmSaveMedicine(true); } else { saveMedicine(); } }}
      />

      {pendingScheduleAction ? (
        <ConfirmationDialogModal
          visible={true}
          title={pendingScheduleAction.mode === 'revert' ? 'Revert status?' : 'Change schedule status?'}
          message={
            pendingScheduleAction.mode === 'revert'
              ? `Are you sure to revert this schedule's status?`
              : 'This schedule item already has a selected status. Confirm to change it.'
          }
          confirmLabel={pendingScheduleAction.mode === 'revert' ? 'Revert' : 'Confirm'}
          onCancel={() => setPendingScheduleAction(null)}
          onConfirm={confirmScheduleStatusChange}
        />
      ) : null}

      {pendingDeleteMedicine ? (
        <ConfirmationDialogModal
          visible={true}
          title="Delete medicine?"
          message={`Delete ${pendingDeleteMedicine?.medName || 'this medicine'} from your med tracker? You can undo this later.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDeleteMedicine(null)}
          onConfirm={confirmDeleteMedicine}
        />
      ) : null}

      {pendingDeleteScheduleIndex !== null ? (
        <ConfirmationDialogModal
          visible={true}
          title="Delete schedule item?"
          message="Delete this schedule item? You can undo this later."
          confirmLabel="Delete"
          onCancel={() => setPendingDeleteScheduleIndex(null)}
          onConfirm={confirmDeleteScheduleEntry}
        />
      ) : null}

      {showConfirmSaveMedicine ? (
        <ConfirmationDialogModal
          visible={true}
          title="Save changes?"
          message="Are you sure you want to save your changes to this medicine?"
          confirmLabel="Save"
          onCancel={() => setShowConfirmSaveMedicine(false)}
          onConfirm={() => { setShowConfirmSaveMedicine(false); saveMedicine(); }}
        />
      ) : null}

      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[
          styles.footerNav,
          { backgroundColor: colors.pageBg, opacity: footerNav.isVisible ? 1 : 0 },
        ]}
        onLayout={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          setFooterNavHeight((currentHeight) => (
            currentHeight === nextHeight ? currentHeight : nextHeight
          ));
        }}
      >
        <NavigationBar
          selectedTab="med"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
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
