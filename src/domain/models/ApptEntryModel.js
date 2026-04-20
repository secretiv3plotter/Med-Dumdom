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

const normalizeDateString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string in YYYY-MM-DD format.`);
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) {
    throw new RangeError(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${trimmedValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError(`${fieldName} must be a valid calendar date.`);
  }

  return trimmedValue;
};

const normalizeTimeString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string, Date, or empty.`);
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new RangeError(`${fieldName} must use HH:MM 24-hour format.`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  return trimmedValue;
};

const parseDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
};

const toIsoStringOrNull = (value) => {
  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

export default class ApptEntry {
  constructor({
    apptEntryId = '',
    concern,
    address,
    contactNumber,
    contactNum = contactNumber,
    timeSched,
    dateSched,
    note = '',
    isCompleted = false,
    timeCompleted = null,
    dateCompleted = null,
    completedAt = null,
  } = {}) {
    this.apptEntryId = apptEntryId === undefined || apptEntryId === null ? '' : String(apptEntryId).trim();
    this.concern = normalizeRequiredString(concern, 'concern');
    this.address = normalizeRequiredString(address, 'address');
    this.contactNumber = normalizeRequiredString(contactNumber ?? contactNum, 'contactNumber');
    this.contactNum = this.contactNumber;
    this.timeSched = normalizeTimeString(timeSched, 'timeSched');
    this.dateSched = normalizeDateString(dateSched, 'dateSched');
    this.note = normalizeOptionalString(note, 'note');
    this.isCompleted = normalizeBoolean(isCompleted, 'isCompleted');
    this.timeCompleted = normalizeTimeString(timeCompleted, 'timeCompleted');
    this.dateCompleted = normalizeDateString(dateCompleted, 'dateCompleted');
    this.completedAt = completedAt ? toIsoStringOrNull(completedAt) : null;

    if (!this.dateSched || !this.timeSched) {
      throw new RangeError('dateSched and timeSched are required.');
    }

    if (this.isCompleted) {
      if (!this.completedAt && (!this.dateCompleted || !this.timeCompleted)) {
        throw new RangeError('Completed appointments require completedAt or dateCompleted/timeCompleted.');
      }
    } else if (this.completedAt || this.dateCompleted || this.timeCompleted) {
      throw new RangeError('Completed fields must be empty when isCompleted is false.');
    }
  }

  updateConcern(newConcern) {
    this.concern = normalizeRequiredString(newConcern, 'concern');
    return this.concern;
  }

  updateAddress(newAddress) {
    this.address = normalizeRequiredString(newAddress, 'address');
    return this.address;
  }

  updateContactNumber(newContactNumber) {
    this.contactNumber = normalizeRequiredString(newContactNumber, 'contactNumber');
    this.contactNum = this.contactNumber;
    return this.contactNumber;
  }

  updateTimeSched(newTimeSched) {
    const nextTimeSched = normalizeTimeString(newTimeSched, 'timeSched');
    if (!nextTimeSched || !this.dateSched) {
      throw new RangeError('timeSched must be valid.');
    }

    this.timeSched = nextTimeSched;
    return this.timeSched;
  }

  updateDateSched(newDateSched) {
    const nextDateSched = normalizeDateString(newDateSched, 'dateSched');
    if (!nextDateSched || !this.timeSched) {
      throw new RangeError('dateSched must be valid.');
    }

    this.dateSched = nextDateSched;
    return this.dateSched;
  }

  updateNote(newNote) {
    this.note = normalizeOptionalString(newNote, 'note');
    return this.note;
  }

  markCompleted(completedAt = new Date()) {
    const completedDateTime = completedAt instanceof Date ? completedAt : new Date(completedAt);
    if (Number.isNaN(completedDateTime.getTime())) {
      throw new RangeError('completedAt must be a valid date or datetime.');
    }

    this.isCompleted = true;
    this.timeCompleted = normalizeTimeString(completedDateTime, 'timeCompleted');
    this.dateCompleted = completedDateTime.toISOString().slice(0, 10);
    this.completedAt = toIsoStringOrNull(completedDateTime);

    return this;
  }

  clearCompletedStatus() {
    this.isCompleted = false;
    this.timeCompleted = null;
    this.dateCompleted = null;
    this.completedAt = null;
    return this;
  }

  getScheduledDateTime() {
    return parseDateTime(this.dateSched, this.timeSched);
  }

  getCompletedDateTime() {
    if (this.completedAt) {
      const completedDateTime = new Date(this.completedAt);
      if (!Number.isNaN(completedDateTime.getTime())) {
        return completedDateTime;
      }
    }

    return parseDateTime(this.dateCompleted, this.timeCompleted);
  }

  isDue(currTime, currDate = new Date()) {
    if (this.isCompleted) {
      return false;
    }

    const scheduledDateTime = this.getScheduledDateTime();
    if (!scheduledDateTime) {
      return false;
    }

    const currentDateTime =
      currTime instanceof Date
        ? currTime
        : parseDateTime(normalizeDateString(currDate, 'currDate'), normalizeTimeString(currTime, 'currTime')) ??
          new Date(currDate);

    if (Number.isNaN(currentDateTime.getTime())) {
      return false;
    }

    return currentDateTime.getTime() >= scheduledDateTime.getTime();
  }
}
