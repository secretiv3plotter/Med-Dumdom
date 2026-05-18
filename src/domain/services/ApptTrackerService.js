import ApptEntry from '../models/ApptEntryModel';
import {
  normalizeEntityId,
  normalizeRange as normalizeServiceRange,
} from './serviceUtils';

const normalizeRange = (range) => normalizeServiceRange(range, { emptyPreset: '' });

const scheduledDateTime = (entry) => {
  const date = new Date(`${entry.dateSched}T${entry.timeSched}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const nextMidnightAfterSchedule = (entry) => {
  const scheduled = scheduledDateTime(entry);
  if (!scheduled) {
    return null;
  }

  const nextMidnight = new Date(scheduled.getTime());
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  return nextMidnight;
};

const cloneHistoryRecord = (record) => ({ ...record });

const buildHistoryRecord = (entry, finalStatus, resolvedAt = new Date()) => {
  const resolvedDate = resolvedAt instanceof Date ? resolvedAt : new Date(resolvedAt);
  const fallbackDate = Number.isNaN(resolvedDate.getTime()) ? new Date() : resolvedDate;

  return {
    historyId: `${entry.apptEntryId}-${finalStatus}`,
    apptEntryId: entry.apptEntryId,
    concern: entry.concern,
    address: entry.address,
    doctorName: entry.doctorName || '',
    contactNumber: entry.contactNumber || '',
    dateSched: entry.dateSched,
    timeSched: entry.timeSched,
    note: entry.note || '',
    finalStatus,
    completedAt: finalStatus === 'completed' ? entry.completedAt || fallbackDate.toISOString() : null,
    skippedAt: finalStatus === 'skipped' ? entry.skippedAt || fallbackDate.toISOString() : null,
    missedAt: finalStatus === 'missed' ? (scheduledDateTime(entry) || fallbackDate).toISOString() : null,
    deletedAt: finalStatus === 'deleted' ? fallbackDate.toISOString() : null,
    createdAt: new Date().toISOString(),
  };
};

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

  return entry;
};

export class ApptTrackerService {
  constructor(initialEntriesByUserId = null) {
    this.entriesByUserId = new Map();
    this.historyByUserId = new Map();

    if (!initialEntriesByUserId) {
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

  getHistoryStore(userId) {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    let store = this.historyByUserId.get(normalizedUserId);
    if (!store) {
      store = new Map();
      this.historyByUserId.set(normalizedUserId, store);
    }

    return { normalizedUserId, store };
  }

  snapshotHistory(userId, entry, finalStatus, resolvedAt = new Date()) {
    const { store } = this.getHistoryStore(userId);
    const record = buildHistoryRecord(entry, finalStatus, resolvedAt);
    store.set(record.historyId, record);
    return cloneHistoryRecord(record);
  }

  snapshotFinalizedEntriesIfNeeded(userId, now = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    [...store.entries.values()].forEach((entry) => {
      const finalizeAt = nextMidnightAfterSchedule(entry);
      if (!finalizeAt || currentDateTime < finalizeAt) {
        return;
      }

      if (entry.isCompleted) {
        this.snapshotHistory(userId, entry, 'completed', entry.completedAt || currentDateTime);
      } else if (entry.isSkipped) {
        this.snapshotHistory(userId, entry, 'skipped', entry.skippedAt || currentDateTime);
      } else if (entry.isMissed(currentDateTime, currentDateTime)) {
        this.snapshotHistory(userId, entry, 'missed', scheduledDateTime(entry) || currentDateTime);
      } else {
        return;
      }

      store.entries.delete(entry.apptEntryId);
    });
  }

  listApptEntries(userId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    this.snapshotFinalizedEntriesIfNeeded(userId);
    return [...store.entries.values()].map(cloneApptEntry);
  }

  addApptEntry(userId, apptData) {
    const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
    const apptEntry = toApptEntryModel(apptData);
    apptEntry.apptEntryId = apptEntry.apptEntryId || `${normalizedUserId}-appt-${++store.counter}`;
    apptEntry.createdAt = apptEntry.createdAt || new Date().toISOString();
    apptEntry.updatedAt = new Date().toISOString();
    store.entries.set(apptEntry.apptEntryId, apptEntry);
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

  deleteApptEntry(userId, apptEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(apptEntryId, 'apptEntryId');
    ensureEntryActive(store, normalizedEntryId);
    store.entries.delete(normalizedEntryId);
    return true;
  }

  cancelApptEntry(userId, apptEntryId) {
    return this.deleteApptEntry(userId, apptEntryId);
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
    this.snapshotFinalizedEntriesIfNeeded(userId, now);
    const { store } = this.getHistoryStore(userId);
    return [...store.values()]
      .map(cloneHistoryRecord)
      .sort((firstEntry, secondEntry) => {
        const dateCompare = String(secondEntry.dateSched || '').localeCompare(String(firstEntry.dateSched || ''));
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return String(secondEntry.timeSched || '').localeCompare(String(firstEntry.timeSched || ''));
      });
  }

  deleteApptTrackerHistoryRecords(userId, historyIds = []) {
    const { store } = this.getHistoryStore(userId);
    const normalizedHistoryIds = Array.from(new Set(historyIds.map((historyId) => String(historyId || '').trim()).filter(Boolean)));
    let deletedCount = 0;
    normalizedHistoryIds.forEach((historyId) => {
      if (store.delete(historyId)) {
        deletedCount += 1;
      }
    });
    return deletedCount;
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
      deletedEntries: 0,
      entries: filteredEntries.map(cloneApptEntry),
    };
  }
}

const apptTrackerService = new ApptTrackerService();

export default apptTrackerService;
