import MedEntry from '../models/MedEntryModel';
import { isSameDay, normalizeEntityId, normalizeRange } from './serviceUtils';

const cloneScheduleEntry = (entry) => ({ ...entry });

const buildDemoEntries = () => [
  {
    medName: 'Metformin',
    unitStrength: '500 mg',
    unit: 'tablet',
    totalDailyAmount: 2,
    dailySched: [
      { scheduleType: 'time', scheduledTime: '08:00', doseSize: 1 },
      { scheduleType: 'time', scheduledTime: '20:00', doseSize: 1 },
    ],
    startDate: new Date('2026-01-01'),
    endDate: null,
    instructions: 'Take with food.',
    prescriberContact: 'Dr. Santos',
    isTaken: false,
    timeTaken: null,
    dateTaken: null,
  },
  {
    medName: 'Losartan',
    unitStrength: '50 mg',
    unit: 'tablet',
    totalDailyAmount: 1,
    dailySched: [{ scheduleType: 'meal', doseSize: 1, mealContext: 'after', associatedMeal: 'breakfast', mealTime: '08:30' }],
    startDate: new Date('2026-01-15'),
    endDate: null,
    instructions: '',
    prescriberContact: 'Dr. Reyes',
    isTaken: false,
    timeTaken: null,
    dateTaken: null,
  },
];

const cloneMedEntry = (entry) =>
  new MedEntry({
    medEntryId: entry.medEntryId,
    medName: entry.medName,
    unitStrength: entry.unitStrength,
    unit: entry.unit,
    totalDailyAmount: entry.totalDailyAmount,
    dailySched: entry.dailySched.map(cloneScheduleEntry),
    startDate: entry.startDate,
    endDate: entry.endDate,
    instructions: entry.instructions,
    prescriberContact: entry.prescriberContact,
    isTaken: entry.isTaken,
    timeTaken: entry.timeTaken,
    dateTaken: entry.dateTaken,
    timesTaken: [...entry.timesTaken],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  });

const toMedEntryModel = (medData) => {
  if (medData instanceof MedEntry) {
    return cloneMedEntry(medData);
  }

  if (medData && typeof medData === 'object') {
    return new MedEntry(medData);
  }

  throw new TypeError('medData must be an object or MedEntry instance.');
};

