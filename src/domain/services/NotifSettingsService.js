// NotificationSettingsService
// Role:
// Own the business logic for notification preferences and reminder-related settings.
// This service should coordinate how reminder preferences affect due notifications.
//
// What belongs here:
// - exposing notification settings for the current user
// - toggling medication reminders
// - toggling appointment reminders
// - updating medication reminder time
// - updating appointment reminder time
// - toggling vibration
// - updating medication snooze duration
// - updating appointment snooze duration
// - deciding whether a reminder should surface as a notification
//
// Use cases covered:
// - patient manages settings/preferences
// - reminder behavior depends on the user's notification settings
//
// What should NOT belong here:
// - actual device notification APIs
// - push notification delivery
// - Realm persistence details
// - UI switch/toggle rendering
//
// Model methods this service should wrap:
// - toggleMedReminders()
// - toggleApptReminders()
// - updateMedReminderTime(newTime)
// - updateApptReminderTime(newTime)
// - toggleVibration()
// - updateMedSnoozeDuration(newDuration)
// - updateApptSnoozeDuration(newDuration)
//
// Suggested service methods:
// - getSettings(userId)
// - toggleMedReminders(userId)
// - toggleApptReminders(userId)
// - updateMedReminderTime(userId, newTime)
// - updateApptReminderTime(userId, newTime)
// - toggleVibration(userId)
// - updateMedSnoozeDuration(userId, duration)
// - updateApptSnoozeDuration(userId, duration)
// - shouldTriggerNotification(entry, settings, now)
//
// Notes:
// - this service should work with the NotifSettingModel
// - do not add settings fields unless they exist in NotifSettingModel too
// - actual scheduling and delivery should live in a later notification adapter/service
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: ReminderService, notification UI

import NotifSetting from '../models/NotifSettingModel';

const cloneSettings = (settings) =>
  new NotifSetting({
    medRemindersEnabled: settings.medRemindersEnabled,
    apptRemindersEnabled: settings.apptRemindersEnabled,
    medReminderTime: settings.medReminderTime,
    apptReminderTime: settings.apptReminderTime,
    vibrationEnabled: settings.vibrationEnabled,
    medSnoozeDuration: settings.medSnoozeDuration,
    apptSnoozeDuration: settings.apptSnoozeDuration,
  });

const normalizeUserId = (userId) => {
  if (typeof userId === 'string') {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      throw new RangeError('userId cannot be empty.');
    }

    return trimmedUserId;
  }

  if (typeof userId === 'number' && Number.isFinite(userId)) {
    return String(userId);
  }

  throw new TypeError('userId must be a non-empty string or a finite number.');
};

const normalizeNow = (now) => {
  const parsedNow = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(parsedNow.getTime())) {
    throw new RangeError('now must be a valid date or datetime.');
  }

  return parsedNow;
};

const toSettingsModel = (settings) => {
  if (settings instanceof NotifSetting) {
    return cloneSettings(settings);
  }

  if (settings && typeof settings === 'object') {
    return new NotifSetting(settings);
  }

  return new NotifSetting();
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getScheduledDateTime = (entry, now) => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const reminderDueAt = parseDateValue(entry.dueAt);
  if (reminderDueAt) {
    return reminderDueAt;
  }

  if (typeof entry.getScheduledDateTime === 'function') {
    const scheduledDateTime = parseDateValue(entry.getScheduledDateTime());
    if (scheduledDateTime) {
      return scheduledDateTime;
    }
  }

  if (
    typeof entry.dateSched === 'string' &&
    entry.dateSched.trim() &&
    typeof entry.timeSched === 'string' &&
    entry.timeSched.trim()
  ) {
    const scheduledDateTime = parseDateValue(`${entry.dateSched.trim()}T${entry.timeSched.trim()}:00`);
    if (scheduledDateTime) {
      return scheduledDateTime;
    }
  }

  if (typeof entry.dateSched === 'string' && entry.dateSched.trim()) {
    const scheduledDate = parseDateValue(`${entry.dateSched.trim()}T00:00:00`);
    if (scheduledDate) {
      return scheduledDate;
    }
  }

  return null;
};

const normalizeLeadMinutes = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const buildReminderGate = (entry, leadMinutes, now) => {
  const scheduledDateTime = getScheduledDateTime(entry, now);
  const normalizedLeadMinutes = normalizeLeadMinutes(leadMinutes);
  if (!scheduledDateTime || normalizedLeadMinutes === null) {
    return null;
  }

  return new Date(scheduledDateTime.getTime() - normalizedLeadMinutes * 60 * 1000);
};

