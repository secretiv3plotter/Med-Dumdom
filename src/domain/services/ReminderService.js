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
import medTrackerService from './MedTrackerService';
import apptTrackerService from './ApptTrackerService';
import notifSettingsService from './NotifSettingsService';
import privacySettingsService from './PrivacySettingsService';

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

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date or datetime.`);
  }

  return parsedDate;
};

const cloneReminder = (reminder) =>
  reminder.type === 'manual'
    ? {
        ...reminder,
        snoozeDateTime: reminder.snoozeDateTime ? new Date(reminder.snoozeDateTime.getTime()) : null,
        createdAt: reminder.createdAt ? new Date(reminder.createdAt.getTime()) : null,
        dueAt: reminder.dueAt ? new Date(reminder.dueAt.getTime()) : null,
      }
    : (() => {
        const clone = new Reminder({
          reminderId: reminder.reminderId,
          type: reminder.type,
          relatedEntryId: reminder.relatedEntryId,
          title: reminder.title,
          message: reminder.message,
          snoozeDateTime: reminder.snoozeDateTime,
          status: reminder.status,
        });
        clone.ownerId = reminder.ownerId;
        clone.createdAt = reminder.createdAt ? new Date(reminder.createdAt.getTime()) : null;
        clone.dueAt = reminder.dueAt ? new Date(reminder.dueAt.getTime()) : null;
        clone.sourceEntry = reminder.sourceEntry ? { ...reminder.sourceEntry } : null;
        return clone;
      })();

const normalizeReminderId = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError('reminderId must be a non-empty string or a finite number.');
};

const getReminderStore = (storesByUserId, userId) => {
  const normalizedUserId = normalizeEntityId(userId, 'userId');
  let store = storesByUserId.get(normalizedUserId);

  if (!store) {
    store = {
      reminders: new Map(),
      counter: 0,
    };
    storesByUserId.set(normalizedUserId, store);
  }

  return { normalizedUserId, store };
};

const buildReminderId = (userId, store, prefix) => `${userId}-${prefix}-${++store.counter}`;

const normalizeReminderSettings = (settings) => settings && typeof settings === 'object' ? settings : {};

const isReminderSettled = (reminder) => reminder.status === 'completed' || reminder.status === 'dismissed';

const isValidDateTime = (value) => value instanceof Date && !Number.isNaN(value.getTime());

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

const normalizeNonNegativeMinutes = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const startOfDay = (value) => {
  const parsedDate = normalizeDate(value, 'date') ?? new Date();
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const parseScheduleTime = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const buildDateKey = (value) => {
  if (!isValidDateTime(value)) {
    return '';
  }

  return value.toISOString().slice(0, 10);
};

const getEffectiveScheduleTime = (scheduleEntry) => scheduleEntry?.scheduledTime || scheduleEntry?.mealTime || '';

const resolveOwnerId = (candidate, sourceEntry = null) => {
  const fromCandidate =
    candidate ?? sourceEntry?.ownerId ?? sourceEntry?.userId ?? sourceEntry?.patientId ?? null;

  if (fromCandidate === null || fromCandidate === undefined || fromCandidate === '') {
    return null;
  }

  return normalizeEntityId(fromCandidate, 'ownerId');
};

const buildReminderText = (fallbackTitle, fallbackMessage, sourceEntry) => {
  const title = sourceEntry?.title || sourceEntry?.medName || sourceEntry?.concern || fallbackTitle;
  const message = sourceEntry?.message || sourceEntry?.note || fallbackMessage;

  return {
    title: title === undefined || title === null ? fallbackTitle : String(title).trim() || fallbackTitle,
    message: message === undefined || message === null ? fallbackMessage : String(message).trim() || fallbackMessage,
  };
};

const buildMedicationScheduleContexts = (sourceEntry, now) => {
  if (!sourceEntry || typeof sourceEntry !== 'object' || !Array.isArray(sourceEntry.dailySched)) {
    return [];
  }

  const medEntryId = sourceEntry.medEntryId ?? sourceEntry.relatedEntryId ?? null;
  if (!medEntryId) {
    return [];
  }

  const referenceDay = startOfDay(now);
  const startDate = sourceEntry.startDate ? startOfDay(sourceEntry.startDate) : null;
  const endDate = sourceEntry.endDate ? startOfDay(sourceEntry.endDate) : null;

  let scheduleDay = new Date(referenceDay.getTime());
  if (startDate && scheduleDay.getTime() < startDate.getTime()) {
    scheduleDay = new Date(startDate.getTime());
  }

  if (endDate && scheduleDay.getTime() > endDate.getTime()) {
    return [];
  }

  if (typeof sourceEntry.isActiveOnDate === 'function' && !sourceEntry.isActiveOnDate(scheduleDay)) {
    return [];
  }

  return sourceEntry.dailySched
    .map((scheduleEntry, index) => {
      const parsedTime = parseScheduleTime(getEffectiveScheduleTime(scheduleEntry));
      if (!parsedTime) {
        return null;
      }

      const dueAt = new Date(scheduleDay.getTime());
      dueAt.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

      const dateKey = buildDateKey(dueAt);
      const normalizedEntryId = normalizeReminderId(medEntryId);
      return {
        scheduleIndex: index,
        scheduleEntry,
        dueAt,
        relatedEntryId: `${normalizedEntryId}-schedule-${index}`,
        reminderId: `med-${normalizedEntryId}-${dateKey}-${index}`,
      };
    })
    .filter(Boolean);
};

const createManualReminderRecord = ({ reminderId, senderId, patientId, title, message, dueAt, createdAt, relatedEntryId }) => {
  const record = {
    reminderId,
    type: 'manual',
    relatedEntryId,
    title,
    message,
    snoozeDateTime: null,
    status: 'pending',
    senderId,
    patientId,
    createdAt,
    dueAt,
    markCompleted() {
      this.status = 'completed';
      this.snoozeDateTime = null;
      return this;
    },
    dismissReminder() {
      this.status = 'dismissed';
      return this;
    },
    snoozeReminder(newSnoozeDateTime) {
      this.snoozeDateTime = normalizeDate(newSnoozeDateTime, 'snoozeDateTime');
      this.status = 'pending';
      return this;
    },
    isMedicationReminder() {
      return false;
    },
    isAppointmentReminder() {
      return false;
    },
  };

  return record;
};

const reminderDueAt = (reminder, now) => {
  if (reminder.type === 'manual') {
    return reminder.dueAt instanceof Date ? reminder.dueAt : reminder.createdAt ?? now;
  }

  if (typeof notifSettingsService.shouldTriggerNotification === 'function') {
    const settings = normalizeReminderSettings(reminder.ownerId ? notifSettingsService.getSettings(reminder.ownerId) : null);
    if (!notifSettingsService.shouldTriggerNotification(reminder, settings, now)) {
      return null;
    }
  }

  return reminder.dueAt instanceof Date ? reminder.dueAt : now;
};

const startOfDayBoundary = (value) => {
  const dateValue = normalizeDate(value, 'date') ?? new Date();
  dateValue.setHours(0, 0, 0, 0);
  return dateValue;
};

const endOfDayBoundary = (value) => {
  const dateValue = startOfDayBoundary(value);
  dateValue.setDate(dateValue.getDate() + 1);
  dateValue.setMilliseconds(dateValue.getMilliseconds() - 1);
  return dateValue;
};

const resolveReminderSnoozeDateTime = (reminder, settings, now) => {
  const currentDateTime = normalizeDate(now, 'now') ?? new Date();
  const resolvedSettings = normalizeReminderSettings(settings);
  const leadMinutes =
    reminder.type === 'medication'
      ? normalizeNonNegativeMinutes(resolvedSettings.medSnoozeDuration)
      : reminder.type === 'appointment'
        ? normalizeNonNegativeMinutes(resolvedSettings.apptSnoozeDuration)
        : null;

  if (leadMinutes === null) {
    return currentDateTime;
  }

  const computedSnoozeDateTime = new Date(currentDateTime.getTime() + leadMinutes * 60 * 1000);
  const dueAt = reminder.dueAt instanceof Date ? reminder.dueAt : null;
  if (!dueAt) {
    return computedSnoozeDateTime;
  }

  const clampedTime = Math.min(computedSnoozeDateTime.getTime(), dueAt.getTime());
  return new Date(Math.max(clampedTime, currentDateTime.getTime()));
};

export class ReminderService {
  constructor(options = {}) {
    this.medTrackerService = options.medTrackerService ?? medTrackerService;
    this.apptTrackerService = options.apptTrackerService ?? apptTrackerService;
    this.notifSettingsService = options.notifSettingsService ?? notifSettingsService;
    this.privacySettingsService = options.privacySettingsService ?? privacySettingsService;
    this.caregiverLinkService = options.caregiverLinkService ?? null;
    this.remindersByUserId = new Map();
    this.reminderIndex = new Map();
  }

  createMedicationReminder(medEntry, now = new Date(), ownerId = null) {
    return this._createMedicationReminder(medEntry, now, ownerId, null);
  }

  _createMedicationReminder(medEntry, now = new Date(), ownerId = null, scheduleContext = null) {
    const sourceEntry = medEntry && typeof medEntry === 'object' ? medEntry : null;
    if (!sourceEntry) {
      throw new TypeError('medEntry must be an object.');
    }

    const createdAt = normalizeDate(now, 'now') ?? new Date();
    const resolvedOwnerId = resolveOwnerId(ownerId, sourceEntry);
    if (!resolvedOwnerId) {
      throw new RangeError('ownerId is required to store a medication reminder.');
    }

    const { normalizedUserId, store } = getReminderStore(this.remindersByUserId, resolvedOwnerId);
    const fallbackScheduleContext = buildMedicationScheduleContexts(sourceEntry, createdAt)[0] ?? null;
    const resolvedScheduleContext = scheduleContext ?? fallbackScheduleContext;
    const relatedEntryId = resolvedScheduleContext?.relatedEntryId ?? sourceEntry.medEntryId ?? sourceEntry.relatedEntryId ?? buildReminderId(normalizedUserId, store, 'med');
    const reminderId = resolvedScheduleContext?.reminderId ?? sourceEntry.reminderId ?? `med-${normalizeReminderId(relatedEntryId)}`;
    const dueAt = resolvedScheduleContext?.dueAt ?? createdAt;
    const effectiveTime = getEffectiveScheduleTime(resolvedScheduleContext?.scheduleEntry);
    const reminder = new Reminder({
      reminderId,
      type: 'medication',
      relatedEntryId: normalizeReminderId(relatedEntryId),
      title: buildReminderText('Medication reminder', `Take ${sourceEntry.medName || 'your medication'} on time.`, sourceEntry).title,
      message:
        sourceEntry?.message ||
        `${sourceEntry.medName || 'Medication'}${effectiveTime ? ` is scheduled at ${effectiveTime}` : ''}.`,
      snoozeDateTime: sourceEntry.snoozeDateTime ?? null,
      status: 'pending',
    });

    reminder.ownerId = resolvedOwnerId;
    reminder.createdAt = createdAt;
    reminder.dueAt = isValidDateTime(dueAt) ? dueAt : createdAt;
    reminder.sourceEntry = sourceEntry;
    store.reminders.set(reminder.reminderId, reminder);
    this.reminderIndex.set(reminder.reminderId, { ownerId: resolvedOwnerId });
    return cloneReminder(reminder);
  }

  createAppointmentReminder(apptEntry, now = new Date(), ownerId = null) {
    const sourceEntry = apptEntry && typeof apptEntry === 'object' ? apptEntry : null;
    if (!sourceEntry) {
      throw new TypeError('apptEntry must be an object.');
    }

    const createdAt = normalizeDate(now, 'now') ?? new Date();
    const resolvedOwnerId = resolveOwnerId(ownerId, sourceEntry);
    if (!resolvedOwnerId) {
      throw new RangeError('ownerId is required to store an appointment reminder.');
    }

    const { store } = getReminderStore(this.remindersByUserId, resolvedOwnerId);
    const scheduledDateTime = sourceEntry.getScheduledDateTime?.();
    const relatedEntryId = sourceEntry.apptEntryId ?? sourceEntry.relatedEntryId ?? `${resolvedOwnerId}-appt-fallback`;
    const reminderId = sourceEntry.reminderId || `appt-${normalizeReminderId(relatedEntryId)}`;
    const reminder = new Reminder({
      reminderId,
      type: 'appointment',
      relatedEntryId: normalizeReminderId(relatedEntryId),
      title: buildReminderText('Appointment reminder', 'You have an upcoming appointment.', sourceEntry).title,
      message: buildReminderText('Appointment reminder', 'You have an upcoming appointment.', sourceEntry).message,
      snoozeDateTime: sourceEntry.snoozeDateTime ?? null,
      status: 'pending',
    });

    reminder.ownerId = resolvedOwnerId;
    reminder.createdAt = createdAt;
    reminder.dueAt = isValidDateTime(scheduledDateTime) ? scheduledDateTime : createdAt;
    reminder.sourceEntry = sourceEntry;
    store.reminders.set(reminder.reminderId, reminder);
    this.reminderIndex.set(reminder.reminderId, { ownerId: resolvedOwnerId });
    return cloneReminder(reminder);
  }

  createManualReminder(senderId, patientId, payload) {
    const normalizedSenderId = normalizeEntityId(senderId, 'senderId');
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const resolvedPayload = normalizeReminderSettings(payload);

    if (this.caregiverLinkService && typeof this.caregiverLinkService.canCaregiverAccessPatient === 'function') {
      if (!this.caregiverLinkService.canCaregiverAccessPatient(normalizedPatientId, normalizedSenderId)) {
        throw new Error('Caregiver is not linked to this patient.');
      }
    }

    if (this.privacySettingsService?.canCaregiverSendManualReminder) {
      if (!this.privacySettingsService.canCaregiverSendManualReminder(normalizedPatientId, normalizedSenderId)) {
        throw new Error('Manual caregiver reminders are not permitted for this patient.');
      }
    }

    const { normalizedUserId, store } = getReminderStore(this.remindersByUserId, normalizedPatientId);
    const reminderId = resolvedPayload.reminderId || buildReminderId(normalizedUserId, store, 'manual');
    const createdAt = normalizeDate(resolvedPayload.createdAt ?? new Date(), 'createdAt') ?? new Date();
    const dueAt = normalizeDate(resolvedPayload.dueAt ?? resolvedPayload.reminderAt ?? createdAt, 'dueAt') ?? createdAt;
    const text = buildReminderText('Manual reminder', 'You have a new caregiver reminder.', resolvedPayload);
    const reminder = createManualReminderRecord({
      reminderId,
      senderId: normalizedSenderId,
      patientId: normalizedPatientId,
      relatedEntryId: resolvedPayload.relatedEntryId ? String(resolvedPayload.relatedEntryId).trim() : reminderId,
      title: text.title,
      message: text.message,
      createdAt,
      dueAt,
    });

    store.reminders.set(reminderId, reminder);
    this.reminderIndex.set(reminderId, { ownerId: normalizedPatientId });
    return cloneReminder(reminder);
  }

  getDueReminders(userId, now = new Date()) {
    const currentDateTime = normalizeDate(now, 'now') ?? new Date();
    this._syncTrackerReminders(userId, currentDateTime);
    const { store } = getReminderStore(this.remindersByUserId, userId);
    return [...store.reminders.values()]
      .filter((reminder) => !isReminderSettled(reminder))
      .filter((reminder) => !isResolvedEntry(reminder.sourceEntry))
      .filter((reminder) => {
        if (reminder.snoozeDateTime instanceof Date && reminder.snoozeDateTime.getTime() > currentDateTime.getTime()) {
          return false;
        }

        if (reminder.type === 'manual') {
          const dueAt = reminderDueAt(reminder, currentDateTime);
          return Boolean(dueAt && dueAt.getTime() <= currentDateTime.getTime());
        }

        if (this.notifSettingsService?.shouldTriggerNotification) {
          const settings = this.notifSettingsService.getSettings(reminder.ownerId);
          return this.notifSettingsService.shouldTriggerNotification(reminder, settings, currentDateTime);
        }

        const dueAt = reminderDueAt(reminder, currentDateTime);
        return Boolean(dueAt && dueAt.getTime() <= currentDateTime.getTime());
      })
      .map(cloneReminder);
  }

  snoozeReminder(reminderId, snoozeUntil = null) {
    const normalizedReminderId = normalizeReminderId(reminderId);
    const reminder = this._getReminderById(normalizedReminderId);
    const resolvedSnoozeUntil =
      snoozeUntil === null || snoozeUntil === undefined
        ? resolveReminderSnoozeDateTime(
            reminder,
            reminder.ownerId ? this.notifSettingsService?.getSettings?.(reminder.ownerId) : null,
            new Date()
          )
        : snoozeUntil;
    reminder.snoozeReminder(resolvedSnoozeUntil);
    return cloneReminder(reminder);
  }

  dismissReminder(reminderId) {
    const normalizedReminderId = normalizeReminderId(reminderId);
    const reminder = this._getReminderById(normalizedReminderId);
    reminder.dismissReminder();
    return cloneReminder(reminder);
  }

  markReminderCompleted(reminderId) {
    const normalizedReminderId = normalizeReminderId(reminderId);
    const reminder = this._getReminderById(normalizedReminderId);
    reminder.markCompleted();
    this._markSourceEntryCompleted(reminder);
    return cloneReminder(reminder);
  }

  getNotificationFeed(userId, now = new Date()) {
    const currentDateTime = normalizeDate(now, 'now') ?? new Date();
    const startOfToday = startOfDayBoundary(currentDateTime);
    const startOfYesterday = new Date(startOfToday.getTime());
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfToday = endOfDayBoundary(currentDateTime);

    this._syncTrackerReminders(userId, now);
    const { store } = getReminderStore(this.remindersByUserId, userId);
    const settings = this.notifSettingsService?.getSettings?.(userId) ?? null;

    return [...store.reminders.values()]
      .filter((reminder) => !isReminderSettled(reminder))
      .filter((reminder) => !isResolvedEntry(reminder.sourceEntry))
      .filter((reminder) => {
        if (
          reminder.snoozeDateTime instanceof Date &&
          reminder.snoozeDateTime.getTime() > currentDateTime.getTime()
        ) {
          return false;
        }

        if (reminder.type === 'manual') {
          const dueAt = reminderDueAt(reminder, currentDateTime);
          return Boolean(dueAt && dueAt.getTime() <= currentDateTime.getTime());
        }

        return Boolean(
          this.notifSettingsService?.shouldTriggerNotification?.(reminder, settings, currentDateTime)
        );
      })
      .filter((reminder) => {
        const surfacedAt = this._getSurfaceAt(reminder, settings, currentDateTime);
        const dueAt = reminder.dueAt instanceof Date ? reminder.dueAt : surfacedAt;
        if (!surfacedAt && !dueAt) {
          return false;
        }

        const candidateTime = (surfacedAt ?? dueAt).getTime();
        const unresolvedOlderReminder = dueAt && dueAt.getTime() < startOfYesterday.getTime();
        const isTodayOrYesterday =
          candidateTime >= startOfYesterday.getTime() && candidateTime <= endOfToday.getTime();
        return isTodayOrYesterday || unresolvedOlderReminder;
      })
      .map(cloneReminder)
      .sort((a, b) => {
        const aSortMeta = this._buildFeedSortMeta(a, settings, currentDateTime);
        const bSortMeta = this._buildFeedSortMeta(b, settings, currentDateTime);

        if (aSortMeta.priority !== bSortMeta.priority) {
          return bSortMeta.priority - aSortMeta.priority;
        }

        if (aSortMeta.time !== bSortMeta.time) {
          return aSortMeta.time - bSortMeta.time;
        }

        return a.reminderId.localeCompare(b.reminderId);
      });
  }

  _getEffectiveDueAt(reminder, settings, now = new Date()) {
    if (reminder.type === 'manual') {
      const dueAt = reminderDueAt(reminder, now);
      return dueAt instanceof Date ? dueAt : null;
    }

    if (!settings) {
      return reminder.dueAt instanceof Date ? reminder.dueAt : null;
    }

    const ledMinutes =
      reminder.type === 'medication'
        ? normalizeNonNegativeMinutes(settings.medReminderTime)
        : reminder.type === 'appointment'
          ? normalizeNonNegativeMinutes(settings.apptReminderTime)
          : null;

    const baseDueAt = reminder.dueAt instanceof Date ? reminder.dueAt : null;
    if (!baseDueAt || ledMinutes === null) {
      return baseDueAt;
    }

    return new Date(baseDueAt.getTime() - ledMinutes * 60 * 1000);
  }

  _getSurfaceAt(reminder, settings, now = new Date()) {
    return this._getEffectiveDueAt(reminder, settings, now);
  }

  _buildFeedSortMeta(reminder, settings, now = new Date()) {
    const dueAt = reminderDueAt(reminder, now);
    const surfacedAt = this._getSurfaceAt(reminder, settings, now);
    const dueTime = dueAt?.getTime?.() ?? Number.POSITIVE_INFINITY;
    const surfacedTime = surfacedAt?.getTime?.() ?? dueTime;
    const snoozeResumeTime = reminder.snoozeDateTime?.getTime?.() ?? Number.NEGATIVE_INFINITY;
    const nowTime = now.getTime();
    const isDueNow = dueTime <= nowTime;
    const resumedFromSnooze = snoozeResumeTime > Number.NEGATIVE_INFINITY && snoozeResumeTime <= nowTime;

    return {
      priority: isDueNow ? 3 : resumedFromSnooze ? 2 : 1,
      time: isDueNow ? dueTime : resumedFromSnooze ? snoozeResumeTime : surfacedTime,
    };
  }

  _markSourceEntryCompleted(reminder) {
    if (!reminder || typeof reminder !== 'object' || reminder.type === 'manual') {
      return;
    }

    const ownerId = reminder.ownerId ?? reminder.sourceEntry?.ownerId ?? reminder.sourceEntry?.userId ?? null;
    if (!ownerId) {
      return;
    }

    if (reminder.type === 'medication') {
      const medEntryId = reminder.sourceEntry?.medEntryId ?? reminder.relatedEntryId ?? null;
      if (!medEntryId) {
        return;
      }

      this.medTrackerService?.markMedTaken?.(ownerId, medEntryId, new Date());
      return;
    }

    if (reminder.type === 'appointment') {
      const apptEntryId = reminder.sourceEntry?.apptEntryId ?? reminder.relatedEntryId ?? null;
      if (!apptEntryId) {
        return;
      }

      this.apptTrackerService?.markApptCompleted?.(ownerId, apptEntryId, new Date());
    }
  }

  _refreshMedicationReminder(reminder, medEntry, scheduleContext) {
    if (!reminder || reminder.type !== 'medication' || !medEntry || !scheduleContext) {
      return;
    }

    const effectiveTime = getEffectiveScheduleTime(scheduleContext.scheduleEntry);
    const reminderText = buildReminderText(
      'Medication reminder',
      `Take ${medEntry.medName || 'your medication'} on time.`,
      medEntry
    );

    reminder.relatedEntryId = normalizeReminderId(scheduleContext.relatedEntryId);
    reminder.title = reminderText.title;
    reminder.message =
      medEntry?.message ||
      `${medEntry.medName || 'Medication'}${effectiveTime ? ` is scheduled at ${effectiveTime}` : ''}.`;
    reminder.dueAt = isValidDateTime(scheduleContext.dueAt) ? scheduleContext.dueAt : reminder.dueAt;
    reminder.sourceEntry = medEntry;
  }

  _refreshAppointmentReminder(reminder, apptEntry) {
    if (!reminder || reminder.type !== 'appointment' || !apptEntry) {
      return;
    }

    const reminderText = buildReminderText(
      'Appointment reminder',
      'You have an upcoming appointment.',
      apptEntry
    );
    const scheduledDateTime = apptEntry.getScheduledDateTime?.();

    reminder.relatedEntryId = normalizeReminderId(apptEntry.apptEntryId ?? reminder.relatedEntryId);
    reminder.title = reminderText.title;
    reminder.message = reminderText.message;
    reminder.dueAt = isValidDateTime(scheduledDateTime) ? scheduledDateTime : reminder.dueAt;
    reminder.sourceEntry = apptEntry;
  }

  _removeReminderFromStore(userId, reminderId) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const { store } = getReminderStore(this.remindersByUserId, normalizedUserId);
    store.reminders.delete(reminderId);
    this.reminderIndex.delete(reminderId);
  }

  _getReminderById(reminderId) {
    const index = this.reminderIndex.get(reminderId);
    if (!index) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    const { store } = getReminderStore(this.remindersByUserId, index.ownerId);
    const reminder = store.reminders.get(reminderId);
    if (!reminder) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    return reminder;
  }

  _syncTrackerReminders(userId, now = new Date()) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const currentDateTime = normalizeDate(now, 'now') ?? new Date();
    const settings = this.notifSettingsService?.getSettings?.(normalizedUserId) ?? null;
    const { store } = getReminderStore(this.remindersByUserId, normalizedUserId);

    if (!settings || settings.medRemindersEnabled !== false) {
      const activeMedicationReminderIds = new Set();
      this.medTrackerService.listMedEntries(normalizedUserId).forEach((medEntry) => {
        if (medEntry.isTaken) {
          return;
        }

        buildMedicationScheduleContexts(medEntry, currentDateTime).forEach((scheduleContext) => {
          activeMedicationReminderIds.add(scheduleContext.reminderId);
          const existingReminder = store.reminders.get(scheduleContext.reminderId);
          if (existingReminder) {
            this._refreshMedicationReminder(existingReminder, medEntry, scheduleContext);
            return;
          }

          this._createMedicationReminder(medEntry, currentDateTime, normalizedUserId, scheduleContext);
        });
      });

      [...store.reminders.values()]
        .filter((reminder) => reminder.type === 'medication')
        .filter((reminder) => !isReminderSettled(reminder))
        .filter((reminder) => !activeMedicationReminderIds.has(reminder.reminderId))
        .forEach((reminder) => {
          this._removeReminderFromStore(normalizedUserId, reminder.reminderId);
        });
    }

    if (!settings || settings.apptRemindersEnabled !== false) {
      const activeAppointmentReminderIds = new Set();
      this.apptTrackerService.listApptEntries(normalizedUserId).forEach((apptEntry) => {
        if (apptEntry.isCompleted) {
          return;
        }

        const relatedEntryId = apptEntry.apptEntryId ?? apptEntry.relatedEntryId ?? null;
        if (!relatedEntryId) {
          return;
        }

        const reminderId = `appt-${normalizeReminderId(relatedEntryId)}`;
        activeAppointmentReminderIds.add(reminderId);

        const existingReminder = store.reminders.get(reminderId);
        if (existingReminder) {
          this._refreshAppointmentReminder(existingReminder, apptEntry);
          return;
        }

        this.createAppointmentReminder(apptEntry, currentDateTime, normalizedUserId);
      });

      [...store.reminders.values()]
        .filter((reminder) => reminder.type === 'appointment')
        .filter((reminder) => !isReminderSettled(reminder))
        .filter((reminder) => !activeAppointmentReminderIds.has(reminder.reminderId))
        .forEach((reminder) => {
          this._removeReminderFromStore(normalizedUserId, reminder.reminderId);
        });
    }
  }
}

const reminderService = new ReminderService();

export default reminderService;
