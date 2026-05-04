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

export const normalizeMealContext = (value) => {
  const normalized = normalizeRequiredString(value, 'mealContext').toLowerCase();
  if (!['before', 'during', 'after'].includes(normalized)) {
    throw new RangeError('mealContext must be before, during, or after.');
  }

  return normalized;
};

export const normalizeAssociatedMeal = (value) => {
  const normalized = normalizeRequiredString(value, 'associatedMeal').toLowerCase();
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(normalized)) {
    throw new RangeError('associatedMeal must be breakfast, lunch, dinner, or snack.');
  }

  return normalized;
};

export const scheduleEffectiveTime = (entry) => entry.scheduledTime || entry.mealTime || '';

export const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
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
      scheduleType: 'time',
      doseSize: 1,
      scheduledTime: normalizeRequiredTime(entry, `dailySched[${index}].scheduledTime`),
      instructions: '',
      status: 'pending',
      takenAt: null,
      skippedAt: null,
      activatedAt: null,
    };
  }

  if (!entry || typeof entry !== 'object') {
    throw new TypeError(`dailySched[${index}] must be an object, string, or Date.`);
  }

  const normalizedType = normalizeOptionalString(entry.scheduleType ?? entry.type ?? entry.mode, `dailySched[${index}].scheduleType`).toLowerCase();
  const isMealBased =
    normalizedType === 'meal' ||
    normalizedType === 'meal-based' ||
    entry.mealContext !== undefined ||
    entry.associatedMeal !== undefined ||
    entry.mealTime !== undefined;

  const doseSize = normalizeInteger(entry.doseSize ?? entry.amount ?? 1, `dailySched[${index}].doseSize`, {
    allowZero: false,
  });
  const instructions = normalizeOptionalString(entry.instructions, `dailySched[${index}].instructions`);
  const status = normalizeScheduleStatus(entry.status, `dailySched[${index}].status`);
  const takenAt = normalizeOptionalDateTime(entry.takenAt, `dailySched[${index}].takenAt`);
  const skippedAt = normalizeOptionalDateTime(entry.skippedAt, `dailySched[${index}].skippedAt`);
  const activatedAt = normalizeOptionalDateTime(entry.activatedAt ?? entry.createdAt, `dailySched[${index}].activatedAt`);

  if (isMealBased) {
    return {
      scheduleType: 'meal',
      doseSize,
      mealContext: normalizeMealContext(entry.mealContext),
      associatedMeal: normalizeAssociatedMeal(entry.associatedMeal),
      mealTime: normalizeRequiredTime(entry.mealTime ?? entry.scheduledTime, `dailySched[${index}].mealTime`),
      instructions,
      status,
      takenAt,
      skippedAt,
      activatedAt,
    };
  }

  return {
    scheduleType: 'time',
    doseSize,
    scheduledTime: normalizeRequiredTime(
      entry.scheduledTime ?? entry.time ?? entry.mealTime,
      `dailySched[${index}].scheduledTime`
    ),
    instructions,
    status,
    takenAt,
    skippedAt,
    activatedAt,
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
  dailySched.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

export const ensureDateRange = (startDate, endDate) => {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new RangeError('endDate must be the same as or later than startDate.');
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