const inferEntryType = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  if (typeof entry.isMedicationReminder === 'function' && entry.isMedicationReminder()) {
    return 'medication';
  }

  if (typeof entry.isAppointmentReminder === 'function' && entry.isAppointmentReminder()) {
    return 'appointment';
  }

  const explicitType = typeof entry.type === 'string' ? entry.type.trim().toLowerCase() : '';
  if (explicitType === 'medication' || explicitType === 'med') {
    return 'medication';
  }

  if (explicitType === 'appointment' || explicitType === 'appt') {
    return 'appointment';
  }

  if (Array.isArray(entry.dailySched)) {
    return 'medication';
  }

  if (
    typeof entry.getScheduledDateTime === 'function' ||
    (typeof entry.dateSched === 'string' && entry.dateSched.trim()) ||
    (typeof entry.timeSched === 'string' && entry.timeSched.trim())
  ) {
    return 'appointment';
  }

  return null;
};

const isResolvedEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  if (entry.isTaken === true || entry.isCompleted === true) {
    return true;
  }

  if (typeof entry.status === 'string') {
    const normalizedStatus = entry.status.trim().toLowerCase();
    return normalizedStatus === 'completed' || normalizedStatus === 'dismissed';
  }

  return false;
};

const isWaitingForSnooze = (entry, now) => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const snoozeDateTime = parseDateValue(entry.snoozeDateTime);
  return Boolean(snoozeDateTime && snoozeDateTime.getTime() > now.getTime());
};

const isDueNow = (entry, now) => {
  if (!entry || typeof entry !== 'object' || typeof entry.isDue !== 'function') {
    return true;
  }

  try {
    return Boolean(entry.isDue(now, now));
  } catch (firstError) {
    try {
      return Boolean(entry.isDue(now));
    } catch (secondError) {
      return false;
    }
  }
};

export class NotifSettingsService {
  constructor(initialSettingsByUserId = null) {
    this.settingsByUserId = new Map();

    if (initialSettingsByUserId instanceof Map) {
      initialSettingsByUserId.forEach((settings, userId) => {
        this.settingsByUserId.set(normalizeUserId(userId), toSettingsModel(settings));
      });
      return;
    }

    if (initialSettingsByUserId && typeof initialSettingsByUserId === 'object') {
      Object.entries(initialSettingsByUserId).forEach(([userId, settings]) => {
        this.settingsByUserId.set(normalizeUserId(userId), toSettingsModel(settings));
      });
    }
  }

  getSettings(userId) {
    return cloneSettings(this._getStoredSettings(userId));
  }

  toggleMedReminders(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleMedReminders();
    return cloneSettings(settings);
  }

  toggleApptReminders(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleApptReminders();
    return cloneSettings(settings);
  }

  updateMedReminderTime(userId, newTime) {
    const settings = this._getStoredSettings(userId);
    settings.updateMedReminderTime(newTime);
    return cloneSettings(settings);
  }

  updateApptReminderTime(userId, newTime) {
    const settings = this._getStoredSettings(userId);
    settings.updateApptReminderTime(newTime);
    return cloneSettings(settings);
  }

  toggleVibration(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleVibration();
    return cloneSettings(settings);
  }

  updateMedSnoozeDuration(userId, duration) {
    const settings = this._getStoredSettings(userId);
    settings.updateMedSnoozeDuration(duration);
    return cloneSettings(settings);
  }

  updateApptSnoozeDuration(userId, duration) {
    const settings = this._getStoredSettings(userId);
    settings.updateApptSnoozeDuration(duration);
    return cloneSettings(settings);
  }

  updateSnoozeDuration(userId, duration) {
    return this.updateMedSnoozeDuration(userId, duration);
  }

  shouldTriggerNotification(entry, settings, now = new Date()) {
    const currentDateTime = normalizeNow(now);
    const resolvedSettings = toSettingsModel(settings);
    const entryType = inferEntryType(entry);

    if (!entryType) {
      return false;
    }

    if (entryType === 'medication' && !resolvedSettings.medRemindersEnabled) {
      return false;
    }

    if (entryType === 'appointment' && !resolvedSettings.apptRemindersEnabled) {
      return false;
    }

    if (isResolvedEntry(entry) || isWaitingForSnooze(entry, currentDateTime) || !isDueNow(entry, currentDateTime)) {
      return false;
    }

    const reminderLeadTime =
      entryType === 'medication' ? resolvedSettings.medReminderTime : resolvedSettings.apptReminderTime;

    if (reminderLeadTime === null) {
      const scheduledDateTime = getScheduledDateTime(entry, currentDateTime);
      if (scheduledDateTime) {
        return currentDateTime.getTime() >= scheduledDateTime.getTime();
      }

      return true;
    }

    const reminderGate = buildReminderGate(entry, reminderLeadTime, currentDateTime);
    return !reminderGate || currentDateTime.getTime() >= reminderGate.getTime();
  }

  _getStoredSettings(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const storedSettings = this.settingsByUserId.get(normalizedUserId);

    if (storedSettings) {
      return storedSettings;
    }

    const defaultSettings = new NotifSetting();
    this.settingsByUserId.set(normalizedUserId, defaultSettings);
    return defaultSettings;
  }
}

const notifSettingsService = new NotifSettingsService();

export default notifSettingsService;
