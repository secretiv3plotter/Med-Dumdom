// ReminderService
// Role:
// Own reminder business logic across medication, appointments, and manual caregiver reminders.
// This service decides when reminders exist, when they are due, and how they change state.
//
// What belongs here:
// - create reminders from medication or appointment events
// - build reminder content for notification popups
// - mark reminders completed, dismissed, or snoozed
// - determine which reminders should appear in the notifications screen
// - manage manual reminders sent by caregivers
//
// Use cases covered:
// - receive reminders as pop-up notifications and in the notifications screen
// - receive real time manual reminders from caregivers
// - send manual reminders from caregivers to patients
//
// What should NOT belong here:
// - actual device notification APIs
// - Firebase push delivery
// - Realm persistence details
// - UI popup rendering
//
// Suggested service methods:
// - createMedicationReminder(medEntry, now)
// - createAppointmentReminder(apptEntry, now)
// - createManualReminder(senderId, patientId, payload)
// - getDueReminders(userId, now)
// - snoozeReminder(reminderId, snoozeUntil)
// - dismissReminder(reminderId)
// - markReminderCompleted(reminderId)
// - getNotificationFeed(userId)
//
// Model methods this service should wrap:
// - markCompleted()
// - dismissReminder()
// - snoozeReminder(newSnoozeDateTime)
// - isMedicationReminder()
// - isAppointmentReminder()
//
// Notes:
// - this service should work with the ReminderModel
// - actual notification scheduling belongs in a separate adapter/service later
//
// Dependencies:
// - direct dependencies: MedTrackerService, ApptTrackerService, NotifSettingsService,
//   PrivacySettingsService, PatientCaregiverLinkService
// - commonly used by: notification screen, reminder popup logic, caregiver reminder flows

import Reminder from '../models/ReminderModel';

const REMINDER_TYPES = new Set(['medication', 'appointment']);
const DEFAULT_MANUAL_REMINDER_TYPE = 'appointment';

const normalizeEntityId = (value, fieldName) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new RangeError(`${fieldName} cannot be empty.`);
    }
    return trimmedValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError(`${fieldName} must be a non-empty string or a finite number.`);
};

const normalizeReminderId = (value) => {
  if (typeof value !== 'string') {
    throw new TypeError('reminderId must be a string.');
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new RangeError('reminderId cannot be empty.');
  }

  return trimmedValue;
};

const normalizeRequiredText = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new RangeError(`${fieldName} cannot be empty.`);
  }

  return trimmedValue;
};

const normalizeNow = (value = new Date()) => {
  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError('now must be a valid date or datetime.');
  }

  return parsedDate;
};

const normalizeOptionalDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date or datetime.`);
  }

  return parsedDate;
};

const normalizeManualReminderType = (value) => {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_MANUAL_REMINDER_TYPE;
  }

  if (typeof value !== 'string') {
    throw new TypeError('payload.type must be a string.');
  }

  const normalizedType = value.trim().toLowerCase();
  if (!REMINDER_TYPES.has(normalizedType)) {
    throw new RangeError('payload.type must be either medication or appointment.');
  }

  return normalizedType;
};

const cloneReminder = (reminder) =>
  new Reminder({
    reminderId: reminder.reminderId,
    type: reminder.type,
    relatedEntryId: reminder.relatedEntryId,
    title: reminder.title,
    message: reminder.message,
    snoozeDateTime: reminder.snoozeDateTime,
    status: reminder.status,
  });

const resolveTrackerEntries = (service, methodNames, userId) => {
  if (!service || typeof service !== 'object') {
    return [];
  }

  for (const methodName of methodNames) {
    const method = service[methodName];
    if (typeof method !== 'function') {
      continue;
    }

    const result = method.call(service, userId);
    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === 'object') {
      if (Array.isArray(result.entries)) {
        return result.entries;
      }
      if (Array.isArray(result.data)) {
        return result.data;
      }
    }
  }

  return [];
};

const extractEntryId = (entry, idFields) => {
  for (const idField of idFields) {
    const candidateValue = entry[idField];
    if (typeof candidateValue === 'string') {
      const trimmedValue = candidateValue.trim();
      if (trimmedValue) {
        return trimmedValue;
      }
    }

    if (typeof candidateValue === 'number' && Number.isFinite(candidateValue)) {
      return String(candidateValue);
    }
  }

  return null;
};

const extractOwnerIdFromEntry = (entry) => {
  const ownerId = extractEntryId(entry, ['userId', 'patientId', 'ownerUserId', 'ownerId']);
  if (!ownerId) {
    throw new RangeError('Entry must include userId or patientId.');
  }

  return ownerId;
};

const isEntryDueNow = (entry, now) => {
  if (!entry || typeof entry !== 'object' || typeof entry.isDue !== 'function') {
    return false;
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

const buildMedicationMessage = (medEntry) => {
  if (typeof medEntry?.medName === 'string' && medEntry.medName.trim()) {
    return `Time to take ${medEntry.medName.trim()}.`;
  }

  return 'Time to take your medication.';
};

const buildAppointmentMessage = (apptEntry) => {
  const concern = typeof apptEntry?.concern === 'string' ? apptEntry.concern.trim() : '';
  const dateSched = typeof apptEntry?.dateSched === 'string' ? apptEntry.dateSched.trim() : '';
  const timeSched = typeof apptEntry?.timeSched === 'string' ? apptEntry.timeSched.trim() : '';

  if (concern && dateSched && timeSched) {
    return `Appointment for ${concern} on ${dateSched} at ${timeSched}.`;
  }

  if (concern && dateSched) {
    return `Appointment for ${concern} on ${dateSched}.`;
  }

  if (dateSched && timeSched) {
    return `You have an appointment on ${dateSched} at ${timeSched}.`;
  }

  return 'You have an upcoming appointment.';
};

export class ReminderService {
  constructor({
    medTrackerService = null,
    apptTrackerService = null,
    notifSettingsService = null,
    privacySettingsService = null,
    patientCaregiverLinkService = null,
    initialRemindersByUserId = null,
  } = {}) {
    this.medTrackerService = medTrackerService;
    this.apptTrackerService = apptTrackerService;
    this.notifSettingsService = notifSettingsService;
    this.privacySettingsService = privacySettingsService;
    this.patientCaregiverLinkService = patientCaregiverLinkService;

    this.remindersByUserId = new Map();
    this.reminderIndex = new Map();
    this.reminderMetaById = new Map();
    this.reminderSequence = 0;

    this._hydrateInitialReminders(initialRemindersByUserId);
  }

  createMedicationReminder(medEntry, now = new Date()) {
    const currentDateTime = normalizeNow(now);

    if (!medEntry || typeof medEntry !== 'object') {
      throw new TypeError('medEntry must be an object.');
    }

    const ownerUserId = extractOwnerIdFromEntry(medEntry);
    return this._createMedicationReminderForUser(ownerUserId, medEntry, currentDateTime);
  }

  createAppointmentReminder(apptEntry, now = new Date()) {
    const currentDateTime = normalizeNow(now);

    if (!apptEntry || typeof apptEntry !== 'object') {
      throw new TypeError('apptEntry must be an object.');
    }

    const ownerUserId = extractOwnerIdFromEntry(apptEntry);
    return this._createAppointmentReminderForUser(ownerUserId, apptEntry, currentDateTime);
  }

  createManualReminder(senderId, patientId, payload) {
    const caregiverId = normalizeEntityId(senderId, 'senderId');
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new TypeError('payload must be a plain object.');
    }

    this._assertManualReminderPermission(caregiverId, normalizedPatientId);

    const type = normalizeManualReminderType(payload.type);
    const title = normalizeRequiredText(payload.title, 'payload.title');
    const message = normalizeRequiredText(payload.message, 'payload.message');
    const relatedEntryId = payload.relatedEntryId
      ? normalizeEntityId(payload.relatedEntryId, 'payload.relatedEntryId')
      : `manual-${normalizedPatientId}-${Date.now()}`;

    const reminder = new Reminder({
      reminderId: this._buildReminderId('manual'),
      type,
      relatedEntryId,
      title,
      message,
      status: 'pending',
      snoozeDateTime: null,
    });

    this._storeReminder(normalizedPatientId, reminder, {
      source: 'manual',
      senderId: caregiverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return cloneReminder(reminder);
  }

  getDueReminders(userId, now = new Date()) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const currentDateTime = normalizeNow(now);

    this._syncFromTrackers(normalizedUserId, currentDateTime);

    const settings = this._getNotificationSettings(normalizedUserId);
    const reminders = this._getUserReminders(normalizedUserId);
    const dueReminders = reminders
      .filter((reminder) => this._isReminderDue(reminder, currentDateTime, settings))
      .sort((firstReminder, secondReminder) => {
        const firstMeta = this.reminderMetaById.get(firstReminder.reminderId);
        const secondMeta = this.reminderMetaById.get(secondReminder.reminderId);
        const firstTimestamp = firstMeta?.createdAt?.getTime?.() ?? 0;
        const secondTimestamp = secondMeta?.createdAt?.getTime?.() ?? 0;
        return firstTimestamp - secondTimestamp;
      })
      .map((reminder) => cloneReminder(reminder));

    return dueReminders;
  }

  snoozeReminder(reminderId, snoozeUntil) {
    const { reminder } = this._getReminderRecord(reminderId);
    const snoozeDateTime = normalizeOptionalDate(snoozeUntil, 'snoozeUntil');

    if (!snoozeDateTime) {
      throw new RangeError('snoozeUntil is required.');
    }

    reminder.snoozeReminder(snoozeDateTime);
    this._markReminderUpdated(reminder.reminderId);
    return cloneReminder(reminder);
  }

  dismissReminder(reminderId) {
    const { reminder } = this._getReminderRecord(reminderId);
    reminder.dismissReminder();
    this._markReminderUpdated(reminder.reminderId);
    return cloneReminder(reminder);
  }

  markReminderCompleted(reminderId) {
    const { reminder } = this._getReminderRecord(reminderId);
    reminder.markCompleted();
    this._markReminderUpdated(reminder.reminderId);
    return cloneReminder(reminder);
  }

  getNotificationFeed(userId) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const now = new Date();
    const settings = this._getNotificationSettings(normalizedUserId);
    const reminders = this._getUserReminders(normalizedUserId);

    return reminders
      .slice()
      .sort((firstReminder, secondReminder) => {
        const firstMeta = this.reminderMetaById.get(firstReminder.reminderId);
        const secondMeta = this.reminderMetaById.get(secondReminder.reminderId);
        const firstTimestamp =
          firstMeta?.updatedAt?.getTime?.() ?? firstMeta?.createdAt?.getTime?.() ?? 0;
        const secondTimestamp =
          secondMeta?.updatedAt?.getTime?.() ?? secondMeta?.createdAt?.getTime?.() ?? 0;
        return secondTimestamp - firstTimestamp;
      })
      .map((reminder) => {
        const reminderCopy = cloneReminder(reminder);
        reminderCopy.isDueNow = this._isReminderDue(reminder, now, settings);
        return reminderCopy;
      });
  }

  _createMedicationReminderForUser(userId, medEntry, now) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const relatedEntryId = extractEntryId(medEntry, ['medEntryId', 'id']);
    if (!relatedEntryId) {
      throw new RangeError('medEntry must include medEntryId or id.');
    }

    return this._upsertPendingReminder({
      userId: normalizedUserId,
      type: 'medication',
      relatedEntryId,
      title: 'Medication Reminder',
      message: buildMedicationMessage(medEntry),
      source: 'medication',
      now,
    });
  }

  _createAppointmentReminderForUser(userId, apptEntry, now) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const relatedEntryId = extractEntryId(apptEntry, ['apptEntryId', 'id']);
    if (!relatedEntryId) {
      throw new RangeError('apptEntry must include apptEntryId or id.');
    }

    return this._upsertPendingReminder({
      userId: normalizedUserId,
      type: 'appointment',
      relatedEntryId,
      title: 'Appointment Reminder',
      message: buildAppointmentMessage(apptEntry),
      source: 'appointment',
      now,
    });
  }

  _upsertPendingReminder({ userId, type, relatedEntryId, title, message, source, now }) {
    const existingReminder = this._findPendingReminder(userId, type, relatedEntryId);
    if (existingReminder) {
      return cloneReminder(existingReminder);
    }

    const reminder = new Reminder({
      reminderId: this._buildReminderId(type),
      type,
      relatedEntryId,
      title,
      message,
      status: 'pending',
      snoozeDateTime: null,
    });

    this._storeReminder(userId, reminder, {
      source,
      createdAt: new Date(now.getTime()),
      updatedAt: new Date(now.getTime()),
    });

    return cloneReminder(reminder);
  }

  _syncFromTrackers(userId, now) {
    const medEntries = resolveTrackerEntries(this.medTrackerService, ['listMedEntries', 'getMedEntries'], userId);
    medEntries.forEach((medEntry) => {
      if (!isEntryDueNow(medEntry, now)) {
        return;
      }

      try {
        this._createMedicationReminderForUser(userId, medEntry, now);
      } catch (error) {
        // Skip invalid entries rather than breaking due reminders for valid records.
      }
    });

    const apptEntries = resolveTrackerEntries(
      this.apptTrackerService,
      ['listApptEntries', 'getApptEntries'],
      userId
    );
    apptEntries.forEach((apptEntry) => {
      if (!isEntryDueNow(apptEntry, now)) {
        return;
      }

      try {
        this._createAppointmentReminderForUser(userId, apptEntry, now);
      } catch (error) {
        // Skip invalid entries rather than breaking due reminders for valid records.
      }
    });
  }

  _getNotificationSettings(userId) {
    if (
      !this.notifSettingsService ||
      typeof this.notifSettingsService !== 'object' ||
      typeof this.notifSettingsService.getSettings !== 'function'
    ) {
      return null;
    }

    const settings = this.notifSettingsService.getSettings(userId);
    if (!settings || typeof settings !== 'object') {
      return null;
    }

    return settings;
  }

  _isReminderDue(reminder, now, settings) {
    if (!(reminder instanceof Reminder) || reminder.status !== 'pending') {
      return false;
    }

    if (reminder.snoozeDateTime && reminder.snoozeDateTime.getTime() > now.getTime()) {
      return false;
    }

    if (settings) {
      if (reminder.isMedicationReminder() && settings.medRemindersEnabled === false) {
        return false;
      }

      if (reminder.isAppointmentReminder() && settings.apptRemindersEnabled === false) {
        return false;
      }
    }

    return true;
  }

  _assertManualReminderPermission(caregiverId, patientId) {
    if (
      this.patientCaregiverLinkService &&
      typeof this.patientCaregiverLinkService.canCaregiverAccessPatient === 'function'
    ) {
      const canAccessPatient = this.patientCaregiverLinkService.canCaregiverAccessPatient(
        patientId,
        caregiverId
      );
      if (!canAccessPatient) {
        throw new Error('Caregiver is not linked to this patient.');
      }
    }

    if (
      this.privacySettingsService &&
      typeof this.privacySettingsService.canCaregiverSendManualReminder === 'function'
    ) {
      const canSendManualReminder = this.privacySettingsService.canCaregiverSendManualReminder(
        patientId,
        caregiverId
      );
      if (!canSendManualReminder) {
        throw new Error('Manual caregiver reminders are not permitted for this patient.');
      }
    }
  }

  _getUserReminders(userId) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const reminders = this.remindersByUserId.get(normalizedUserId);

    if (reminders) {
      return reminders;
    }

    const initialReminders = [];
    this.remindersByUserId.set(normalizedUserId, initialReminders);
    return initialReminders;
  }

  _storeReminder(userId, reminder, metadata = {}) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const reminderList = this._getUserReminders(normalizedUserId);
    reminderList.push(reminder);

    this.reminderIndex.set(reminder.reminderId, {
      userId: normalizedUserId,
      reminder,
    });

    this.reminderMetaById.set(reminder.reminderId, {
      source: metadata.source || 'manual',
      senderId: metadata.senderId || null,
      createdAt: metadata.createdAt instanceof Date ? metadata.createdAt : new Date(),
      updatedAt: metadata.updatedAt instanceof Date ? metadata.updatedAt : new Date(),
    });
  }

  _hydrateInitialReminders(initialRemindersByUserId) {
    if (!initialRemindersByUserId) {
      return;
    }

    if (initialRemindersByUserId instanceof Map) {
      initialRemindersByUserId.forEach((reminders, userId) => {
        this._hydrateReminderCollection(userId, reminders);
      });
      return;
    }

    if (typeof initialRemindersByUserId === 'object' && !Array.isArray(initialRemindersByUserId)) {
      Object.entries(initialRemindersByUserId).forEach(([userId, reminders]) => {
        this._hydrateReminderCollection(userId, reminders);
      });
      return;
    }

    throw new TypeError('initialRemindersByUserId must be a Map or plain object.');
  }

  _hydrateReminderCollection(userId, reminders) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    if (!Array.isArray(reminders)) {
      throw new TypeError('Initial reminders for a user must be an array.');
    }

    reminders.forEach((reminderData) => {
      const reminder = reminderData instanceof Reminder ? cloneReminder(reminderData) : new Reminder(reminderData);
      this._storeReminder(normalizedUserId, reminder, {
        source: 'seed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  _getReminderRecord(reminderId) {
    const normalizedReminderId = normalizeReminderId(reminderId);
    const record = this.reminderIndex.get(normalizedReminderId);
    if (!record) {
      throw new RangeError(`Reminder not found: ${normalizedReminderId}.`);
    }

    return record;
  }

  _findPendingReminder(userId, type, relatedEntryId) {
    const reminders = this._getUserReminders(userId);
    return (
      reminders.find(
        (reminder) =>
          reminder instanceof Reminder &&
          reminder.status === 'pending' &&
          reminder.type === type &&
          reminder.relatedEntryId === relatedEntryId
      ) || null
    );
  }

  _markReminderUpdated(reminderId) {
    const metadata = this.reminderMetaById.get(reminderId);
    if (!metadata) {
      return;
    }

    metadata.updatedAt = new Date();
    this.reminderMetaById.set(reminderId, metadata);
  }

  _buildReminderId(type) {
    this.reminderSequence += 1;
    return `rem-${type}-${Date.now()}-${this.reminderSequence}`;
  }
}

const reminderService = new ReminderService();

export default reminderService;
