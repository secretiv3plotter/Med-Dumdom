// In NotifSettingModel.js, put:

// attributes for notification preferences, like:
// medRemindersEnabled
// apptRemindersEnabled
// medReminderTime
// apptReminderTime
// vibrationEnabled
// medSnoozeDuration
// apptSnoozeDuration
// a constructor that assigns them

// simple methods like:
// toggleMedReminders()
// toggleApptReminders()
// updateMedReminderTime(newTime)
// updateApptReminderTime(newTime)
// toggleVibration()
// updateMedSnoozeDuration(newDuration)
// updateApptSnoozeDuration(newDuration)

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
};

const normalizeLeadMinutes = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new RangeError(`${fieldName} must be a non-negative number of minutes or null.`);
  }

  return numericValue;
};

const normalizeSnoozeDuration = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new RangeError(`${fieldName} must be a non-negative number of minutes or null.`);
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
    medSnoozeDuration = null,
    apptSnoozeDuration = null,
    snoozeDuration = null,
  } = {}) {
    this.medRemindersEnabled = normalizeBoolean(medRemindersEnabled, 'medRemindersEnabled');
    this.apptRemindersEnabled = normalizeBoolean(apptRemindersEnabled, 'apptRemindersEnabled');
    this.medReminderTime = normalizeLeadMinutes(medReminderTime, 'medReminderTime');
    this.apptReminderTime = normalizeLeadMinutes(apptReminderTime, 'apptReminderTime');
    this.vibrationEnabled = normalizeBoolean(vibrationEnabled, 'vibrationEnabled');
    this.medSnoozeDuration = normalizeSnoozeDuration(
      medSnoozeDuration ?? snoozeDuration,
      'medSnoozeDuration'
    );
    this.apptSnoozeDuration = normalizeSnoozeDuration(
      apptSnoozeDuration ?? snoozeDuration,
      'apptSnoozeDuration'
    );
    this.snoozeDuration = this.medSnoozeDuration;
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
    this.medReminderTime = normalizeLeadMinutes(newTime, 'medReminderTime');
    return this;
  }

  updateApptReminderTime(newTime) {
    this.apptReminderTime = normalizeLeadMinutes(newTime, 'apptReminderTime');
    return this;
  }

  toggleVibration() {
    if (typeof this.vibrationEnabled !== 'boolean') {
      throw new TypeError('vibrationEnabled must be a boolean before toggling.');
    }

    this.vibrationEnabled = !this.vibrationEnabled;
    return this;
  }

  updateMedSnoozeDuration(newDuration) {
    this.medSnoozeDuration = normalizeSnoozeDuration(newDuration, 'medSnoozeDuration');
    this.snoozeDuration = this.medSnoozeDuration;
    return this;
  }

  updateApptSnoozeDuration(newDuration) {
    this.apptSnoozeDuration = normalizeSnoozeDuration(newDuration, 'apptSnoozeDuration');
    return this;
  }

  updateSnoozeDuration(newDuration) {
    return this.updateMedSnoozeDuration(newDuration);
  }
}
