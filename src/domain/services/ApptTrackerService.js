// AppointmentTrackerService
// Role:
// Own the business logic for appointment tracking.
// This service should decide how appointments are created, edited, cancelled,
// completed, and summarized.
//
// What belongs here:
// - view appointment entries
// - create and update appointment entries
// - cancel or soft delete appointment entries
// - finish appointment entries
// - add or update notes
// - compute whether an appointment is due now
// - derive appointment status for the UI
//
// Use cases covered:
// - patient manages appt tracker
// - reminder generation based on appointment due state
//
// What should NOT belong here:
// - reminder delivery
// - Realm storage implementation
// - UI rendering and form handling
// - backend sync details
//
// Suggested service methods:
// - listApptEntries(userId)
// - addApptEntry(userId, apptData)
// - updateApptEntry(userId, apptEntryId, apptData)
// - cancelApptEntry(userId, apptEntryId)
// - markApptCompleted(userId, apptEntryId, completedAt)
// - undoApptCompleted(userId, apptEntryId)
// - getDueApptEntries(userId, now)
// - getMissedApptEntries(userId, now)
// - getApptTrackerSummary(userId, range)
//
// Model methods this service should wrap:
// - updateConcern(newConcern)
// - updateAddress(newAddress)
// - updateContactNumber(newContactNumber)
// - updateTimeSched(newTimeSched)
// - updateDateSched(newDateSched)
// - updateNote(newNote)
// - markCompleted(completedAt)
// - clearCompletedStatus()
// - getScheduledDateTime()
// - getCompletedDateTime()
// - isDue(currTime, currDate)
// - isMissed(currTime, currDate)
//
// Notes:
// - this service should work with the ApptEntryModel
// - cancellation should be soft and preserve history if possible
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: ReminderService, appointment tracker UI

import ApptEntry from '../models/ApptEntryModel';

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
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const normalizeRange = (range) => {
  if (!range) {
    return { startDate: null, endDate: null, preset: '' };
  }

  if (typeof range === 'string') {
    return { startDate: null, endDate: null, preset: range.trim().toLowerCase() };
  }

  if (typeof range !== 'object') {
    throw new TypeError('range must be an object, string, or null.');
  }

  return {
    startDate: normalizeDate(range.startDate ?? range.from ?? null, 'startDate'),
    endDate: normalizeDate(range.endDate ?? range.to ?? null, 'endDate'),
    preset: typeof range.preset === 'string' ? range.preset.trim().toLowerCase() : '',
  };
};

const buildDemoEntries = () => [
  {
    concern: 'Cardiology follow-up',
    address: 'St. Luke\'s Medical Center, BGC',
    contactNumber: '09171234567',
    dateSched: '2026-04-22',
    timeSched: '09:30',
    note: 'Bring latest blood pressure log and lab results.',
    isCompleted: false,
  },
  {
    concern: 'Diabetes check-up',
    address: 'Makati Medical Center Outpatient Clinic',
    contactNumber: '09179876543',
    dateSched: '2026-04-24',
    timeSched: '14:00',
    note: 'Fasting sugar results needed before consult.',
    isCompleted: false,
  },
  {
    concern: 'Physical therapy session',
    address: 'Active Motion Rehab Center',
    contactNumber: '09225551234',
    dateSched: '2026-04-18',
    timeSched: '11:00',
    note: 'Completed home exercise review.',
    isCompleted: true,
    completedAt: new Date('2026-04-18T12:05:00'),
  },
];

const cloneApptEntry = (entry) =>
  new ApptEntry({
    apptEntryId: entry.apptEntryId,
    concern: entry.concern,
    address: entry.address,
    contactNumber: entry.contactNumber,
    timeSched: entry.timeSched,
    dateSched: entry.dateSched,
    note: entry.note,
    isCompleted: entry.isCompleted,
    timeCompleted: entry.timeCompleted,
    dateCompleted: entry.dateCompleted,
    completedAt: entry.completedAt,
  });

const toApptEntryModel = (apptData) => {
  if (apptData instanceof ApptEntry) {
    return cloneApptEntry(apptData);
  }

  if (apptData && typeof apptData === 'object') {
    return new ApptEntry(apptData);
  }

  throw new TypeError('apptData must be an object or ApptEntry instance.');
};

const getUserStore = (storesByUserId, userId) => {
  const normalizedUserId = normalizeEntityId(userId, 'userId');
  let store = storesByUserId.get(normalizedUserId);

  if (!store) {
    store = {
      entries: new Map(),
      cancelledIds: new Set(),
      counter: 0,
    };
    storesByUserId.set(normalizedUserId, store);
  }

  return { normalizedUserId, store };
};

const ensureEntryActive = (store, apptEntryId) => {
  const entry = store.entries.get(apptEntryId);
  if (!entry) {
    throw new Error(`Appointment entry not found: ${apptEntryId}`);
  }

  if (store.cancelledIds.has(apptEntryId)) {
    throw new Error(`Appointment entry has been cancelled: ${apptEntryId}`);
  }

  return entry;
};

const isSameDay = (firstDate, secondDate) => {
  if (!(firstDate instanceof Date) || !(secondDate instanceof Date)) {
    return false;
  }

  return firstDate.toISOString().slice(0, 10) === secondDate.toISOString().slice(0, 10);
};

