import { colors } from '../../../shared/theme';

export const capitalize = (value) => String(value || '')
  .trim()
  .replace(/^\w/, (char) => char.toUpperCase());

export const parseDateInput = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const isBeforeDate = (date, minimumDate) => {
  if (!(date instanceof Date) || !(minimumDate instanceof Date)) {
    return false;
  }

  return date.getTime() < minimumDate.getTime();
};

export const formatDate = (value) => {
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

export const formatTime = (value) => {
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

export const normalizeTimeInput = (value) => {
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

export const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const scheduleEffectiveTime = (entry) => entry.scheduledTime || entry.mealTime || '';

export const getSchedulesEarliestToLatest = (dailySched = []) =>
  dailySched
    .map((entry, index) => ({
      entry,
      index,
      sortMinutes: toMinutes(scheduleEffectiveTime(entry)) ?? Number.NEGATIVE_INFINITY,
    }))
    .sort((first, second) => first.sortMinutes - second.sortMinutes || first.index - second.index);

export const getScheduleMissedDisplayTime = (medicine, entry, scheduleIndex, now = new Date()) => {
  if (entry.skippedAt) {
    return entry.skippedAt;
  }

  if (typeof medicine?.getScheduleMissedDateTime === 'function') {
    return medicine.getScheduleMissedDateTime(scheduleIndex, now);
  }

  return null;
};

export const normalizeSearchText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\bskip+p?ed\b/g, 'missed skipped skip')
  .replace(/\bskips?\b/g, 'missed skipped skip')
  .replace(/\bmiss(?:ed|es)?\b/g, 'missed skipped skip');

export const buildMedicineSearchText = (medicine) => [
  medicine.medName,
  medicine.unitStrength,
  medicine.unit,
  medicine.totalDailyAmount,
  medicine.instructions,
  medicine.prescriberContact,
  ...(medicine.dailySched || []).flatMap((entry) => [
    entry.scheduleType,
    entry.doseSize,
    entry.scheduledTime,
    entry.mealContext,
    entry.associatedMeal,
    entry.mealTime,
    entry.status,
  ]),
].filter((value) => value !== undefined && value !== null).map(normalizeSearchText).join(' ');

export const getSortTime = (value) => {
  if (!value) {
    return 0;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
};

export const parsePositiveInteger = (value) => {
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

export const formatDoseWithUnit = (doseSize, unit) => {
  const normalizedUnit = String(unit || '').trim();
  return normalizedUnit ? `${doseSize} ${normalizedUnit}` : String(doseSize);
};

export const formatScheduleEntry = (entry, unit = '') => {
  if (entry.scheduleType === 'meal') {
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\n${capitalize(entry.mealContext)} ${capitalize(entry.associatedMeal)} at ${formatTime(entry.mealTime)}`;
  }

  return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAt ${formatTime(entry.scheduledTime)}`;
};

export const buildFormStateFromMedicine = (medicine) => ({
  medName: medicine.medName || '',
  unitStrength: medicine.unitStrength || '',
  unit: medicine.unit || '',
  totalDailyAmount: medicine.totalDailyAmount ? String(medicine.totalDailyAmount) : '',
  startDate: medicine.startDate ? medicine.startDate.toISOString().slice(0, 10) : '',
  endDate: medicine.endDate ? medicine.endDate.toISOString().slice(0, 10) : '',
  instructions: medicine.instructions || '',
  prescriberContact: medicine.prescriberContact || '',
});

export const buildScheduleEntriesFromMedicine = (medicine) =>
  Array.isArray(medicine.dailySched)
    ? medicine.dailySched.map((entry) => ({ ...entry }))
    : [];

export const buildScheduleDraftFromEntry = (entry) => ({
  scheduleType: entry.scheduleType === 'meal' ? 'meal' : 'time',
  doseSize: entry.doseSize ? String(entry.doseSize) : '',
  scheduledTime: entry.scheduleType === 'time' ? entry.scheduledTime || '' : '',
  mealContext: entry.scheduleType === 'meal' ? entry.mealContext || 'after' : 'after',
  associatedMeal: entry.scheduleType === 'meal' ? entry.associatedMeal || 'breakfast' : 'breakfast',
  mealTime: entry.scheduleType === 'meal' ? entry.mealTime || '' : '',
});

export const getScheduleStatusStyle = (medicine, scheduleIndex, now = new Date()) => {
  const status = medicine.getScheduleStatus(scheduleIndex, now, now);

  if (status === 'taken') {
    return { status, label: 'Taken', bgColor: '#BFDBFE', textColor: '#1D4ED8' };
  }

  if (status === 'missed') {
    return { status, label: 'Missed', bgColor: '#FECACA', textColor: '#B91C1C' };
  }

  if (status === 'skipped') {
    return { status, label: 'Skipped', bgColor: '#E5E7EB', textColor: '#B91C1C' };
  }

  if (status === 'due') {
    return { status, label: 'Due now', bgColor: '#BBF7D0', textColor: '#15803D' };
  }

  if (status === 'pending') {
    return { status, label: 'Pending', bgColor: '#FEF08A', textColor: '#854D0E' };
  }

  return { status, label: 'Upcoming', bgColor: colors.surface, textColor: '#854D0E' };
};

export const isUpcomingScheduleTomorrow = (medicine, entry, statusStyle, now = new Date()) => {
  if (statusStyle.status !== 'upcoming') {
    return false;
  }

  const scheduleMinutes = toMinutes(scheduleEffectiveTime(entry));
  const currentMinutes = toMinutes(normalizeTimeInput(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`));
  if (scheduleMinutes === null || currentMinutes === null) {
    return false;
  }

  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!medicine.isActiveOnDate(now) && medicine.isActiveOnDate(tomorrow)) {
    return true;
  }

  return medicine.isActiveOnDate(now) && currentMinutes >= scheduleMinutes;
};

export const completedScheduleStyle = {
  status: 'completed',
  label: 'Completed',
  bgColor: '#DCFCE7',
  textColor: '#166534',
};

export const missedPreviewStyle = {
  bgColor: '#FED7AA',
  textColor: '#9A3412',
};

export const formatRelativeDateLabel = (value, now = new Date()) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const currentDay = new Date(now.getTime());
  currentDay.setHours(0, 0, 0, 0);

  const dateDay = new Date(date.getTime());
  dateDay.setHours(0, 0, 0, 0);

  const yesterday = new Date(currentDay.getTime());
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(currentDay.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateDay.getTime() === currentDay.getTime()) {
    return 'today';
  }

  if (dateDay.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }

  if (dateDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const timeText = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateText = formatRelativeDateLabel(date);
  const isRelativeDate = dateText === 'today' || dateText === 'tomorrow' || dateText === 'yesterday';

  return isRelativeDate ? `${timeText} ${dateText}` : `${timeText}, ${dateText}`;
};

export const formatTimeFromDateTime = (isoString) => {
  if (!isoString) {
    return '';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatLastTakenMessage = (isoString) => {
  if (!isoString) {
    return '';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timeText = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateText = formatRelativeDateLabel(date);

  if (dateText === 'today' || dateText === 'tomorrow' || dateText === 'yesterday') {
    return `Last taken at ${timeText} ${dateText}`;
  }

  return `Last taken at ${timeText} on ${dateText}`;
};

export const getLatestTakenAt = (medicine) => {
  const takenAtValues = (medicine.dailySched || [])
    .filter((entry) => entry.status === 'taken')
    .map((entry) => entry.takenAt)
    .filter(Boolean)
    .sort();

  return takenAtValues[takenAtValues.length - 1] || null;
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

const getMissedAmountToday = (medicine, scheduleItems) =>
  scheduleItems.reduce((total, { entry, statusStyle }) => {
    if (statusStyle.status !== 'missed' && statusStyle.status !== 'skipped') {
      return total;
    }

    return total + Number(entry.doseSize || 0);
  }, 0);

export const getStatusTimesSummary = (medicine, now = new Date()) => {
  const summary = {
    taken: [],
    missed: [],
  };

  (medicine.dailySched || []).forEach((entry, index) => {
    const statusStyle = getScheduleStatusStyle(medicine, index, now);
    if (statusStyle.status === 'taken') {
      summary.taken.push({
        timeText: formatTimeFromDateTime(entry.takenAt) || formatTime(scheduleEffectiveTime(entry)),
        sortMinutes: toMinutes(scheduleEffectiveTime(entry)) ?? Number.POSITIVE_INFINITY,
      });
    }
    if (statusStyle.status === 'skipped' || statusStyle.status === 'missed') {
      summary.missed.push({
        timeText:
          statusStyle.status === 'skipped'
            ? formatTimeFromDateTime(entry.skippedAt) || formatTime(scheduleEffectiveTime(entry))
            : formatTime(scheduleEffectiveTime(entry)),
        sortMinutes: toMinutes(scheduleEffectiveTime(entry)) ?? Number.POSITIVE_INFINITY,
      });
    }
  });

  summary.taken.sort((first, second) => first.sortMinutes - second.sortMinutes);
  summary.missed.sort((first, second) => first.sortMinutes - second.sortMinutes);
  return summary;
};

const getNearestScheduleItem = (scheduleItems, now = new Date()) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return [...scheduleItems]
    .map((item) => {
      const scheduleMinutes = toMinutes(scheduleEffectiveTime(item.entry));
      const minutesUntilNext =
        scheduleMinutes === null
          ? Number.POSITIVE_INFINITY
          : scheduleMinutes >= currentMinutes
            ? scheduleMinutes - currentMinutes
            : 1440 - currentMinutes + scheduleMinutes;

      return { ...item, minutesUntilNext };
    })
    .sort((firstItem, secondItem) => firstItem.minutesUntilNext - secondItem.minutesUntilNext)[0] || null;
};

export const getMedicinePreviewState = (medicine, now = new Date()) => {
  const scheduleItems = (medicine.dailySched || []).map((entry, index) => ({
    entry,
    index,
    statusStyle: getScheduleStatusStyle(medicine, index, now),
  }));

  const currentActiveItem = scheduleItems.find(({ index, statusStyle }) =>
    (statusStyle.status === 'due' || statusStyle.status === 'pending') &&
    medicine.isScheduleActionAvailable(index, now, now)
  );
  if (currentActiveItem) {
    return { type: 'schedules', items: [currentActiveItem] };
  }

  const upcomingItems = scheduleItems.filter(({ statusStyle }) => statusStyle.status === 'upcoming');
  if (upcomingItems.length) {
    return { type: 'schedules', items: [getNearestScheduleItem(upcomingItems, now)] };
  }

  if (isMedicineCompletedToday(medicine, now)) {
    return { type: 'completed' };
  }

  const missedAmount = getMissedAmountToday(medicine, scheduleItems);
  if (missedAmount > 0) {
    return { type: 'missed', missedAmount };
  }

  const nearestItem = getNearestScheduleItem(scheduleItems, now);
  if (nearestItem) {
    return {
      type: 'schedules',
      items: [
        {
          ...nearestItem,
          statusStyle: {
            status: 'upcoming',
            label: 'Upcoming',
            bgColor: colors.surface,
            textColor: '#854D0E',
          },
        },
      ],
    };
  }

  return { type: 'schedules', items: [] };
};

export const sumDoseSizes = (scheduleEntries) =>
  scheduleEntries.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

const normalizeDuplicateKey = (value) => String(value || '').trim().toLowerCase();

export const getMedicineDuplicateKey = ({ medName, unitStrength, unit }) =>
  [
    normalizeDuplicateKey(medName),
    normalizeDuplicateKey(unitStrength),
    normalizeDuplicateKey(unit),
  ].join('|');

export const formatMedicineMeta = (medicine) => {
  const dailyAmountText = `${medicine.totalDailyAmount} ${medicine.unit} per day`;
  return medicine.unitStrength ? `${medicine.unitStrength} • ${dailyAmountText}` : dailyAmountText;
};

export const getScheduleDuplicateKey = (entry) =>
  [
    normalizeDuplicateKey(entry.scheduleType),
    normalizeDuplicateKey(scheduleEffectiveTime(entry)),
    normalizeDuplicateKey(entry.mealContext),
    normalizeDuplicateKey(entry.associatedMeal),
  ].join('|');

export const hasDuplicateScheduleEntry = (scheduleEntries, nextEntry, editingIndex = null) => {
  const nextKey = getScheduleDuplicateKey(nextEntry);
  return scheduleEntries.some((entry, index) =>
    index !== editingIndex && getScheduleDuplicateKey(entry) === nextKey
  );
};

export const hasDuplicateSchedules = (scheduleEntries) => {
  const seenKeys = new Set();
  return scheduleEntries.some((entry) => {
    const key = getScheduleDuplicateKey(entry);
    if (seenKeys.has(key)) {
      return true;
    }

    seenKeys.add(key);
    return false;
  });
};
