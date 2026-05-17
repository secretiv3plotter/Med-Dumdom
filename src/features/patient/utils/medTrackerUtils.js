import { colors } from '../../../shared/theme';
import { getThemeMode, THEME_MODE_DARK } from '../../../shared/theme/palette';

const isDarkMode = () => getThemeMode() === THEME_MODE_DARK;

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

export const formatDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
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

export const getIntervalMinutes = (entry) => {
  const value = Number(entry?.intervalMinutes || 0);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const isIntervalScheduleEntry = (entry) => getIntervalMinutes(entry) !== null;

export const formatIntervalMinutes = (intervalMinutes) => {
  const minutes = Number(intervalMinutes || 0);
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return '';
  }

  const hoursPart = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;
  const parts = [];

  if (hoursPart > 0) {
    parts.push(`${hoursPart} hour${hoursPart === 1 ? '' : 's'}`);
  }
  if (minutesPart > 0) {
    parts.push(`${minutesPart} minute${minutesPart === 1 ? '' : 's'}`);
  }

  return parts.join(' ');
};

export const getIntervalScheduleTime = (entry, now = new Date()) => {
  const intervalMinutes = getIntervalMinutes(entry);
  if (!intervalMinutes) {
    return '';
  }

  const occurrenceMinutes = getIntervalOccurrenceMinutes(entry, now);
  if (occurrenceMinutes === null) {
    return '';
  }

  const hours = Math.floor(occurrenceMinutes / 60);
  const minutes = occurrenceMinutes % 60;
  return formatTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
};

export const getIntervalOccurrenceMinutes = (entry, now = new Date()) => {
  const intervalMinutes = getIntervalMinutes(entry);
  if (!intervalMinutes) {
    return null;
  }

  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const activatedAt = entry?.activatedAt ? new Date(entry.activatedAt) : date;
  const firstDueAt = Number.isNaN(activatedAt.getTime())
    ? date
    : new Date(activatedAt.getTime() + intervalMinutes * 60000);
  if (date.getTime() < firstDueAt.getTime()) {
    return firstDueAt.getHours() * 60 + firstDueAt.getMinutes();
  }

  const elapsedIntervals = Math.floor((date.getTime() - firstDueAt.getTime()) / (intervalMinutes * 60000));
  const occurrenceDate = new Date(firstDueAt.getTime() + elapsedIntervals * intervalMinutes * 60000);
  return occurrenceDate.getHours() * 60 + occurrenceDate.getMinutes();
};

const getMinutesUntilNextIntervalOccurrence = (entry, now = new Date()) => {
  const intervalMinutes = getIntervalMinutes(entry);
  if (!intervalMinutes) {
    return null;
  }

  const currentDate = now instanceof Date ? now : new Date(now);
  const activatedAt = entry?.activatedAt ? new Date(entry.activatedAt) : currentDate;
  if (Number.isNaN(currentDate.getTime()) || Number.isNaN(activatedAt.getTime())) {
    return null;
  }

  const firstDueAt = new Date(activatedAt.getTime() + intervalMinutes * 60000);
  if (currentDate.getTime() < firstDueAt.getTime()) {
    return Math.max(0, Math.ceil((firstDueAt.getTime() - currentDate.getTime()) / 60000));
  }

  const elapsedIntervals = Math.floor((currentDate.getTime() - firstDueAt.getTime()) / (intervalMinutes * 60000));
  const occurrenceDate = new Date(firstDueAt.getTime() + elapsedIntervals * intervalMinutes * 60000);
  return Math.max(0, Math.floor((occurrenceDate.getTime() - currentDate.getTime()) / 60000));
};

export const scheduleEffectiveTime = (entry) => entry.scheduledTime || '';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const isScheduleEntryForDate = (entry, dateValue = new Date()) => {
  const date = dateValue instanceof Date ? new Date(dateValue.getTime()) : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (entry?.dayOfWeek) {
    return DAYS_OF_WEEK[date.getDay()] === entry.dayOfWeek;
  }

  if (entry?.monthOfYear) {
    if (MONTHS[date.getMonth()] !== entry.monthOfYear) {
      return false;
    }
  }

  if (entry?.dayOfMonth) {
    return date.getDate() === Number(entry.dayOfMonth);
  }

  return true;
};