const rangesOverlap = (startA, endA, startB, endB) => {
  const firstStart = startA instanceof Date ? startA.getTime() : null;
  const firstEnd = endA instanceof Date ? endA.getTime() : null;
  const secondStart = startB instanceof Date ? startB.getTime() : null;
  const secondEnd = endB instanceof Date ? endB.getTime() : null;

  if (firstStart === null && firstEnd === null && secondStart === null && secondEnd === null) {
    return true;
  }

  const normalizedFirstStart = firstStart ?? Number.NEGATIVE_INFINITY;
  const normalizedFirstEnd = firstEnd ?? Number.POSITIVE_INFINITY;
  const normalizedSecondStart = secondStart ?? Number.NEGATIVE_INFINITY;
  const normalizedSecondEnd = secondEnd ?? Number.POSITIVE_INFINITY;

  return normalizedFirstStart <= normalizedSecondEnd && normalizedSecondStart <= normalizedFirstEnd;
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

const buildEntrySnapshot = (entry, deleted = false) => ({
  entry: cloneMedEntry(entry),
  deleted,
});

const ensureEntryActive = (store, medEntryId) => {
  const entry = store.entries.get(medEntryId);
  if (!entry) {
    throw new Error(`Medication entry not found: ${medEntryId}`);
  }

  if (store.deletedIds.has(medEntryId)) {
    throw new Error(`Medication entry has been deleted: ${medEntryId}`);
  }

  return entry;
};

export class MedTrackerService {
  constructor(initialEntriesByUserId = null) {
    this.entriesByUserId = new Map();

    if (!initialEntriesByUserId) {
      const { normalizedUserId, store } = getUserStore(this.entriesByUserId, 'current-user');
      const demoEntries = buildDemoEntries();
      const demoCreatedAtBase = Date.now() - demoEntries.length * 1000;
      demoEntries.forEach((entry, index) => {
        const medEntry = toMedEntryModel(entry);
        const entryId = medEntry.medEntryId || `${normalizedUserId}-med-${++store.counter}`;
        medEntry.medEntryId = entryId;
        medEntry.createdAt = new Date(demoCreatedAtBase + index * 1000);
        medEntry.updatedAt = medEntry.createdAt;
        store.entries.set(entryId, medEntry);
      });
      return;
    }

    if (initialEntriesByUserId instanceof Map) {
      initialEntriesByUserId.forEach((entries, userId) => {
        const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
        entries.forEach((entry) => {
          const medEntry = toMedEntryModel(entry);
          const entryId = medEntry.medEntryId || `${normalizedUserId}-med-${++store.counter}`;
          medEntry.medEntryId = entryId;
          store.entries.set(entryId, medEntry);
        });
      });
      return;
    }

    if (initialEntriesByUserId && typeof initialEntriesByUserId === 'object') {
      Object.entries(initialEntriesByUserId).forEach(([userId, entries]) => {
        const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
        (Array.isArray(entries) ? entries : []).forEach((entry) => {
          const medEntry = toMedEntryModel(entry);
          const entryId = medEntry.medEntryId || `${normalizedUserId}-med-${++store.counter}`;
          medEntry.medEntryId = entryId;
          store.entries.set(entryId, medEntry);
        });
      });
    }
  }

  listMedEntries(userId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const currentDateTime = new Date();
    return [...store.entries.values()]
      .filter((entry) => !store.deletedIds.has(entry.medEntryId))
      .map((entry) => {
        entry.resetDailyScheduleStatusesIfNeeded(currentDateTime);
        return entry;
      })
      .map(cloneMedEntry);
  }

  addMedEntry(userId, medData) {
    const { normalizedUserId, store } = getUserStore(this.entriesByUserId, userId);
    const medEntry = toMedEntryModel(medData);
    medEntry.medEntryId = medEntry.medEntryId || `${normalizedUserId}-med-${++store.counter}`;
    medEntry.createdAt = medEntry.createdAt || new Date();
    medEntry.updatedAt = new Date();
    store.entries.set(medEntry.medEntryId, medEntry);
    store.deletedIds.delete(medEntry.medEntryId);
    return cloneMedEntry(medEntry);
  }

  updateMedEntry(userId, medEntryId, medData) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const existing = ensureEntryActive(store, normalizedEntryId);
    const nextEntry = cloneMedEntry(existing);
    const updates = medData && typeof medData === 'object' ? medData : {};

    if (updates.medName !== undefined) nextEntry.updateMedName(updates.medName);
    if (updates.unitStrength !== undefined) nextEntry.updateUnitStrength(updates.unitStrength);
    if (updates.dosage !== undefined) nextEntry.updateUnitStrength(updates.dosage);
    if (updates.unit !== undefined) nextEntry.updateUnit(updates.unit);
    if (updates.quantityUnit !== undefined) nextEntry.updateUnit(updates.quantityUnit);
    const nextTotalDailyAmount = updates.totalDailyAmount ?? updates.amount;
    if (updates.dailySched !== undefined && nextTotalDailyAmount !== undefined) {
      nextEntry.updateTotalDailyAmountAndDailySched(nextTotalDailyAmount, updates.dailySched);
    } else {
      if (updates.totalDailyAmount !== undefined) nextEntry.updateTotalDailyAmount(updates.totalDailyAmount);
      if (updates.amount !== undefined) nextEntry.updateTotalDailyAmount(updates.amount);
      if (updates.dailySched !== undefined) nextEntry.updateDailySched(updates.dailySched);
    }
    if (updates.startDate !== undefined) nextEntry.updateStartDate(updates.startDate);
    if (updates.endDate !== undefined) nextEntry.updateEndDate(updates.endDate);
    if (updates.instructions !== undefined) nextEntry.updateInstructions(updates.instructions);
    if (updates.prescriberContact !== undefined) nextEntry.updatePrescriberContact(updates.prescriberContact);
    if (updates.prescriber_contact !== undefined) nextEntry.updatePrescriberContact(updates.prescriber_contact);

    if (updates.clearTakenStatus === true || updates.isTaken === false) {
      nextEntry.clearTakenStatus();
    } else if (updates.takenAt !== undefined || updates.isTaken === true) {
      nextEntry.markTaken(updates.takenAt ?? new Date());
    }

    store.entries.set(normalizedEntryId, nextEntry);
    return cloneMedEntry(nextEntry);
  }

  softDeleteMedEntry(userId, medEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    ensureEntryActive(store, normalizedEntryId);
    store.deletedIds.add(normalizedEntryId);
    return true;
  }

  markMedTaken(userId, medEntryId, takenAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markTaken(takenAt);
    return cloneMedEntry(entry);
  }

  undoMedTaken(userId, medEntryId) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.clearTakenStatus();
    return cloneMedEntry(entry);
  }

  markMedScheduleTaken(userId, medEntryId, scheduleIndex, takenAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markScheduleTaken(scheduleIndex, takenAt);
    return cloneMedEntry(entry);
  }

  markMedScheduleSkipped(userId, medEntryId, scheduleIndex, skippedAt = new Date()) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.markScheduleSkipped(scheduleIndex, skippedAt);
    return cloneMedEntry(entry);
  }

  clearMedScheduleStatus(userId, medEntryId, scheduleIndex) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const normalizedEntryId = normalizeEntityId(medEntryId, 'medEntryId');
    const entry = ensureEntryActive(store, normalizedEntryId);
    entry.clearScheduleStatus(scheduleIndex);
    return cloneMedEntry(entry);
  }

  getDueMedEntries(userId, now = new Date()) {
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    return this.listMedEntries(userId).filter((entry) => entry.isDue(currentDateTime, currentDateTime));
  }

  getMissedMedEntries(userId, now = new Date()) {
    const currentDateTime = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(currentDateTime.getTime())) {
      throw new RangeError('now must be a valid date or datetime.');
    }

    return this.listMedEntries(userId).filter((entry) => entry.isMissed(currentDateTime, currentDateTime));
  }

  getMedTrackerSummary(userId, range = null) {
    const { store } = getUserStore(this.entriesByUserId, userId);
    const resolvedRange = normalizeRange(range);
    const entries = this.listMedEntries(userId);
    const filteredEntries = entries.filter((entry) => {
      if (!resolvedRange.startDate && !resolvedRange.endDate) {
        return true;
      }

      return rangesOverlap(entry.startDate, entry.endDate, resolvedRange.startDate, resolvedRange.endDate);
    });

    const takenEntries = filteredEntries.filter((entry) => entry.isTaken).length;
    const currentDateTime = new Date();
    const missedEntries = filteredEntries.filter((entry) => entry.isMissed(currentDateTime, currentDateTime)).length;
    const dueEntries = filteredEntries.filter((entry) => entry.isDue(currentDateTime, currentDateTime)).length;

    return {
      userId: normalizeEntityId(userId, 'userId'),
      range: resolvedRange,
      totalEntries: filteredEntries.length,
      activeEntries: filteredEntries.filter((entry) => entry.isActiveOnDate(new Date())).length,
      takenEntries,
      dueEntries,
      missedEntries,
      deletedEntries: store.deletedIds.size,
      entries: filteredEntries.map(cloneMedEntry),
    };
  }
}

const medTrackerService = new MedTrackerService();

export default medTrackerService;
