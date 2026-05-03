// Put fields like:

// reminderId
// type Example: 'medication' or 'appointment'
// relatedEntryId The medication entry or appointment entry this reminder belongs to
// title
// message
// snoozeDateTime (snooze until this date/time)
// status Example: 'pending', 'completed', 'dismissed'

// Add:
// a constructor that assigns those fields
// Simple methods that belong in the model:

// markCompleted()
// dismissReminder()
// snoozeReminder()
// isMedicationReminder()
// isAppointmentReminder()

// Do not put these in Reminder:

// actual reminder popup code
// scheduling device reminders
// Firebase push reminder logic
// syncing with backend/local DB
// Those belong in a reminder service.
const REMINDER_TYPES = new Set(['medication', 'appointment']);
const REMINDER_STATUSES = new Set(['pending', 'completed', 'dismissed']);

const normalizeString = (value, fieldName, { allowEmpty = false } = {}) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (!allowEmpty && !trimmedValue) {
    throw new RangeError(`${fieldName} cannot be empty.`);
  }

  return trimmedValue;
};

const normalizeOptionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date or datetime.`);
  }

  return parsedDate;
};

const normalizeReminderType = (value) => {
  const type = normalizeString(value, 'type').toLowerCase();
  if (!REMINDER_TYPES.has(type)) {
    throw new RangeError(`type must be one of: ${Array.from(REMINDER_TYPES).join(', ')}.`);
  }

  return type;
};

const normalizeReminderStatus = (value) => {
  const status = normalizeString(value, 'status').toLowerCase();
  if (!REMINDER_STATUSES.has(status)) {
    throw new RangeError(`status must be one of: ${Array.from(REMINDER_STATUSES).join(', ')}.`);
  }

  return status;
};

const normalizeRelatedEntryId = (value) => {
  if (typeof value === 'string') {
    return normalizeString(value, 'relatedEntryId');
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError('relatedEntryId must be a non-empty string or a finite number.');
};

export default class Reminder {
  constructor({
    reminderId = '',
    type,
    relatedEntryId,
    title,
    message,
    snoozeDateTime = null,
    status = 'pending',
  } = {}) {
    this.reminderId = reminderId === undefined || reminderId === null ? '' : String(reminderId).trim();
    this.type = normalizeReminderType(type);
    this.relatedEntryId = normalizeRelatedEntryId(relatedEntryId);
    this.title = normalizeString(title, 'title');
    this.message = normalizeString(message, 'message');
    this.snoozeDateTime = normalizeOptionalDate(snoozeDateTime, 'snoozeDateTime');
    this.status = normalizeReminderStatus(status);
  }

  markCompleted() {
    this.status = 'completed';
    this.snoozeDateTime = null;
    return this;
  }

  dismissReminder() {
    this.status = 'dismissed';
    return this;
  }

  snoozeReminder(newSnoozeDateTime) {
    if (newSnoozeDateTime !== undefined) {
      this.snoozeDateTime = normalizeOptionalDate(newSnoozeDateTime, 'snoozeDateTime');
    }

    this.status = 'pending';
    return this;
  }

  isMedicationReminder() {
    return typeof this.type === 'string' && this.type.toLowerCase() === 'medication';
  }

  isAppointmentReminder() {
    return typeof this.type === 'string' && this.type.toLowerCase() === 'appointment';
  }
}
