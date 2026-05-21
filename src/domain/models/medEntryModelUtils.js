export const DUE_NOW_GRACE_MINUTES = 3;
export const SINGLE_SCHEDULE_UPCOMING_WINDOW_MINUTES = 60;

export const normalizeRequiredString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new RangeError(`${fieldName} cannot be empty.`);
  }

  return trimmedValue;
};

export const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

export const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

export const normalizeOptionalDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return normalizeDate(value, fieldName);
};

export const normalizeInteger = (value, fieldName, { allowZero = true, optional = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return null;
    }

    throw new RangeError(`${fieldName} is required.`);
  }

  const rawValue = typeof value === 'number' ? value : Number(String(value).trim());
  const numericValue = Number.isInteger(rawValue)
    ? rawValue
    : (() => {
        const matchedNumber = String(value).match(/-?\d+/);
        return matchedNumber ? Number(matchedNumber[0]) : Number.NaN;
      })();
  if (!Number.isInteger(numericValue)) {
    throw new RangeError(`${fieldName} must be an integer.`);
  }

  if (numericValue < 0 || (!allowZero && numericValue === 0)) {
    throw new RangeError(`${fieldName} must be ${allowZero ? 'a non-negative integer' : 'a positive integer'}.`);
  }

  return numericValue;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysForMonth = (monthOfYear) => {
  const monthIndex = MONTHS.indexOf(monthOfYear);
  if (monthIndex === -1) {
    return 31;
  }

  return new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();
};

export const normalizeOptionalMonthOfYear = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const monthOfYear = normalizeRequiredString(value, fieldName);
  if (!MONTHS.includes(monthOfYear)) {
    throw new RangeError(`${fieldName} must be a valid month.`);
  }

  return monthOfYear;
};

export const normalizeOptionalDayOfMonth = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const dayOfMonth = normalizeInteger(value, fieldName, { allowZero: false });
  if (dayOfMonth > 31) {
    throw new RangeError(`${fieldName} must be between 1 and 31.`);
  }

  return dayOfMonth;
};

