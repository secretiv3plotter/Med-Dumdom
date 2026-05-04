import ApptEntry from '../models/ApptEntryModel';
import {
  normalizeEntityId,
  normalizeRange as normalizeServiceRange,
} from './serviceUtils';

const normalizeRange = (range) => normalizeServiceRange(range, { emptyPreset: '' });

const buildDemoEntries = () => [
  {
    concern: 'Primary Care Follow-up',
    address: 'St. Luke\'s Medical Center, BGC',
    doctorName: 'Dr. Santos',
    contactNumber: '09171234567',
    dateSched: '2026-04-22',
    timeSched: '09:30',
    note: 'Bring latest blood pressure log and lab results.',
    isCompleted: false,
  },
  {
    concern: 'Diabetes check-up',
    address: 'Makati Medical Center Outpatient Clinic',
    doctorName: 'Dr. Reyes',
    contactNumber: '09179876543',
    dateSched: '2026-04-24',
    timeSched: '14:00',
    note: 'Fasting sugar results needed before consult.',
    isCompleted: false,
  },
  {
    concern: 'Physical therapy session',
    address: 'Active Motion Rehab Center',
    doctorName: '',
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
    doctorName: entry.doctorName,
    contactNumber: entry.contactNumber,
    timeSched: entry.timeSched,
    dateSched: entry.dateSched,
    note: entry.note,
    isCompleted: entry.isCompleted,
    isSkipped: entry.isSkipped,
    timeCompleted: entry.timeCompleted,
    dateCompleted: entry.dateCompleted,
    completedAt: entry.completedAt,
    skippedAt: entry.skippedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
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
      deletedIds: new Set(),
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

  if (store.deletedIds.has(apptEntryId)) {
    throw new Error(`Appointment entry has been deleted: ${apptEntryId}`);
  }

  return entry;
};

export class ApptTrackerService {
  constructor(initialEntriesByUserId = null) {
    this.entriesByUserId = new Map();

    if (!initialEntriesByUserId) {
      const { normalizedUserId, store } = getUserStore(this.entriesByUserId, 'current-user');
      const demoEntries = buildDemoEntries();
      const demoCreatedAtBase = Date.now() - demoEntries.length * 1000;
      demoEntries.forEach((entry, index) => {
        const apptEntry = toApptEntryModel(entry);
        const entryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
        apptEntry.apptEntryId = entryId;
        apptEntry.createdAt = new Date(demoCreatedAtBase + index * 1000).toISOString();
        apptEntry.updatedAt = apptEntry.createdAt;
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
      .filter((entry) => !store.deletedIds.has(entry.apptEntryId))
      .map(cloneApptEntry);
  }

  addApptEntry(userId, apptData) {
    const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
    const apptEntry = toApptEntryModel(apptData);
    apptEntry.apptEntryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
    apptEntry.createdAt = apptEntry.createdAt || new Date().toISOString();
    apptEntry.updatedAt = new Date().toISOString();
    store.entries.set(apptEntry.apptEntryId, apptEntry);
    store.deletedIds.delete(apptEntry.apptEntryId);
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
    if (updates.doctorName !== undefined) nextEntry.updateDoctorName(updates.doctorName);
    if (updates.contactNumber !== undefined) nextEntry.updateContactNumber(updates.contactNumber);
    if (updates.contactNum !== undefined) nextEntry.updateContactNumber(updates.contactNum);
    if (updates.timeSched !== undefined) nextEntry.updateTimeSched(updates.timeSched);
    if (updates.dateSched !== undefined) nextEntry.updateDateSched(updates.dateSched);
    if (updates.note !== undefined) nextEntry.updateNote(updates.note);

    if (updates.clearCompletedStatus === true || updates.isCompleted === false) {
      nextEntry.clearCompletedStatus();
    } else if (updates.completedAt !== undefined || updates.isCompleted === true) {
      nextEntry.markCompleted(updates.completedAt ?? new Date());
    }

    if (updates.clearSkippedStatus === true || updates.isSkipped === false) {
      nextEntry.clearSkippedStatus();
    } else if (updates.skippedAt !== undefined || updates.isSkipped === true) {
      nextEntry.markSkipped(updates.skippedAt ?? new Date());
    }

    nextEntry.updatedAt = new Date().toISOString();
    store.entries.set(normalizedEntryId, nextEntry);
    return cloneApptEntry(nextEntry);
  }

  softDeleteApptEntry(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    ensureEntryActive(store, normalizedEntryId);
    store.deletedIds.add(normalizedEntryId);
    return true;
  }

  cancelApptEntry(userId, apptEntryId) {
    return this.softDeleteApptEntry(userId, apptEntryId);
  }

  markApptCompleted(userId, apptEntryId, completedAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markCompleted(completedAt);
    entry.updatedAt = new Date().toISOString();
    return cloneApptEntry(entry);
  }

  undoApptCompleted(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.clearCompletedStatus();
    entry.updatedAt = new Date().toISOString();
    return cloneApptEntry(entry);
  }

  markApptSkipped(userId, apptEntryId, skippedAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markSkipped(skippedAt);
    entry.updatedAt = new Date().toISOString();
    return cloneApptEntry(entry);
  }

  undoApptSkipped(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.clearSkippedStatus();
    entry.updatedAt = new Date().toISOString();
    return cloneApptEntry(entry);
  }

  listPreviousApptRecords(userId, now = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    return [...store.entries.values()]
      .filter((entry) => (
        store.deletedIds.has(entry.apptEntryId) ||
        entry.isCompleted ||
        entry.isSkipped ||
        entry.isMissed(currentDateTime, currentDateTime)
      ))
      .map((entry) => ({
        entry: cloneApptEntry(entry),
        deleted: store.deletedIds.has(entry.apptEntryId),
        completed: entry.isCompleted,
        skipped: entry.isSkipped,
        missed: !entry.isCompleted && !entry.isSkipped && entry.isMissed(currentDateTime, currentDateTime),
      }));
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
    const skippedEntries = filteredEntries.filter((entry) => entry.isSkipped).length;
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
      activeEntries: filteredEntries.filter((entry) => !entry.isCompleted && !entry.isSkipped).length,
      completedEntries,
      skippedEntries,
      dueEntries,
      missedEntries,
      deletedEntries: store.deletedIds.size,
      entries: filteredEntries.map(cloneApptEntry),
    };
  }
}

const apptTrackerService = new ApptTrackerService();

export default apptTrackerService;
