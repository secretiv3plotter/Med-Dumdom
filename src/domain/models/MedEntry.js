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
  if (value === undefined || value === null) {
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

const startOfDay = (value) => {
  const parsedDate = normalizeDate(value, 'date');

  if (!parsedDate) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const isSameDay = (firstDate, secondDate) => {
  const first = startOfDay(firstDate);
  const second = startOfDay(secondDate);

  if (!first || !second) {
    return false;
  }

  return first.getTime() === second.getTime();
};

const formatTime = (value) => {
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
};

const parseTimeToMinutes = (value) => {
  if (value instanceof Date) {
    return value.getHours() * 60 + value.getMinutes();
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

const normalizeTimeValue = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const formattedTime = formatTime(value);
  if (parseTimeToMinutes(formattedTime) === null) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  return formattedTime;
};

const normalizeSchedule = (dailySched) => {
  let scheduleItems = [];

  if (Array.isArray(dailySched)) {
    scheduleItems = dailySched;
  } else if (typeof dailySched === 'string') {
    scheduleItems = dailySched.split(',');
  } else if (dailySched instanceof Date) {
    scheduleItems = [dailySched];
  } else {
    throw new TypeError('dailySched must be a string, Date, or array of times.');
  }

  const normalizedSchedule = scheduleItems
    .map((time) => normalizeTimeValue(time, 'dailySched'))
    .filter(Boolean);

  if (!normalizedSchedule.length) {
    throw new RangeError('dailySched cannot be empty.');
  }

  return normalizedSchedule;
};

const normalizeAmount = (value) => {
  const numericAmount = Number(value);
  if (!Number.isInteger(numericAmount) || numericAmount < 0) {
    throw new RangeError('amount must be a non-negative integer.');
  }

  return numericAmount;
};

const ensureDateRange = (startDate, endDate) => {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new RangeError('endDate must be the same as or later than startDate.');
  }
};

const normalizeTimesTaken = (timesTaken) => {
  if (!Array.isArray(timesTaken)) {
    throw new TypeError('timesTaken must be an array.');
  }

  return timesTaken.map((time) => normalizeTimeValue(time, 'timesTaken'));
};

export default class MedEntry {
  constructor({
    medEntryId = '',
    medName,
    dosage,
    amount,
    quantityUnit = '',
    dailySched,
    startDate,
    endDate,
    isTaken = false,
    timeTaken = null,
    dateTaken = null,
    timesTaken = [],
  } = {}) {
    this.medEntryId = medEntryId === undefined || medEntryId === null ? '' : String(medEntryId).trim();
    this.medName = normalizeRequiredString(medName, 'medName');
    this.dosage = normalizeRequiredString(dosage, 'dosage');
    this.amount = normalizeAmount(amount);
    this.quantityUnit = normalizeOptionalString(quantityUnit, 'quantityUnit');
    this.dailySched = normalizeSchedule(dailySched);
    this.startDate = normalizeDate(startDate, 'startDate');
    this.endDate = normalizeDate(endDate, 'endDate');
    if (!this.startDate || !this.endDate) {
      throw new RangeError('startDate and endDate are required.');
    }
    ensureDateRange(this.startDate, this.endDate);
    this.isTaken = typeof isTaken === 'boolean' ? isTaken : (() => {
      throw new TypeError('isTaken must be a boolean.');
    })();
    this.timeTaken = normalizeTimeValue(timeTaken, 'timeTaken');
    this.dateTaken = normalizeDate(dateTaken, 'dateTaken');
    this.timesTaken = normalizeTimesTaken(timesTaken);

    if (this.isTaken) {
      if (!this.timeTaken || !this.dateTaken) {
        throw new RangeError('timeTaken and dateTaken are required when isTaken is true.');
      }
    } else if (this.timeTaken || this.dateTaken) {
      throw new RangeError('timeTaken and dateTaken must be null when isTaken is false.');
    }
  }

  updateMedName(newMedName) {
    this.medName = normalizeRequiredString(newMedName, 'medName');
    return this.medName;
  }

  updateDosage(newDosage) {
    this.dosage = normalizeRequiredString(newDosage, 'dosage');
    return this.dosage;
  }

  updateAmount(newAmount) {
    this.amount = normalizeAmount(newAmount);
    return this.amount;
  }

  updateQuantityUnit(newUnit) {
    this.quantityUnit = normalizeOptionalString(newUnit, 'quantityUnit');
    return this.quantityUnit;
  }

  updateDailySched(newDailySched) {
    this.dailySched = normalizeSchedule(newDailySched);
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
    const nextEndDate = normalizeDate(newEndDate, 'endDate');
    if (!nextEndDate) {
      throw new RangeError('endDate is required.');
    }

    ensureDateRange(this.startDate, nextEndDate);
    this.endDate = nextEndDate;
    return this.endDate;
  }

  markTaken(takenAt = new Date()) {
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();
    const takenTime = normalizeTimeValue(takenDateTime, 'takenAt');

    if (!isSameDay(this.dateTaken, takenDateTime)) {
      this.timesTaken = [];
    }

    if (!this.timesTaken.includes(takenTime)) {
      this.timesTaken.push(takenTime);
    }

    this.isTaken = true;
    this.timeTaken = takenTime;
    this.dateTaken = takenDateTime;

    return this;
  }

  clearTakenStatus() {
    this.isTaken = false;
    this.timeTaken = null;
    this.dateTaken = null;
    this.timesTaken = [];
    return this;
  }

  isActiveOnDate(currDate = new Date()) {
    const currentDay = startOfDay(currDate);

    if (!currentDay) {
      return false;
    }

    const startDay = startOfDay(this.startDate);
    const endDay = startOfDay(this.endDate);

    if (startDay && currentDay < startDay) {
      return false;
    }

    if (endDay && currentDay > endDay) {
      return false;
    }

    return true;
  }

  isDue(currTime, currDate = new Date()) {
    if (!this.isActiveOnDate(currDate) || !this.dailySched.length) {
      return false;
    }

    const currentMinutes = parseTimeToMinutes(currTime instanceof Date ? currTime : currTime || currDate);
    if (currentMinutes === null) {
      return false;
    }

    const dueScheduleCount = this.dailySched.reduce((count, scheduleTime) => {
      const scheduleMinutes = parseTimeToMinutes(scheduleTime);
      return scheduleMinutes !== null && scheduleMinutes <= currentMinutes ? count + 1 : count;
    }, 0);

    if (dueScheduleCount === 0) {
      return false;
    }

    const takenCountForDate = isSameDay(this.dateTaken, currDate) ? this.timesTaken.length : 0;
    return takenCountForDate < dueScheduleCount;
  }
}