export const getScheduleDayLabel = (entry) => {
  if (entry?.dayOfWeek) {
    return `on ${entry.dayOfWeek}`;
  }

  if (entry?.monthOfYear) {
    return entry.dayOfMonth ? `on ${entry.monthOfYear} ${entry.dayOfMonth}` : `in ${entry.monthOfYear}`;
  }

  return '';
};

export const getSchedulesEarliestToLatest = (dailySched = []) =>
  dailySched
    .map((entry, index) => ({
      entry,
      index,
      sortMinutes: isIntervalScheduleEntry(entry)
        ? Number.NEGATIVE_INFINITY
        : toMinutes(scheduleEffectiveTime(entry)) ?? Number.NEGATIVE_INFINITY,
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
    entry.doseSize,
    entry.scheduledTime,
    entry.intervalMinutes,
    entry.dayOfWeek,
    entry.monthOfYear,
    entry.dayOfMonth,
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
  if (isIntervalScheduleEntry(entry)) {
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nEvery ${formatIntervalMinutes(entry.intervalMinutes)}`;
  }

  return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAt ${formatTime(entry.scheduledTime)}`;
};

export const buildFormStateFromMedicine = (medicine) => ({
  medName: medicine.medName || '',
  unitStrength: medicine.unitStrength || '',
  unit: medicine.unit || '',
  totalDailyAmount: medicine.totalDailyAmount ? String(medicine.totalDailyAmount) : '',
  startDate: medicine.startDate ? formatDateInputValue(medicine.startDate) : '',
  endDate: medicine.endDate ? formatDateInputValue(medicine.endDate) : '',
  instructions: medicine.instructions || '',
  prescriberContact: medicine.prescriberContact || '',
});

export const buildScheduleEntriesFromMedicine = (medicine) =>
  Array.isArray(medicine.dailySched)
    ? medicine.dailySched.map((entry) => ({ ...entry }))
    : [];

export const buildScheduleDraftFromEntry = (entry) => ({
  doseSize: entry.doseSize ? String(entry.doseSize) : '',
  scheduledTime: entry.scheduledTime || '',
  intervalHours: entry.intervalMinutes ? Math.floor(Number(entry.intervalMinutes) / 60) : '',
  intervalMinutes: entry.intervalMinutes ? Number(entry.intervalMinutes) % 60 : '',
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth ? String(entry.dayOfMonth) : '',
});

export const getScheduleStatusStyle = (medicine, scheduleIndex, now = new Date()) => {
  const status = medicine.getScheduleStatus(scheduleIndex, now, now);

  if (isDarkMode()) {
    if (status === 'taken') {
      return { status, label: 'Taken', bgColor: '#0B1F3A', textColor: colors.brandText };
    }

    if (status === 'missed') {
      return { status, label: 'Missed', bgColor: '#2A1111', textColor: colors.error };
    }

    if (status === 'skipped') {
      return { status, label: 'Skipped', bgColor: colors.surface, textColor: colors.body };
    }

    if (status === 'due') {
      return { status, label: 'Due now', bgColor: '#0F2A1B', textColor: colors.success };
    }

    if (status === 'pending') {
      return { status, label: 'Pending', bgColor: '#2C2412', textColor: colors.warning };
    }

    return { status, label: 'Upcoming', bgColor: colors.surface, textColor: colors.body };
  }

  // Accessible color palette conforming to standard WCAG AA contrast ratio requirements
  if (status === 'taken') {
    return { status, label: 'Taken', bgColor: '#DBEAFE', textColor: '#1E40AF' }; // Sky Blue on Navy (contrast 6.3+)
  }

  if (status === 'missed') {
    return { status, label: 'Missed', bgColor: '#FEE2E2', textColor: '#991B1B' }; // Soft Red on Dark Crimson (contrast 6.5+)
  }

  if (status === 'skipped') {
    return { status, label: 'Skipped', bgColor: '#F3F4F6', textColor: '#374151' }; // Light Gray on Charcoal (neutral, contrast 6.0+)
  }

  if (status === 'due') {
    return { status, label: 'Due now', bgColor: '#D1FAE5', textColor: '#064E3B' }; // Mint Green on Forest Green (contrast 7.1+)
  }

  if (status === 'pending') {
    return { status, label: 'Pending', bgColor: '#FEF3C7', textColor: '#78350F' }; // Soft Amber on Deep Brown (contrast 6.1+)
  }

  return { status, label: 'Upcoming', bgColor: colors.surface, textColor: '#374151' };
};

export const isUpcomingScheduleTomorrow = (medicine, entry, statusStyle, now = new Date()) => {
  if (statusStyle.status !== 'upcoming') {
    return false;
  }

  const scheduleMinutes = toMinutes(scheduleEffectiveTime(entry));
  if (isIntervalScheduleEntry(entry)) {
    return false;
  }

  const currentMinutes = toMinutes(normalizeTimeInput(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`));
  if (scheduleMinutes === null || currentMinutes === null) {
    return false;
  }

  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);

  const hasDayConstraint = Boolean(entry?.dayOfWeek || entry?.monthOfYear || entry?.dayOfMonth);

  if (
    (!medicine.isActiveOnDate(now) || !isScheduleEntryForDate(entry, now)) &&
    medicine.isActiveOnDate(tomorrow) &&
    isScheduleEntryForDate(entry, tomorrow)
  ) {
    return true;
  }

  return !hasDayConstraint && medicine.isActiveOnDate(now) && currentMinutes >= scheduleMinutes;
};

export const completedScheduleStyle = {
  status: 'completed',
  label: 'Completed',
  bgColor: '#D1FAE5',
  textColor: '#064E3B',
};

export const missedPreviewStyle = {
  bgColor: '#FEE2E2',
  textColor: '#991B1B',
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

const findNextScheduleDate = (entry, now = new Date(), startOffset = 0) => {
  for (let offset = startOffset; offset <= 370; offset += 1) {
    const candidate = new Date(now.getTime());
    candidate.setDate(candidate.getDate() + offset);
    if (isScheduleEntryForDate(entry, candidate)) {
      candidate.setHours(0, 0, 0, 0);
      return candidate;
    }
  }

  const fallback = new Date(now.getTime());
  fallback.setHours(0, 0, 0, 0);
  return fallback;
};

const getNearestScheduleItem = (scheduleItems, now = new Date()) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = new Date(now.getTime());
  currentDay.setHours(0, 0, 0, 0);
  return [...scheduleItems]
    .map((item) => {
      const scheduleMinutes = toMinutes(scheduleEffectiveTime(item.entry));
      const minutesUntilInterval = getMinutesUntilNextIntervalOccurrence(item.entry, now);
      const hasDayConstraint = Boolean(item.entry?.dayOfWeek || item.entry?.monthOfYear || item.entry?.dayOfMonth);
      const startOffset = hasDayConstraint && isScheduleEntryForDate(item.entry, now) && scheduleMinutes !== null && currentMinutes > scheduleMinutes
        ? 1
        : 0;
      const nextScheduleDate = findNextScheduleDate(item.entry, now, startOffset);
      const daysUntilNext = Math.max(0, Math.round((nextScheduleDate.getTime() - currentDay.getTime()) / 86400000));
      const minutesUntilNext =
        minutesUntilInterval !== null
          ? minutesUntilInterval
          : scheduleMinutes === null
          ? Number.POSITIVE_INFINITY
          : daysUntilNext > 0
            ? daysUntilNext * 1440 + scheduleMinutes - currentMinutes
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
            textColor: isDarkMode() ? colors.body : '#374151',
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
    normalizeDuplicateKey(scheduleEffectiveTime(entry)),
    normalizeDuplicateKey(entry.intervalMinutes || ''),
    normalizeDuplicateKey(entry.dayOfWeek || ''),
    normalizeDuplicateKey(entry.monthOfYear || ''),
    normalizeDuplicateKey(entry.dayOfMonth || ''),
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
