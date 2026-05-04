const normalizeRequiredString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new RangeError(`${fieldName} cannot be empty.`);
  }

  return trimmedValue;
};

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const normalizeOptionalDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return normalizeDate(value, fieldName);
};

const normalizeInteger = (value, fieldName, { allowZero = true, optional = false } = {}) => {
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

const normalizeTime = (value, fieldName) => {
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

const normalizeRequiredTime = (value, fieldName) => {
  const normalizedTime = normalizeTime(value, fieldName);
  if (!normalizedTime) {
    throw new RangeError(`${fieldName} is required.`);
  }

  return normalizedTime;
};

const normalizeMealContext = (value) => {
  const normalized = normalizeRequiredString(value, 'mealContext').toLowerCase();
  if (!['before', 'during', 'after'].includes(normalized)) {
    throw new RangeError('mealContext must be before, during, or after.');
  }

  return normalized;
};

const normalizeAssociatedMeal = (value) => {
  const normalized = normalizeRequiredString(value, 'associatedMeal').toLowerCase();
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(normalized)) {
    throw new RangeError('associatedMeal must be breakfast, lunch, dinner, or snack.');
  }

  return normalized;
};

const scheduleEffectiveTime = (entry) => entry.scheduledTime || entry.mealTime || '';

const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const dateTimeAtMinutes = (dateValue, minutes) => {
  const dateTime = new Date(dateValue.getTime());
  dateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return dateTime;
};

const DUE_NOW_GRACE_MINUTES = 3;
const SINGLE_SCHEDULE_UPCOMING_WINDOW_MINUTES = 60;

const getScheduleDateTime = (entry) => entry.takenAt || entry.skippedAt || null;

const isBeforeDay = (value, day) => {
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

const isBeforeCurrentDay = (currDate, currentDay) => {
  const activeDay = normalizeOptionalDate(currDate, 'currDate');
  if (!activeDay || !(currentDay instanceof Date)) {
    return false;
  }

  activeDay.setHours(0, 0, 0, 0);
  return activeDay.getTime() < currentDay.getTime();
};

const normalizeScheduleStatus = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return 'pending';
  }

  const normalized = normalizeRequiredString(value, fieldName).toLowerCase();
  if (!['pending', 'taken', 'skipped'].includes(normalized)) {
    throw new RangeError(`${fieldName} must be pending, taken, or skipped.`);
  }

  return normalized;
};

const normalizeOptionalDateTime = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = normalizeDate(value, fieldName);
  return parsedDate ? parsedDate.toISOString() : null;
};

const isSameDay = (firstValue, secondValue) => {
  const firstDate = normalizeOptionalDate(firstValue, 'firstDate');
  const secondDate = normalizeOptionalDate(secondValue, 'secondDate');
  if (!firstDate || !secondDate) {
    return false;
  }

  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);
  return firstDate.getTime() === secondDate.getTime();
};