export const normalizeTime = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string or Date.`);
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      throw new RangeError(`${fieldName} must be a valid time.`);
    }

    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const normalizeRequiredTime = (value, fieldName) => {
  const normalizedTime = normalizeTime(value, fieldName);
  if (!normalizedTime) {
    throw new RangeError(`${fieldName} is required.`);
  }

  return normalizedTime;
};

export const scheduleEffectiveTime = (entry) => entry.scheduledTime || '';

export const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const getIntervalMinutes = (entry) => {
  const value = Number(entry?.intervalMinutes || 0);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const getIntervalCount = (entry) => {
  const value = Number(entry?.intervalCount || 0);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const isCalendarMonthIntervalEntry = (entry) => entry?.intervalUnit === 'months' && getIntervalCount(entry) !== null;

export const SCHEDULE_ENTRY_KINDS = {
  SCHEDULE: 'schedule',
  INTERVAL_RULE: 'intervalRule',
  INTERVAL_OCCURRENCE: 'intervalOccurrence',
};

export const isIntervalRuleEntry = (entry) =>
  entry?.scheduleKind === SCHEDULE_ENTRY_KINDS.INTERVAL_RULE ||
  (!entry?.scheduleKind && (getIntervalMinutes(entry) !== null || isCalendarMonthIntervalEntry(entry)));

export const isGeneratedIntervalOccurrenceEntry = (entry) =>
  entry?.scheduleKind === SCHEDULE_ENTRY_KINDS.INTERVAL_OCCURRENCE;

export const isIntervalScheduleEntry = (entry) => isIntervalRuleEntry(entry);

export const isAsNeededScheduleEntry = (entry) => entry?.intervalUnit === 'asNeeded';

const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const dateAtScheduledMonthDay = (year, monthIndex, dayOfMonth, scheduledTime) => {
  const [hours = 0, minutes = 0] = String(scheduledTime || '00:00').split(':').map(Number);
  const resolvedDay = Math.min(dayOfMonth, getDaysInMonth(year, monthIndex));
  const date = new Date(year, monthIndex, resolvedDay);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

const addMonthsFromAnchor = (anchorDate, monthOffset, dayOfMonth, scheduledTime) => {
  const anchorMonthIndex = anchorDate.getFullYear() * 12 + anchorDate.getMonth() + monthOffset;
  const year = Math.floor(anchorMonthIndex / 12);
  const monthIndex = anchorMonthIndex % 12;
  return dateAtScheduledMonthDay(year, monthIndex, dayOfMonth, scheduledTime);
};

export const getIntervalOccurrenceDateTime = (entry, dateValue = new Date()) => {
  if (isCalendarMonthIntervalEntry(entry)) {
    const currentDate = normalizeDate(dateValue, 'dateValue') ?? new Date();
    const activatedAt = normalizeDate(entry?.activatedAt, 'activatedAt') ?? currentDate;
    const intervalCount = getIntervalCount(entry);
    const dayOfMonth = Number(entry?.dayOfMonth || 1);
    if (!intervalCount || !Number.isInteger(dayOfMonth) || dayOfMonth < 1) {
      return null;
    }

    let elapsedMonths = (currentDate.getFullYear() - activatedAt.getFullYear()) * 12 + currentDate.getMonth() - activatedAt.getMonth();
    elapsedMonths = Math.max(0, Math.floor(elapsedMonths / intervalCount) * intervalCount);
    let occurrence = addMonthsFromAnchor(activatedAt, elapsedMonths, dayOfMonth, scheduleEffectiveTime(entry));
    if (occurrence > currentDate) {
      occurrence = addMonthsFromAnchor(activatedAt, elapsedMonths - intervalCount, dayOfMonth, scheduleEffectiveTime(entry));
    }
    return occurrence > activatedAt && occurrence <= currentDate ? occurrence : null;
  }

  const intervalMinutes = getIntervalMinutes(entry);
  if (!intervalMinutes) {
    return null;
  }

  const currentDate = normalizeDate(dateValue, 'dateValue') ?? new Date();
  const activatedAt = normalizeDate(entry?.activatedAt, 'activatedAt') ?? currentDate;
  const firstDueAt = new Date(activatedAt.getTime() + intervalMinutes * 60000);
  if (currentDate.getTime() < firstDueAt.getTime()) {
    return null;
  }

  const elapsedIntervals = Math.floor((currentDate.getTime() - firstDueAt.getTime()) / (intervalMinutes * 60000));
  return new Date(firstDueAt.getTime() + elapsedIntervals * intervalMinutes * 60000);
};

export const getIntervalOccurrenceMinutes = (entry, dateValue = new Date()) => {
  const occurrenceDate = getIntervalOccurrenceDateTime(entry, dateValue);
  return occurrenceDate ? occurrenceDate.getHours() * 60 + occurrenceDate.getMinutes() : null;
};

export const getIntervalNextOccurrenceDateTime = (entry, dateValue = new Date()) => {
  if (isCalendarMonthIntervalEntry(entry)) {
    const currentDate = normalizeDate(dateValue, 'dateValue') ?? new Date();
    const activatedAt = normalizeDate(entry?.activatedAt, 'activatedAt') ?? currentDate;
    const intervalCount = getIntervalCount(entry);
    const dayOfMonth = Number(entry?.dayOfMonth || 1);
    if (!intervalCount || !Number.isInteger(dayOfMonth) || dayOfMonth < 1) {
      return null;
    }

    const occurrence = getIntervalOccurrenceDateTime(entry, currentDate);
    if (!occurrence) {
      let first = addMonthsFromAnchor(activatedAt, 0, dayOfMonth, scheduleEffectiveTime(entry));
      if (first <= activatedAt) {
        first = addMonthsFromAnchor(activatedAt, intervalCount, dayOfMonth, scheduleEffectiveTime(entry));
      }
      return first;
    }

    const elapsedMonths = (occurrence.getFullYear() - activatedAt.getFullYear()) * 12 + occurrence.getMonth() - activatedAt.getMonth();
    return addMonthsFromAnchor(activatedAt, elapsedMonths + intervalCount, dayOfMonth, scheduleEffectiveTime(entry));
  }

  const intervalMinutes = getIntervalMinutes(entry);
  if (!intervalMinutes) {
    return null;
  }

  const currentDate = normalizeDate(dateValue, 'dateValue') ?? new Date();
  const activatedAt = normalizeDate(entry?.activatedAt, 'activatedAt') ?? currentDate;
  const firstDueAt = new Date(activatedAt.getTime() + intervalMinutes * 60000);
  if (currentDate.getTime() < firstDueAt.getTime()) {
    return firstDueAt;
  }

  const occurrence = getIntervalOccurrenceDateTime(entry, currentDate);
  return occurrence ? new Date(occurrence.getTime() + intervalMinutes * 60000) : firstDueAt;
};

export const getIntervalNextOccurrenceMinutes = (entry, dateValue = new Date()) => {
  const nextOccurrence = getIntervalNextOccurrenceDateTime(entry, dateValue);
  return nextOccurrence ? nextOccurrence.getHours() * 60 + nextOccurrence.getMinutes() : null;
};

export const isScheduleDateTimeInCurrentInterval = (entry, dateTimeValue, currentDateTime = new Date()) => {
  if (!isIntervalScheduleEntry(entry) || !dateTimeValue) {
    return false;
  }

  const actionDate = normalizeDate(dateTimeValue, 'dateTimeValue');
  const currentDate = normalizeDate(currentDateTime, 'currentDateTime') ?? new Date();
  if (!actionDate) {
    return false;
  }

  const actionDay = new Date(actionDate.getTime());
  const currentDay = new Date(currentDate.getTime());
  actionDay.setHours(0, 0, 0, 0);
  currentDay.setHours(0, 0, 0, 0);
  if (actionDay.getTime() !== currentDay.getTime()) {
    return false;
  }

  const occurrenceMinutes = getIntervalOccurrenceMinutes(entry, currentDate);
  const actionMinutes = actionDate.getHours() * 60 + actionDate.getMinutes();
  if (isCalendarMonthIntervalEntry(entry)) {
    const occurrenceDate = getIntervalOccurrenceDateTime(entry, currentDate);
    const nextOccurrenceDate = getIntervalNextOccurrenceDateTime(entry, currentDate);
    return occurrenceDate !== null &&
      actionDate >= occurrenceDate &&
      (!nextOccurrenceDate || actionDate < nextOccurrenceDate);
  }

  const nextOccurrenceMinutes = getIntervalNextOccurrenceMinutes(entry, currentDate);
  return occurrenceMinutes !== null &&
    actionMinutes >= occurrenceMinutes &&
    (nextOccurrenceMinutes === null || nextOccurrenceMinutes >= 1440 || actionMinutes < nextOccurrenceMinutes);
};

export const dateTimeAtMinutes = (dateValue, minutes) => {
  const dateTime = new Date(dateValue.getTime());
  dateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return dateTime;
};

export const getScheduleDateTime = (entry) => entry.takenAt || entry.skippedAt || null;

export const isBeforeDay = (value, day) => {
  if (!value || !(day instanceof Date)) {
    return true;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return true;
  }

  const parsedDay = new Date(parsedDate.getTime());
  parsedDay.setHours(0, 0, 0, 0);
  return parsedDay.getTime() < day.getTime();
};

export const isBeforeCurrentDay = (currDate, currentDay) => {
  const activeDay = normalizeOptionalDate(currDate, 'currDate');
  if (!activeDay || !(currentDay instanceof Date)) {
    return false;
  }

  activeDay.setHours(0, 0, 0, 0);
  return activeDay.getTime() < currentDay.getTime();
};

export const normalizeScheduleStatus = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return 'pending';
  }

  const normalized = normalizeRequiredString(value, fieldName).toLowerCase();
  if (!['pending', 'taken', 'skipped'].includes(normalized)) {
    throw new RangeError(`${fieldName} must be pending, taken, or skipped.`);
  }

  return normalized;
};

export const normalizeOptionalDateTime = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = normalizeDate(value, fieldName);
  return parsedDate ? parsedDate.toISOString() : null;
};

export const isSameDay = (firstValue, secondValue) => {
  const firstDate = normalizeOptionalDate(firstValue, 'firstDate');
  const secondDate = normalizeOptionalDate(secondValue, 'secondDate');
  if (!firstDate || !secondDate) {
    return false;
  }

  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);
  return firstDate.getTime() === secondDate.getTime();
};

export const normalizeScheduleEntry = (entry, index) => {
  if (typeof entry === 'string' || entry instanceof Date) {
    return {
      doseSize: 1,
      scheduledTime: normalizeRequiredTime(entry, `dailySched[${index}].scheduledTime`),
      intervalMinutes: null,
      intervalUnit: '',
      intervalCount: null,
      dayOfWeek: '',
      monthOfYear: '',
      dayOfMonth: null,
      instructions: '',
      status: 'pending',
      takenAt: null,
      skippedAt: null,
      activatedAt: null,
      scheduleKind: '',
      intervalRuleId: '',
      scheduledDate: '',
    };
  }

  if (!entry || typeof entry !== 'object') {
    throw new TypeError(`dailySched[${index}] must be an object, string, or Date.`);
  }

  const doseSize = normalizeInteger(entry.doseSize ?? entry.amount ?? 1, `dailySched[${index}].doseSize`, {
    allowZero: false,
  });
  const dayOfWeek = normalizeOptionalString(entry.dayOfWeek, `dailySched[${index}].dayOfWeek`);
  const monthOfYear = normalizeOptionalMonthOfYear(entry.monthOfYear, `dailySched[${index}].monthOfYear`);
  const dayOfMonth = normalizeOptionalDayOfMonth(entry.dayOfMonth, `dailySched[${index}].dayOfMonth`);
  const intervalMinutes = normalizeInteger(entry.intervalMinutes, `dailySched[${index}].intervalMinutes`, { optional: true, allowZero: false });
  const intervalUnit = normalizeOptionalString(entry.intervalUnit, `dailySched[${index}].intervalUnit`);
  const intervalCount = normalizeInteger(entry.intervalCount, `dailySched[${index}].intervalCount`, { optional: true, allowZero: false });
  if (monthOfYear && !dayOfMonth) {
    throw new RangeError(`dailySched[${index}].dayOfMonth is required for monthly schedules.`);
  }
  if (monthOfYear && dayOfMonth > getDaysForMonth(monthOfYear)) {
    throw new RangeError(`dailySched[${index}].dayOfMonth must be valid for ${monthOfYear}.`);
  }
  const instructions = normalizeOptionalString(entry.instructions, `dailySched[${index}].instructions`);
  const status = normalizeScheduleStatus(entry.status, `dailySched[${index}].status`);
  const takenAt = normalizeOptionalDateTime(entry.takenAt, `dailySched[${index}].takenAt`);
  const skippedAt = normalizeOptionalDateTime(entry.skippedAt, `dailySched[${index}].skippedAt`);
  const activatedAt = normalizeOptionalDateTime(entry.activatedAt ?? entry.createdAt, `dailySched[${index}].activatedAt`);
  const scheduleKind = normalizeOptionalString(entry.scheduleKind, `dailySched[${index}].scheduleKind`);
  const intervalRuleId = normalizeOptionalString(entry.intervalRuleId, `dailySched[${index}].intervalRuleId`);
  const scheduledDate = normalizeOptionalString(entry.scheduledDate, `dailySched[${index}].scheduledDate`);

  return {
    doseSize,
    scheduledTime: normalizeRequiredTime(
      entry.scheduledTime ?? entry.time ?? entry.mealTime,
      `dailySched[${index}].scheduledTime`
    ),
    intervalMinutes,
    intervalUnit,
    intervalCount,
    dayOfWeek,
    monthOfYear,
    dayOfMonth,
    instructions,
    status,
    takenAt,
    skippedAt,
    activatedAt,
    scheduleKind,
    intervalRuleId,
    scheduledDate,
  };
};

export const normalizeSchedule = (dailySched) => {
  if (dailySched === undefined || dailySched === null || dailySched === '') {
    throw new RangeError('dailySched cannot be empty.');
  }

  const scheduleItems = Array.isArray(dailySched)
    ? dailySched
    : typeof dailySched === 'string'
      ? dailySched.split(',').map((item) => item.trim()).filter(Boolean)
      : dailySched instanceof Date
        ? [dailySched]
        : (() => {
            throw new TypeError('dailySched must be a string, Date, or array.');
          })();

  const normalizedSchedule = scheduleItems.map((item, index) => normalizeScheduleEntry(item, index));
  if (!normalizedSchedule.length) {
    throw new RangeError('dailySched cannot be empty.');
  }

  return normalizedSchedule;
};

export const sumDoseSizes = (dailySched) =>
  dailySched.reduce((total, entry) => total + (isGeneratedIntervalOccurrenceEntry(entry) ? 0 : Number(entry.doseSize || 0)), 0);

export const ensureDateRange = (startDate, endDate) => {
  if (startDate && endDate) {
    const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (s.getTime() > e.getTime()) {
      throw new RangeError('endDate must be the same as or later than startDate.');
    }
  }
};

export const normalizeTimesTaken = (timesTaken) => {
  if (!Array.isArray(timesTaken)) {
    throw new TypeError('timesTaken must be an array.');
  }

  return timesTaken.map((time, index) => normalizeTime(time, `timesTaken[${index}]`));
};

export const ensureScheduleIndex = (dailySched, index) => {
  if (!Number.isInteger(index) || index < 0 || index >= dailySched.length) {
    throw new RangeError('scheduleIndex must point to an existing daily schedule item.');
  }
};
