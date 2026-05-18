import { colors } from '../../../shared/theme';
import { getThemeMode, THEME_MODE_DARK, transformThemeValue } from '../../../shared/theme/palette';

const isDarkMode = () => getThemeMode() === THEME_MODE_DARK;
const themeColor = (value, key) => transformThemeValue(value, undefined, key);
const statusStyle = (style) => ({
  ...style,
  bgColor: themeColor(style.bgColor, 'backgroundColor'),
  textColor: themeColor(style.textColor, 'color'),
});

export const capitalize = (value) => String(value || '')
  .trim()
  .replace(/^\w/, (char) => char.toUpperCase());

export const normalizeSearchText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\bskip+p?ed\b/g, 'missed skipped skip')
  .replace(/\bskips?\b/g, 'missed skipped skip')
  .replace(/\bmiss(?:ed|es)?\b/g, 'missed skipped skip');

export const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  const parsed = value instanceof Date ? value : new Date(`${value}T00:00:00`);
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
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return text || '--';
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

  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}, ${parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

export const formatDoseWithUnit = (doseSize, unit) => {
  const normalizedUnit = String(unit || '').trim();
  return normalizedUnit ? `${doseSize} ${normalizedUnit}` : String(doseSize);
};

export const formatIntervalMinutes = (intervalMinutes, intervalUnit = '') => {
  const minutes = Number(intervalMinutes || 0);
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return '';
  }

  if (intervalUnit === 'weeks' && minutes >= 10080 && minutes % 10080 === 0) {
    const weeksPart = minutes / 10080;
    return `${weeksPart} week${weeksPart === 1 ? '' : 's'}`;
  }

  if (intervalUnit === 'months') {
    return '';
  }

  if (minutes >= 1440 && minutes % 1440 === 0) {
    const daysPart = minutes / 1440;
    return `${daysPart} day${daysPart === 1 ? '' : 's'}`;
  }

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

export const isIntervalScheduleEntry = (entry) =>
  Number(entry?.intervalMinutes || 0) > 0 || (entry?.intervalUnit === 'months' && Number(entry?.intervalCount || 0) > 0);

export const isAsNeededScheduleEntry = (entry) => entry?.intervalUnit === 'asNeeded';

export const getTakenAmountForRecord = (record) =>
  (record.dailySchedFinalStatuses || []).reduce(
    (total, entry) => total + (entry.finalStatus === 'taken' ? Number(entry.doseSize || 0) : 0),
    0
  );

export const getTakenAmountForRecords = (records) =>
  (records || []).reduce((total, record) => total + getTakenAmountForRecord(record), 0);

export const formatTakenAmount = (records, unit, label = 'Taken') =>
  `${label}: ${formatDoseWithUnit(getTakenAmountForRecords(records), unit)}`;

export const getCalculatedDailyAmountForRecord = (record) => {
  const firstEntry = record.dailySchedFinalStatuses?.[0];
  if (firstEntry && isIntervalScheduleEntry(firstEntry)) {
    const doseSize = Number(firstEntry.doseSize || 0);
    const interval = Number(firstEntry.intervalMinutes || 0);
    if (interval > 0) {
      return Math.floor(1440 / interval) * doseSize;
    }
  }
  return record.totalDailyAmount;
};

export const formatMedicineMeta = (record) => {
  const dailyAmountText = `${getCalculatedDailyAmountForRecord(record)} ${record.unit} per day`;
  return record.unitStrength ? `${record.unitStrength} - ${dailyAmountText}` : dailyAmountText;
};

export const toHistoryDate = (historyDate) => {
  const parsed = new Date(`${historyDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const monthName = (monthIndex) =>
  new Date(2026, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });

export const getWeekStart = (date) => {
  const weekStart = new Date(date.getTime());
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const getWeekEnd = (weekStart) => {
  const weekEnd = new Date(weekStart.getTime());
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};

export const dateKey = (date) => date.toISOString().slice(0, 10);

export const getRecordDate = (record) => toHistoryDate(record.historyDate) ?? new Date(0);

export const formatScheduleText = (entry, unit) => {
  if (isAsNeededScheduleEntry(entry)) {
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAs needed`;
  }

  const dayLabel = entry.dayOfWeek
    ? ` on ${entry.dayOfWeek}`
    : entry.monthOfYear
      ? entry.dayOfMonth ? ` on ${entry.monthOfYear} ${entry.dayOfMonth}` : ` in ${entry.monthOfYear}`
      : '';
  if (isIntervalScheduleEntry(entry)) {
    const scheduledTimeText = entry.scheduledTime && entry.scheduledTime !== '00:00'
      ? `\nAt ${formatTime(entry.scheduledTime)}`
      : '';
    const intervalText = entry.intervalUnit === 'months'
      ? `${entry.intervalCount} month${Number(entry.intervalCount) === 1 ? '' : 's'}`
      : formatIntervalMinutes(entry.intervalMinutes, entry.intervalUnit);
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nEvery ${intervalText}${scheduledTimeText}${dayLabel}`;
  }

  return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAt ${formatTime(entry.scheduledTime)}${dayLabel}`;
};

export const buildHistoryRecordSearchText = (record) => {
  const recordDate = getRecordDate(record);
  const recordYear = recordDate.getFullYear();
  const recordMonth = Number.isNaN(recordDate.getTime()) ? '' : monthName(recordDate.getMonth());
  return [
    record.medName,
    record.unitStrength,
    record.unit,
    record.totalDailyAmount,
    record.instructions,
    record.prescriberContact,
    record.historyDate,
    formatDate(record.historyDate),
    recordYear,
    recordMonth,
    formatTakenAmount([record], record.unit, 'taken'),
    ...(record.dailySchedFinalStatuses || []).flatMap((entry) => [
      entry.finalStatus,
      entry.doseSize,
      entry.scheduledTime,
      entry.intervalMinutes,
      entry.dayOfWeek,
      entry.monthOfYear,
      entry.dayOfMonth,
      formatScheduleText(entry, record.unit),
      formatDateTime(entry.takenAt || entry.skippedAt || entry.resolvedAt),
    ]),
  ].filter((value) => value !== undefined && value !== null).map(normalizeSearchText).join(' ');
};

export const getStatusStyle = (status) => {
  if (isDarkMode()) {
    if (status === 'taken') {
      return statusStyle({ label: 'Taken', bgColor: '#0B1F3A', textColor: colors.brandText });
    }

    if (status === 'skipped') {
      return statusStyle({ label: 'Skipped', bgColor: colors.surface, textColor: colors.body });
    }

    return statusStyle({ label: 'Missed', bgColor: '#2C1E12', textColor: colors.warning });
  }

  if (status === 'taken') {
    return statusStyle({ label: 'Taken', bgColor: '#BFDBFE', textColor: '#1D4ED8' });
  }

  if (status === 'skipped') {
    return statusStyle({ label: 'Skipped', bgColor: '#E5E7EB', textColor: '#B91C1C' });
  }

  return statusStyle({ label: 'Missed', bgColor: '#FED7AA', textColor: '#9A3412' });
};

export const buildMedGroups = (records) =>
  Object.values(records.reduce((groups, record) => {
    const key = record.medEntryId || record.medName;
    const existingGroup = groups[key] || {
      key,
      medName: record.medName,
      unitStrength: record.unitStrength,
      unit: record.unit,
      totalDailyAmount: record.totalDailyAmount,
      startDate: record.startDate,
      endDate: record.endDate,
      instructions: record.instructions,
      prescriberContact: record.prescriberContact,
      latestDate: record.historyDate,
      records: [],
    };

    existingGroup.records.push(record);
    if (String(record.historyDate || '') > String(existingGroup.latestDate || '')) {
      existingGroup.latestDate = record.historyDate;
      existingGroup.medName = record.medName;
      existingGroup.unitStrength = record.unitStrength;
      existingGroup.unit = record.unit;
      existingGroup.totalDailyAmount = record.totalDailyAmount;
      existingGroup.startDate = record.startDate;
      existingGroup.endDate = record.endDate;
      existingGroup.instructions = record.instructions;
      existingGroup.prescriberContact = record.prescriberContact;
    }

    groups[key] = existingGroup;
    return groups;
  }, {})).sort((firstGroup, secondGroup) =>
    String(secondGroup.latestDate || '').localeCompare(String(firstGroup.latestDate || ''))
  );

export const uniqueDescending = (items) =>
  [...new Set(items)].sort((firstItem, secondItem) => secondItem - firstItem);

export const groupRecordsByWeek = (records) =>
  Object.values(records.reduce((groups, record) => {
    const recordDate = toHistoryDate(record.historyDate);
    if (!recordDate) {
      return groups;
    }

    const weekStart = getWeekStart(recordDate);
    const key = dateKey(weekStart);
    const existingGroup = groups[key] || {
      key,
      startDate: weekStart,
      endDate: getWeekEnd(weekStart),
      records: [],
    };

    existingGroup.records.push(record);
    groups[key] = existingGroup;
    return groups;
  }, {})).sort((firstWeek, secondWeek) => secondWeek.startDate.getTime() - firstWeek.startDate.getTime());