const normalizeScheduleEntry = (entry, index) => {
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

const normalizeSchedule = (dailySched) => {
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

const sumDoseSizes = (dailySched) =>
  dailySched.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

const ensureDateRange = (startDate, endDate) => {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new RangeError('endDate must be the same as or later than startDate.');
  }
};

const normalizeTimesTaken = (timesTaken) => {
  if (!Array.isArray(timesTaken)) {
    throw new TypeError('timesTaken must be an array.');
  }

  return timesTaken.map((time, index) => normalizeTime(time, `timesTaken[${index}]`));
};

const ensureScheduleIndex = (dailySched, index) => {
  if (!Number.isInteger(index) || index < 0 || index >= dailySched.length) {
    throw new RangeError('scheduleIndex must point to an existing daily schedule item.');
  }
};

export default class MedEntry {
  constructor({
    medEntryId = '',
    medName,
    unitStrength,
    dosage,
    unit,
    quantityUnit,
    totalDailyAmount,
    amount,
    dailySched,
    startDate,
    endDate = null,
    instructions = '',
    prescriberContact = '',
    prescriber_contact = '',
    isTaken = false,
    timeTaken = null,
    dateTaken = null,
    timesTaken = [],
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.medEntryId = medEntryId === undefined || medEntryId === null ? '' : String(medEntryId).trim();
    this.medName = normalizeRequiredString(medName, 'medName');
    this.unitStrength = normalizeOptionalString(unitStrength ?? dosage, 'unitStrength');
    this.dosage = this.unitStrength;
    this.unit = normalizeRequiredString(unit ?? quantityUnit, 'unit');
    this.quantityUnit = this.unit;
    this.totalDailyAmount = normalizeInteger(totalDailyAmount ?? amount, 'totalDailyAmount', {
      allowZero: false,
    });
    this.amount = this.totalDailyAmount;
    this.dailySched = normalizeSchedule(dailySched);
    if (sumDoseSizes(this.dailySched) !== this.totalDailyAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }
    this.startDate = normalizeDate(startDate, 'startDate');
    this.endDate = normalizeOptionalDate(endDate, 'endDate');
    if (!this.startDate) {
      throw new RangeError('startDate is required.');
    }
    ensureDateRange(this.startDate, this.endDate);
    this.instructions = normalizeOptionalString(instructions, 'instructions');
    this.prescriberContact = normalizeOptionalString(prescriberContact || prescriber_contact, 'prescriberContact');
    this.isTaken = typeof isTaken === 'boolean' ? isTaken : (() => {
      throw new TypeError('isTaken must be a boolean.');
    })();
    this.timeTaken = normalizeTime(timeTaken, 'timeTaken') || null;
    this.dateTaken = normalizeOptionalDate(dateTaken, 'dateTaken');
    this.timesTaken = normalizeTimesTaken(timesTaken);
    this.createdAt = normalizeOptionalDate(createdAt, 'createdAt');
    this.updatedAt = normalizeOptionalDate(updatedAt, 'updatedAt');

    if (this.isTaken) {
      if (!this.timeTaken || !this.dateTaken) {
        throw new RangeError('timeTaken and dateTaken are required when isTaken is true.');
      }
    } else if (this.timeTaken || this.dateTaken) {
      throw new RangeError('timeTaken and dateTaken must be null when isTaken is false.');
    }

    const hasScheduleStatus = this.dailySched.some((entry) => entry.status !== 'pending');
    if (this.isTaken && !hasScheduleStatus) {
      const takenDateTime = new Date(this.dateTaken.getTime());
      const takenMinutes = toMinutes(this.timeTaken);
      if (takenMinutes !== null) {
        takenDateTime.setHours(Math.floor(takenMinutes / 60), takenMinutes % 60, 0, 0);
      }

      this.dailySched = this.dailySched.map((entry) => ({
        ...entry,
        status: 'taken',
        takenAt: takenDateTime.toISOString(),
        skippedAt: null,
      }));
    } else if (hasScheduleStatus) {
      this.syncTakenStatusFromSchedule();
    }
  }

  updateMedName(newMedName) {
    this.medName = normalizeRequiredString(newMedName, 'medName');
    return this.medName;
  }

  updateUnitStrength(newUnitStrength) {
    this.unitStrength = normalizeOptionalString(newUnitStrength, 'unitStrength');
    this.dosage = this.unitStrength;
    return this.unitStrength;
  }

  updateDosage(newDosage) {
    return this.updateUnitStrength(newDosage);
  }

  updateUnit(newUnit) {
    this.unit = normalizeRequiredString(newUnit, 'unit');
    this.quantityUnit = this.unit;
    return this.unit;
  }

  updateTotalDailyAmount(newTotalDailyAmount) {
    const nextAmount = normalizeInteger(newTotalDailyAmount, 'totalDailyAmount', {
      allowZero: false,
    });

    const currentScheduleTotal = sumDoseSizes(this.dailySched);
    if (currentScheduleTotal !== nextAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.totalDailyAmount = nextAmount;
    this.amount = this.totalDailyAmount;
    return this.totalDailyAmount;
  }

  updateAmount(newAmount) {
    return this.updateTotalDailyAmount(newAmount);
  }

  updateTotalDailyAmountAndDailySched(newTotalDailyAmount, newDailySched) {
    const nextAmount = normalizeInteger(newTotalDailyAmount, 'totalDailyAmount', {
      allowZero: false,
    });
    const nextSchedule = normalizeSchedule(newDailySched);

    if (sumDoseSizes(nextSchedule) !== nextAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.totalDailyAmount = nextAmount;
    this.amount = this.totalDailyAmount;
    this.dailySched = nextSchedule;
    this.syncTakenStatusFromSchedule();
    return this;
  }

  updateDailySched(newDailySched) {
    const nextSchedule = normalizeSchedule(newDailySched);
    if (sumDoseSizes(nextSchedule) !== this.totalDailyAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.dailySched = nextSchedule;
    this.syncTakenStatusFromSchedule();
    return [...this.dailySched];
  }

  updateStartDate(newStartDate) {
    const nextStartDate = normalizeDate(newStartDate, 'startDate');
    if (!nextStartDate) {
      throw new RangeError('startDate is required.');
    }

    ensureDateRange(nextStartDate, this.endDate);
    this.startDate = nextStartDate;
    return this.startDate;
  }

  updateEndDate(newEndDate) {
    const nextEndDate = normalizeOptionalDate(newEndDate, 'endDate');
    ensureDateRange(this.startDate, nextEndDate);
    this.endDate = nextEndDate;
    return this.endDate;
  }

  updateInstructions(newInstructions) {
    this.instructions = normalizeOptionalString(newInstructions, 'instructions');
    return this.instructions;
  }

  updatePrescriberContact(newPrescriberContact) {
    this.prescriberContact = normalizeOptionalString(newPrescriberContact, 'prescriberContact');
    return this.prescriberContact;
  }

  markTaken(takenAt = new Date()) {
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();
    const takenTime = normalizeTime(takenDateTime, 'takenAt');

    this.dailySched = this.dailySched.map((entry) => ({
      ...entry,
      status: 'taken',
      takenAt: takenDateTime.toISOString(),
      skippedAt: null,
    }));

    if (!this.timesTaken.includes(takenTime)) {
      this.timesTaken.push(takenTime);
    }

    this.isTaken = true;
    this.timeTaken = takenTime;
    this.dateTaken = takenDateTime;

    return this;
  }

  clearTakenStatus() {
    this.dailySched = this.dailySched.map((entry) => ({
      ...entry,
      status: 'pending',
      takenAt: null,
      skippedAt: null,
    }));
    this.isTaken = false;
    this.timeTaken = null;
    this.dateTaken = null;
    this.timesTaken = [];
    return this;
  }

  syncTakenStatusFromSchedule() {
    const takenEntries = this.dailySched.filter((entry) => entry.status === 'taken');
    const allEntriesTaken = this.dailySched.length > 0 && takenEntries.length === this.dailySched.length;
    this.isTaken = allEntriesTaken;

    if (!takenEntries.length) {
      this.timeTaken = null;
      this.dateTaken = null;
      this.timesTaken = [];
      return this;
    }

    const takenAtValues = takenEntries
      .map((entry) => normalizeOptionalDateTime(entry.takenAt, 'takenAt'))
      .filter(Boolean)
      .sort();
    const latestTakenAt = takenAtValues[takenAtValues.length - 1] || null;

    this.timesTaken = takenEntries
      .map((entry) => (entry.takenAt ? normalizeTime(new Date(entry.takenAt), 'takenAt') : ''))
      .filter(Boolean);

    if (allEntriesTaken && latestTakenAt) {
      const latestDate = new Date(latestTakenAt);
      this.timeTaken = normalizeTime(latestDate, 'takenAt');
      this.dateTaken = latestDate;
    } else {
      this.timeTaken = null;
      this.dateTaken = null;
    }

    return this;
  }

  markScheduleTaken(scheduleIndex, takenAt = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();

    this.dailySched[scheduleIndex] = {
      ...this.dailySched[scheduleIndex],
      status: 'taken',
      takenAt: takenDateTime.toISOString(),
      skippedAt: null,
    };

    this.syncTakenStatusFromSchedule();
    return this;
  }

  markScheduleSkipped(scheduleIndex, skippedAt = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const skippedDateTime = normalizeDate(skippedAt, 'skippedAt') ?? new Date();
    const currentStatus = this.getScheduleStatus(scheduleIndex, skippedDateTime, skippedDateTime);
    const missedDateTime =
      currentStatus === 'missed'
        ? this.getScheduleMissedDateTime(scheduleIndex, skippedDateTime)
        : null;
    const resolvedSkippedDateTime = missedDateTime || skippedDateTime;

    this.dailySched[scheduleIndex] = {
      ...this.dailySched[scheduleIndex],
      status: 'skipped',
      takenAt: null,
      skippedAt: resolvedSkippedDateTime.toISOString(),
    };

    this.syncTakenStatusFromSchedule();
    return this;
  }

  clearScheduleStatus(scheduleIndex) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);

    this.dailySched[scheduleIndex] = {
      ...this.dailySched[scheduleIndex],
      status: 'pending',
      takenAt: null,
      skippedAt: null,
    };

    this.syncTakenStatusFromSchedule();
    return this;
  }

  resetDailyScheduleStatusesIfNeeded(now = new Date()) {
    const currentDateTime = normalizeDate(now, 'now') ?? new Date();
    if (Number.isNaN(currentDateTime.getTime()) || !this.dailySched.length) {
      return false;
    }

    const firstScheduleMinutes = this.dailySched
      .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
      .filter((minutes) => minutes !== null)
      .sort((firstMinute, secondMinute) => firstMinute - secondMinute)[0];
    const currentMinutes = toMinutes(normalizeTime(currentDateTime, 'now'));

    const resetStartMinutes =
      this.dailySched.length === 1
        ? Math.max(0, firstScheduleMinutes - SINGLE_SCHEDULE_UPCOMING_WINDOW_MINUTES)
        : firstScheduleMinutes;

    if (firstScheduleMinutes === undefined || currentMinutes === null || currentMinutes < resetStartMinutes) {
      return false;
    }

    const currentDay = new Date(currentDateTime.getTime());
    currentDay.setHours(0, 0, 0, 0);

    let didReset = false;
    this.dailySched = this.dailySched.map((entry) => {
      if (entry.status === 'pending' || !isBeforeDay(getScheduleDateTime(entry), currentDay)) {
        return entry;
      }

      didReset = true;
      return {
        ...entry,
        status: 'pending',
        takenAt: null,
        skippedAt: null,
      };
    });

    if (didReset) {
      this.syncTakenStatusFromSchedule();
    }

    return didReset;
  }

  isActiveOnDate(currDate = new Date()) {
    const currentDay = normalizeOptionalDate(currDate, 'currDate');

    if (!currentDay) {
      return false;
    }

    const startDay = normalizeOptionalDate(this.startDate, 'startDate');
    const endDay = normalizeOptionalDate(this.endDate, 'endDate');

    if (startDay) {
      startDay.setHours(0, 0, 0, 0);
    }
    currentDay.setHours(0, 0, 0, 0);

    if (startDay && currentDay < startDay) {
      return false;
    }

    if (endDay) {
      endDay.setHours(0, 0, 0, 0);
      if (currentDay > endDay) {
        return false;
      }
    }

    return true;
  }

  getScheduleStatus(scheduleIndex, currTime = new Date(), currDate = new Date()) {
    this.resetDailyScheduleStatusesIfNeeded(currTime instanceof Date ? currTime : currDate);
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const scheduleEntry = this.dailySched[scheduleIndex];

    if (scheduleEntry.status === 'taken') {
      return 'taken';
    }

    if (scheduleEntry.status === 'skipped') {
      return 'skipped';
    }

    if (!this.isActiveOnDate(currDate)) {
      return 'upcoming';
    }

    const currentTime = currTime instanceof Date ? currTime : currTime || currDate;
    const currentDay = new Date(currentTime.getTime());
    currentDay.setHours(0, 0, 0, 0);
    if (isBeforeCurrentDay(currDate, currentDay)) {
      return 'missed';
    }

    const currentMinutes = toMinutes(normalizeTime(currentTime, 'currTime'));
    const scheduleMinutes = toMinutes(scheduleEffectiveTime(scheduleEntry));
    if (currentMinutes === null || scheduleMinutes === null) {
      return 'upcoming';
    }

    const laterScheduledMinutes = this.dailySched
      .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
      .filter((minutes) => minutes !== null && minutes > scheduleMinutes)
      .sort((firstMinute, secondMinute) => firstMinute - secondMinute);

    if (laterScheduledMinutes.length && currentMinutes >= laterScheduledMinutes[0]) {
      return 'missed';
    }

    if (currentMinutes >= scheduleMinutes + DUE_NOW_GRACE_MINUTES) {
      return 'pending';
    }

    return currentMinutes >= scheduleMinutes ? 'due' : 'upcoming';
  }

  getScheduleMissedDateTime(scheduleIndex, currTime = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const currentDateTime = normalizeDate(currTime, 'currTime') ?? new Date();
    const scheduleMinutes = toMinutes(scheduleEffectiveTime(this.dailySched[scheduleIndex]));
    if (scheduleMinutes === null) {
      return currentDateTime;
    }

    const laterScheduledMinutes = this.dailySched
      .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
      .filter((minutes) => minutes !== null && minutes > scheduleMinutes)
      .sort((firstMinute, secondMinute) => firstMinute - secondMinute);

    if (laterScheduledMinutes.length) {
      return dateTimeAtMinutes(currentDateTime, laterScheduledMinutes[0]);
    }

    const nextDay = new Date(currentDateTime.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    return nextDay;
  }

  isScheduleActionAvailable(scheduleIndex, currTime = new Date(), currDate = new Date()) {
    this.resetDailyScheduleStatusesIfNeeded(currTime instanceof Date ? currTime : currDate);
    ensureScheduleIndex(this.dailySched, scheduleIndex);

    if (!this.isActiveOnDate(currDate)) {
      return false;
    }

    const currentTime = currTime instanceof Date ? currTime : currTime || currDate;
    const currentMinutes = toMinutes(normalizeTime(currentTime, 'currTime'));
    const scheduleMinutes = toMinutes(scheduleEffectiveTime(this.dailySched[scheduleIndex]));
    if (currentMinutes === null || scheduleMinutes === null || currentMinutes < scheduleMinutes) {
      return false;
    }

    return true;
  }

  isDue(currTime, currDate = new Date()) {
    if (!this.isActiveOnDate(currDate) || !this.dailySched.length) {
      return false;
    }

    return this.dailySched.some((entry, index) => this.getScheduleStatus(index, currTime, currDate) === 'due');
  }

  isPending(currTime, currDate = new Date()) {
    if (!this.isActiveOnDate(currDate) || !this.dailySched.length) {
      return false;
    }

    return this.dailySched.some((entry, index) => this.getScheduleStatus(index, currTime, currDate) === 'pending');
  }

  isMissed(currTime, currDate = new Date()) {
    if (!this.isActiveOnDate(currDate) || !this.dailySched.length) {
      return false;
    }

    return this.dailySched.some((entry, index) => {
      const status = this.getScheduleStatus(index, currTime, currDate);
      return status === 'missed' || status === 'skipped';
    });
  }
}
