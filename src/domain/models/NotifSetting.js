// In NotifSetting.js, put:

// attributes for notification preferences, like:
// medRemindersEnabled
// apptRemindersEnabled
// medReminderTime
// apptReminderTime
// vibrationEnabled
// snoozeDuration
// a constructor that assigns them

// simple methods like:
// toggleMedReminders()
// toggleApptReminders()
// updateMedReminderTime(newTime)
// updateApptReminderTime(newTime)
// toggleVibration()
// updateSnoozeDuration(newDuration)

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
};

const normalizeTimeValue = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string, Date, or null.`);
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    throw new RangeError(`${fieldName} must be a valid time string.`);
  }

  return trimmedValue;
};

const normalizeSnoozeDuration = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new RangeError('snoozeDuration must be a non-negative number or null.');
  }

  return numericValue;
};

export default class NotifSetting {
  constructor({
    medRemindersEnabled = true,
    apptRemindersEnabled = true,
    medReminderTime = null,
    apptReminderTime = null,
    vibrationEnabled = true,
    snoozeDuration = null,
  } = {}) {
    this.medRemindersEnabled = normalizeBoolean(medRemindersEnabled, 'medRemindersEnabled');
    this.apptRemindersEnabled = normalizeBoolean(apptRemindersEnabled, 'apptRemindersEnabled');
    this.medReminderTime = normalizeTimeValue(medReminderTime, 'medReminderTime');
    this.apptReminderTime = normalizeTimeValue(apptReminderTime, 'apptReminderTime');
    this.vibrationEnabled = normalizeBoolean(vibrationEnabled, 'vibrationEnabled');
    this.snoozeDuration = normalizeSnoozeDuration(snoozeDuration);
  }

  toggleMedReminders() {
    if (typeof this.medRemindersEnabled !== 'boolean') {
      throw new TypeError('medRemindersEnabled must be a boolean before toggling.');
    }

    this.medRemindersEnabled = !this.medRemindersEnabled;
    return this;
  }

  toggleApptReminders() {
    if (typeof this.apptRemindersEnabled !== 'boolean') {
      throw new TypeError('apptRemindersEnabled must be a boolean before toggling.');
    }

    this.apptRemindersEnabled = !this.apptRemindersEnabled;
    return this;
  }

  updateMedReminderTime(newTime) {
    this.medReminderTime = normalizeTimeValue(newTime, 'medReminderTime');
    return this;
  }

  updateApptReminderTime(newTime) {
    this.apptReminderTime = normalizeTimeValue(newTime, 'apptReminderTime');
    return this;
  }

  toggleVibration() {
    if (typeof this.vibrationEnabled !== 'boolean') {
      throw new TypeError('vibrationEnabled must be a boolean before toggling.');
    }

    this.vibrationEnabled = !this.vibrationEnabled;
    return this;
  }

  updateSnoozeDuration(newDuration) {
    this.snoozeDuration = normalizeSnoozeDuration(newDuration);
    return this;
  }
}