export class ApptTrackerService {
  constructor(initialEntriesByUserId = null) {
    this.entriesByUserId = new Map();

    if (!initialEntriesByUserId) {
      const { normalizedUserId, store } = getUserStore(this.entriesByUserId, 'current-user');
      buildDemoEntries().forEach((entry) => {
        const apptEntry = toApptEntryModel(entry);
        const entryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
        apptEntry.apptEntryId = entryId;
        store.entries.set(entryId, apptEntry);
      });
      return;
    }

    if (initialEntriesByUserId instanceof Map) {
      initialEntriesByUserId.forEach((entries, userId) => {
        const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
        entries.forEach((entry) => {
          const apptEntry = toApptEntryModel(entry);
          const entryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
          apptEntry.apptEntryId = entryId;
          store.entries.set(entryId, apptEntry);
        });
      });
      return;
    }

    if (initialEntriesByUserId && typeof initialEntriesByUserId === 'object') {
      Object.entries(initialEntriesByUserId).forEach(([userId, entries]) => {
        const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
        (Array.isArray(entries) ? entries : []).forEach((entry) => {
          const apptEntry = toApptEntryModel(entry);
          const entryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
          apptEntry.apptEntryId = entryId;
          store.entries.set(entryId, apptEntry);
        });
      });
    }
  }

  listApptEntries(userId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    return [...store.entries.values()]
      .filter((entry) => !store.cancelledIds.has(entry.apptEntryId))
      .map(cloneApptEntry);
  }

  addApptEntry(userId, apptData) {
    const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
    const apptEntry = toApptEntryModel(apptData);
    apptEntry.apptEntryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
    store.entries.set(apptEntry.apptEntryId, apptEntry);
    store.cancelledIds.delete(apptEntry.apptEntryId);
    return cloneApptEntry(apptEntry);
  }

  updateApptEntry(userId, apptEntryId, apptData) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const existing = ensureEntryActive(store, normalizedEntryId);
    const nextEntry = cloneApptEntry(existing);
    const updates = apptData && typeof apptData === 'object' ? apptData : {};

    if (updates.concern !== undefined) nextEntry.updateConcern(updates.concern);
    if (updates.address !== undefined) nextEntry.updateAddress(updates.address);
    if (updates.contactNumber !== undefined) nextEntry.updateContactNumber(updates.contactNumber);
    if (updates.timeSched !== undefined) nextEntry.updateTimeSched(updates.timeSched);
    if (updates.dateSched !== undefined) nextEntry.updateDateSched(updates.dateSched);
    if (updates.note !== undefined) nextEntry.updateNote(updates.note);

    if (updates.clearCompletedStatus === true || updates.isCompleted === false) {
      nextEntry.clearCompletedStatus();
    } else if (updates.completedAt !== undefined || updates.isCompleted === true) {
      nextEntry.markCompleted(updates.completedAt ?? new Date());
    }

    store.entries.set(normalizedEntryId, nextEntry);
    return cloneApptEntry(nextEntry);
  }

  cancelApptEntry(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    ensureEntryActive(store, normalizedEntryId);
    store.cancelledIds.add(normalizedEntryId);
    return true;
  }

  markApptCompleted(userId, apptEntryId, completedAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markCompleted(completedAt);
    return cloneApptEntry(entry);
  }

  undoApptCompleted(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.clearCompletedStatus();
    return cloneApptEntry(entry);
  }

  getDueApptEntries(userId, now = new Date()) {
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    return this.listApptEntries(userId)
      .filter((entry) => entry.isDue(currentDateTime, currentDateTime))
      .filter((entry) => !entry.isMissed(currentDateTime, currentDateTime));
  }

  getMissedApptEntries(userId, now = new Date()) {
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    return this.listApptEntries(userId).filter((entry) => entry.isMissed(currentDateTime, currentDateTime));
  }

  getApptTrackerSummary(userId, range = null) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const resolvedRange = normalizeRange(range);
    const entries = this.listApptEntries(userId);
    const filteredEntries = entries.filter((entry) => {
      if (!resolvedRange.startDate && !resolvedRange.endDate) {
        return true;
      }

      const scheduledDateTime = entry.getScheduledDateTime();
      if (!scheduledDateTime) {
        return false;
      }

      if (resolvedRange.startDate && scheduledDateTime < resolvedRange.startDate) {
        return false;
      }

      if (resolvedRange.endDate && scheduledDateTime > resolvedRange.endDate) {
        return false;
      }

      return true;
    });

    const completedEntries = filteredEntries.filter((entry) => entry.isCompleted).length;
    const currentDateTime = new Date();
    const missedEntries = filteredEntries.filter((entry) => entry.isMissed(currentDateTime, currentDateTime)).length;
    const dueEntries = filteredEntries
      .filter((entry) => entry.isDue(currentDateTime, currentDateTime))
      .filter((entry) => !entry.isMissed(currentDateTime, currentDateTime))
      .length;

    return {
      userId: normalizeEntityId(userId, 'userId'),
      range: resolvedRange,
      totalEntries: filteredEntries.length,
      activeEntries: filteredEntries.filter((entry) => !entry.isCompleted).length,
      completedEntries,
      dueEntries,
      missedEntries,
      cancelledEntries: store.cancelledIds.size,
      entries: filteredEntries.map(cloneApptEntry),
    };
  }
}

const apptTrackerService = new ApptTrackerService();

export default apptTrackerService;
