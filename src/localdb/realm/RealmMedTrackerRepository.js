import MedEntry from '../../domain/models/MedEntryModel';
import { getIntervalOccurrenceDateTime } from '../../domain/models/medEntryModelUtils';

const DEFAULT_PATIENT_EMAIL = 'current-user@local.invalid';
const STALE_MARKED_SCHEDULE_MS = 24 * 60 * 60 * 1000;
const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
};

const SYNC_OPERATION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const normalizeUserId = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new RangeError('userId cannot be empty.');
  }

  return normalizedUserId;
};

const normalizeMedEntryId = (medEntryId) => {
  const normalizedMedEntryId = String(medEntryId || '').trim();
  if (!normalizedMedEntryId) {
    throw new RangeError('medEntryId cannot be empty.');
  }

  return normalizedMedEntryId;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
};

const toNullableDate = (value) => {
  const date = toDate(value);
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const toIsoStringOrNull = (value) => {
  const date = toNullableDate(value);
  return date ? date.toISOString() : null;
};

const sumScheduleDoseSizes = (dailySched = []) =>
  Array.from(dailySched || []).reduce((total, entry) => total + Number(entry?.doseSize || 0), 0);

const dateKey = (date) => {
  const normalizedDate = toNullableDate(date) ?? new Date();
  return normalizedDate.toISOString().slice(0, 10);
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const isScheduleEntryForDate = (scheduleEntry, dateValue) => {
  const date = toNullableDate(dateValue);
  if (!date) {
    return false;
  }

  if (scheduleEntry?.dayOfWeek) {
    return DAYS_OF_WEEK[date.getDay()] === scheduleEntry.dayOfWeek;
  }

  if (scheduleEntry?.monthOfYear) {
    if (MONTHS[date.getMonth()] !== scheduleEntry.monthOfYear) {
      return false;
    }
  }

  if (scheduleEntry?.dayOfMonth) {
    return date.getDate() === Number(scheduleEntry.dayOfMonth);
  }

  return true;
};

const toRealmScheduleEntry = (entry, index) => ({
  scheduleIndex: index,
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime ?? null,
  intervalMinutes: entry.intervalMinutes ? Number(entry.intervalMinutes) : null,
  intervalUnit: entry.intervalUnit ?? '',
  intervalCount: entry.intervalCount ? Number(entry.intervalCount) : null,
  dayOfWeek: entry.dayOfWeek ?? '',
  monthOfYear: entry.monthOfYear ?? '',
  dayOfMonth: entry.dayOfMonth ? Number(entry.dayOfMonth) : null,
  instructions: entry.instructions ?? '',
  status: entry.status ?? 'pending',
  takenAt: toNullableDate(entry.takenAt),
  skippedAt: toNullableDate(entry.skippedAt),
  activatedAt: toNullableDate(entry.activatedAt),
});

const toModelScheduleEntry = (entry) => ({
  doseSize: entry.doseSize,
  scheduledTime: entry.scheduledTime || null,
  intervalMinutes: entry.intervalMinutes || null,
  intervalUnit: entry.intervalUnit || '',
  intervalCount: entry.intervalCount || null,
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth || null,
  instructions: entry.instructions || '',
  status: entry.status || 'pending',
  takenAt: entry.takenAt || null,
  skippedAt: entry.skippedAt || null,
  activatedAt: entry.activatedAt || null,
});

const toPlainScheduleEntry = (entry) => ({
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime || null,
  intervalMinutes: entry.intervalMinutes || null,
  intervalUnit: entry.intervalUnit || '',
  intervalCount: entry.intervalCount || null,
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth || null,
  instructions: entry.instructions || '',
  status: entry.status || 'pending',
  takenAt: toIsoStringOrNull(entry.takenAt),
  skippedAt: toIsoStringOrNull(entry.skippedAt),
  activatedAt: toIsoStringOrNull(entry.activatedAt),
});

const toMedEntryModel = (entry) =>
  new MedEntry({
    medEntryId: entry.medEntryId,
    medName: entry.medName,
    unitStrength: entry.unitStrength || '',
    unit: entry.unit,
    totalDailyAmount: entry.totalDailyAmount,
    dailySched: Array.from(entry.dailySched || []).map(toModelScheduleEntry),
    startDate: entry.startDate,
    endDate: entry.endDate,
    instructions: entry.instructions || '',
    prescriberContact: entry.prescriberContact || '',
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
    totalPrescribedDoses: entry.totalPrescribedDoses ?? null,
  });

const toPlainMedEntry = (entry) => ({
  medEntryId: entry.medEntryId,
  patientUserId: entry.patientUserId,
  medName: entry.medName,
  unitStrength: entry.unitStrength || '',
  unit: entry.unit,
  totalDailyAmount: Number(entry.totalDailyAmount || 0),
  dailySched: Array.from(entry.dailySched || []).map(toPlainScheduleEntry),
  startDate: toIsoStringOrNull(entry.startDate),
  endDate: toIsoStringOrNull(entry.endDate),
  instructions: entry.instructions || '',
  prescriberContact: entry.prescriberContact || '',
  totalPrescribedDoses: entry.totalPrescribedDoses ?? null,
  isDeleted: Boolean(entry.isDeleted),
  deletedAt: toIsoStringOrNull(entry.deletedAt),
  syncStatus: entry.syncStatus || SYNC_STATUS.SYNCED,
  syncOperation: entry.syncOperation || '',
  syncError: entry.syncError || '',
  lastSyncedAt: toIsoStringOrNull(entry.lastSyncedAt),
  localUpdatedAt: toIsoStringOrNull(entry.localUpdatedAt),
  remoteUpdatedAt: toIsoStringOrNull(entry.remoteUpdatedAt),
  syncVersion: Number(entry.syncVersion || 0),
  syncDeviceId: entry.syncDeviceId || '',
  createdAt: toIsoStringOrNull(entry.createdAt),
  updatedAt: toIsoStringOrNull(entry.updatedAt),
});

const toHistoryScheduleEntry = (entry, index = 0) => ({
  scheduleIndex: Number(entry.scheduleIndex ?? index),
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime ?? null,
  intervalMinutes: entry.intervalMinutes ? Number(entry.intervalMinutes) : null,
  intervalUnit: entry.intervalUnit ?? '',
  intervalCount: entry.intervalCount ? Number(entry.intervalCount) : null,
  dayOfWeek: entry.dayOfWeek ?? '',
  monthOfYear: entry.monthOfYear ?? '',
  dayOfMonth: entry.dayOfMonth ? Number(entry.dayOfMonth) : null,
  instructions: entry.instructions ?? '',
  finalStatus: entry.status === 'taken' ? 'taken' : entry.status === 'skipped' ? 'skipped' : 'missed',
  takenAt: toNullableDate(entry.takenAt),
  skippedAt: toNullableDate(entry.skippedAt),
  activatedAt: toNullableDate(entry.activatedAt),
  resolvedAt: toNullableDate(entry.takenAt || entry.skippedAt) ?? new Date(),
});

const toHistoryModelScheduleEntry = (entry) => ({
  scheduleIndex: Number(entry.scheduleIndex ?? 0),
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime || null,
  intervalMinutes: entry.intervalMinutes || null,
  intervalUnit: entry.intervalUnit || '',
  intervalCount: entry.intervalCount || null,
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth || null,
  instructions: entry.instructions || '',
  finalStatus: entry.finalStatus || 'missed',
  takenAt: entry.takenAt || null,
  skippedAt: entry.skippedAt || null,
  activatedAt: entry.activatedAt || null,
  resolvedAt: entry.resolvedAt || null,
});

const isIntervalScheduleEntry = (entry) =>
  !!entry?.intervalMinutes || (entry?.intervalUnit === 'months' && Number(entry?.intervalCount || 0) > 0);

const getMarkedScheduleDate = (entry) => toNullableDate(entry?.takenAt || entry?.skippedAt);

const getScheduledDateTimeForDate = (scheduleEntry, dateValue) => {
  const scheduleMinutes = toMinutes(scheduleEffectiveTime(scheduleEntry));
  if (scheduleMinutes === null) {
    return null;
  }

  const scheduleDateTime = new Date(dateValue.getTime());
  scheduleDateTime.setHours(Math.floor(scheduleMinutes / 60), scheduleMinutes % 60, 0, 0);
  return scheduleDateTime;
};

const getLatestScheduleOccurrenceDateTime = (entryModel, scheduleEntry, now) => {
  if (isIntervalScheduleEntry(scheduleEntry)) {
    return getIntervalOccurrenceDateTime(scheduleEntry, now);
  }

  if (scheduleEntry?.intervalUnit === 'asNeeded') {
    return null;
  }

  for (let dayOffset = 0; dayOffset <= 370; dayOffset += 1) {
    const candidateDay = new Date(now.getTime());
    candidateDay.setDate(candidateDay.getDate() - dayOffset);
    candidateDay.setHours(0, 0, 0, 0);

    if (!entryModel.isActiveOnDate(candidateDay) || !isScheduleEntryForDate(scheduleEntry, candidateDay)) {
      continue;
    }

    const occurrence = getScheduledDateTimeForDate(scheduleEntry, candidateDay);
    if (occurrence && occurrence <= now) {
      return occurrence;
    }
  }

  return null;
};

const getScheduleStatusChangedAt = (entryModel, scheduleEntry, scheduleIndex, now) => {
  const markedAt = getMarkedScheduleDate(scheduleEntry);
  if (markedAt) {
    return markedAt;
  }

  const status = entryModel.getScheduleStatus(scheduleIndex, now, now);
  if (status === 'upcoming' || status === 'pending') {
    return null;
  }

  return getLatestScheduleOccurrenceDateTime(entryModel, scheduleEntry, now);
};

const isStaleActionableSchedule = (entryModel, scheduleEntry, scheduleIndex, now) => {
  const markedAt = getMarkedScheduleDate(scheduleEntry);
  if (markedAt) {
    return now.getTime() - markedAt.getTime() >= STALE_MARKED_SCHEDULE_MS;
  }

  const status = entryModel.getScheduleStatus(scheduleIndex, now, now);
  if (status === 'upcoming' || status === 'pending') {
    return false;
  }

  const changedAt = getScheduleStatusChangedAt(entryModel, scheduleEntry, scheduleIndex, now);
  return !!changedAt && now.getTime() - changedAt.getTime() >= STALE_MARKED_SCHEDULE_MS;
};

const toHistoricalScheduleEntry = (scheduleEntry) => {
  if (scheduleEntry?.status === 'taken' || scheduleEntry?.status === 'skipped') {
    return scheduleEntry;
  }

  return {
    ...scheduleEntry,
    status: 'missed',
    takenAt: null,
    skippedAt: null,
  };
};

const toHistoryModel = (entry) => ({
  historyId: entry.historyId,
  patientUserId: entry.patientUserId,
  medEntryId: entry.medEntryId,
  historyDate: entry.historyDate,
  medName: entry.medName,
  unitStrength: entry.unitStrength || '',
  unit: entry.unit,
  totalDailyAmount: entry.totalDailyAmount,
  startDate: entry.startDate,
  endDate: entry.endDate,
  instructions: entry.instructions || '',
  prescriberContact: entry.prescriberContact || '',
  dailySchedFinalStatuses: Array.from(entry.dailySchedFinalStatuses || []).map(toHistoryModelScheduleEntry),
  completedAllSchedules: Boolean(entry.completedAllSchedules),
  isDeleted: Boolean(entry.isDeleted),
  deletedAt: entry.deletedAt || null,
  createdAt: entry.createdAt,
});

const toPlainHistoryScheduleEntry = (entry) => ({
  scheduleIndex: Number(entry.scheduleIndex ?? 0),
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime || null,
  intervalMinutes: entry.intervalMinutes || null,
  intervalUnit: entry.intervalUnit || '',
  intervalCount: entry.intervalCount || null,
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth || null,
  instructions: entry.instructions || '',
  finalStatus: entry.finalStatus || 'missed',
  takenAt: toIsoStringOrNull(entry.takenAt),
  skippedAt: toIsoStringOrNull(entry.skippedAt),
  activatedAt: toIsoStringOrNull(entry.activatedAt),
  resolvedAt: toIsoStringOrNull(entry.resolvedAt),
});

const toPlainMedHistory = (entry) => ({
  historyId: entry.historyId,
  patientUserId: entry.patientUserId,
  medEntryId: entry.medEntryId,
  historyDate: entry.historyDate,
  medName: entry.medName,
  unitStrength: entry.unitStrength || '',
  unit: entry.unit,
  totalDailyAmount: Number(entry.totalDailyAmount || 0),
  startDate: toIsoStringOrNull(entry.startDate),
  endDate: toIsoStringOrNull(entry.endDate),
  instructions: entry.instructions || '',
  prescriberContact: entry.prescriberContact || '',
  dailySchedFinalStatuses: Array.from(entry.dailySchedFinalStatuses || []).map(toPlainHistoryScheduleEntry),
  completedAllSchedules: Boolean(entry.completedAllSchedules),
  isDeleted: Boolean(entry.isDeleted),
  deletedAt: toIsoStringOrNull(entry.deletedAt),
  syncStatus: entry.syncStatus || SYNC_STATUS.SYNCED,
  syncOperation: entry.syncOperation || '',
  syncError: entry.syncError || '',
  lastSyncedAt: toIsoStringOrNull(entry.lastSyncedAt),
  localUpdatedAt: toIsoStringOrNull(entry.localUpdatedAt),
  remoteUpdatedAt: toIsoStringOrNull(entry.remoteUpdatedAt),
  syncVersion: Number(entry.syncVersion || 0),
  syncDeviceId: entry.syncDeviceId || '',
  createdAt: toIsoStringOrNull(entry.createdAt),
});

const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const scheduleEffectiveTime = (entry) => entry.scheduledTime || '';

export default class RealmMedTrackerRepository {
  constructor(realm) {
    this.realm = realm;
  }

  ensurePatientUser(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const existingUser = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
    if (existingUser) {
      return existingUser;
    }

    const now = new Date();
    return this.realm.create('PatientUser', {
      userId: normalizedUserId,
      email: DEFAULT_PATIENT_EMAIL,
      passwordHash: null,
      fullName: null,
      birthDate: null,
      address: null,
      profilePicture: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
  }

  persistMedEntry(userId, medEntry, existingCreatedAt = null, syncOptions = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const now = new Date();
    const existingEntry = medEntry.medEntryId
      ? this.realm.objectForPrimaryKey('MedEntry', medEntry.medEntryId)
      : null;
    const markPending = syncOptions.markPending !== false;
    const operation = syncOptions.operation ||
      (existingEntry?.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : existingEntry ? SYNC_OPERATION.UPDATE : SYNC_OPERATION.CREATE);
    const localUpdatedAt = syncOptions.localUpdatedAt ? toNullableDate(syncOptions.localUpdatedAt) : now;
    const createdAt = existingCreatedAt || existingEntry?.createdAt || now;
    const syncVersion = Number(syncOptions.syncVersion ?? existingEntry?.syncVersion ?? 0) + (markPending ? 1 : 0);

    return this.realm.create(
      'MedEntry',
      {
        medEntryId: medEntry.medEntryId,
        patientUserId: normalizedUserId,
        medName: medEntry.medName,
        unitStrength: medEntry.unitStrength || '',
        unit: medEntry.unit,
        totalDailyAmount: medEntry.totalDailyAmount,
        dailySched: medEntry.dailySched.map(toRealmScheduleEntry),
        startDate: medEntry.startDate,
        endDate: medEntry.endDate,
        instructions: medEntry.instructions || '',
        prescriberContact: medEntry.prescriberContact || '',
        totalPrescribedDoses: medEntry.totalPrescribedDoses,
        isDeleted: Boolean(syncOptions.isDeleted ?? medEntry.isDeleted ?? false),
        deletedAt: toNullableDate(syncOptions.deletedAt ?? medEntry.deletedAt),
        syncStatus: syncOptions.syncStatus || (markPending ? SYNC_STATUS.PENDING : existingEntry?.syncStatus || SYNC_STATUS.SYNCED),
        syncOperation: syncOptions.syncOperation ?? (markPending ? operation : existingEntry?.syncOperation || ''),
        syncError: syncOptions.syncError ?? (markPending ? '' : existingEntry?.syncError || ''),
        lastSyncedAt: toNullableDate(syncOptions.lastSyncedAt ?? existingEntry?.lastSyncedAt),
        localUpdatedAt,
        remoteUpdatedAt: toNullableDate(syncOptions.remoteUpdatedAt ?? existingEntry?.remoteUpdatedAt),
        syncVersion,
        syncDeviceId: syncOptions.syncDeviceId ?? existingEntry?.syncDeviceId ?? '',
        createdAt,
        updatedAt: now,
      },
      'modified',
    );
  }

  snapshotDailyHistory(userId, entry, historyDate = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const historyDateKey = dateKey(historyDate);
    const historyId = `${normalizedUserId}-${entry.medEntryId}-${historyDateKey}`;
    const activeSchedules = Array.from(entry.dailySched || []).filter((scheduleEntry) =>
      isScheduleEntryForDate(scheduleEntry, historyDate)
    );

    if (!activeSchedules.length) {
      return null;
    }

    this.realm.create(
      'MedTrackerDailyHistory',
      {
        historyId,
        patientUserId: normalizedUserId,
        medEntryId: entry.medEntryId,
        historyDate: historyDateKey,
        medName: entry.medName,
        unitStrength: entry.unitStrength || '',
        unit: entry.unit,
        totalDailyAmount: entry.totalDailyAmount,
        startDate: entry.startDate,
        endDate: entry.endDate,
        instructions: entry.instructions || '',
        prescriberContact: entry.prescriberContact || '',
        dailySchedFinalStatuses: activeSchedules.map(toHistoryScheduleEntry),
        completedAllSchedules: activeSchedules.every((scheduleEntry) => scheduleEntry.status === 'taken'),
        isDeleted: false,
        deletedAt: null,
        syncStatus: SYNC_STATUS.PENDING,
        syncOperation: SYNC_OPERATION.CREATE,
        syncError: '',
        lastSyncedAt: null,
        localUpdatedAt: new Date(),
        remoteUpdatedAt: null,
        syncVersion: 1,
        syncDeviceId: '',
        createdAt: new Date(),
      },
      'modified',
    );
  }

  snapshotMarkedScheduleHistory(userId, entry, scheduleItems, historyDate = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const historyDateKey = dateKey(historyDate);
    const historyId = `${normalizedUserId}-${entry.medEntryId}-${historyDateKey}`;
    const existingHistory = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', historyId);
    const scheduleByIndex = new Map(
      existingHistory
        ? Array.from(existingHistory.dailySchedFinalStatuses || [])
            .map(toHistoryModelScheduleEntry)
            .map((scheduleEntry) => [Number(scheduleEntry.scheduleIndex || 0), scheduleEntry])
        : []
    );

    scheduleItems.forEach(({ scheduleEntry, scheduleIndex }) => {
      scheduleByIndex.set(
        Number(scheduleIndex),
        toHistoryScheduleEntry({ ...scheduleEntry, scheduleIndex }, scheduleIndex)
      );
    });

    const dailySchedFinalStatuses = Array.from(scheduleByIndex.values())
      .sort((firstEntry, secondEntry) => Number(firstEntry.scheduleIndex || 0) - Number(secondEntry.scheduleIndex || 0));

    if (!dailySchedFinalStatuses.length) {
      return null;
    }

    return this.realm.create(
      'MedTrackerDailyHistory',
      {
        historyId,
        patientUserId: normalizedUserId,
        medEntryId: entry.medEntryId,
        historyDate: historyDateKey,
        medName: entry.medName,
        unitStrength: entry.unitStrength || '',
        unit: entry.unit,
        totalDailyAmount: entry.totalDailyAmount,
        startDate: entry.startDate,
        endDate: entry.endDate,
        instructions: entry.instructions || '',
        prescriberContact: entry.prescriberContact || '',
        dailySchedFinalStatuses,
        completedAllSchedules: dailySchedFinalStatuses.every((scheduleEntry) => scheduleEntry.finalStatus === 'taken'),
        isDeleted: false,
        deletedAt: null,
        syncStatus: SYNC_STATUS.PENDING,
        syncOperation: existingHistory?.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.UPDATE,
        syncError: '',
        lastSyncedAt: toNullableDate(existingHistory?.lastSyncedAt),
        localUpdatedAt: new Date(),
        remoteUpdatedAt: toNullableDate(existingHistory?.remoteUpdatedAt),
        syncVersion: Number(existingHistory?.syncVersion || 0) + 1,
        syncDeviceId: existingHistory?.syncDeviceId || '',
        createdAt: existingHistory?.createdAt || new Date(),
      },
      'modified',
    );
  }

  archiveStaleMarkedSchedules(userId, entryModel, existingCreatedAt = null, now = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const staleScheduleItems = entryModel.dailySched
      .map((scheduleEntry, scheduleIndex) => ({
        scheduleEntry: toHistoricalScheduleEntry(scheduleEntry),
        scheduleIndex,
        markedAt: getScheduleStatusChangedAt(entryModel, scheduleEntry, scheduleIndex, now),
        currentScheduleEntry: scheduleEntry,
      }))
      .filter(({ currentScheduleEntry, scheduleIndex }) =>
        isStaleActionableSchedule(entryModel, currentScheduleEntry, scheduleIndex, now)
      )
      .filter(({ scheduleIndex, markedAt }) => {
        const historyDateKey = dateKey(markedAt);
        const historyId = `${normalizedUserId}-${entryModel.medEntryId}-${historyDateKey}`;
        const existingHistory = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', historyId);
        if (!existingHistory) {
          return true;
        }

        return !Array.from(existingHistory.dailySchedFinalStatuses || [])
          .some((historyEntry) => Number(historyEntry.scheduleIndex || 0) === Number(scheduleIndex));
      });

    if (!staleScheduleItems.length) {
      return null;
    }

    const schedulesByDate = new Map();
    staleScheduleItems.forEach((item) => {
      const markedDateKey = dateKey(item.markedAt);
      const group = schedulesByDate.get(markedDateKey) || [];
      group.push(item);
      schedulesByDate.set(markedDateKey, group);
    });

    schedulesByDate.forEach((items, markedDateKey) => {
      this.snapshotMarkedScheduleHistory(userId, entryModel, items, new Date(`${markedDateKey}T00:00:00`));
    });

    const staleIndexes = new Set(staleScheduleItems.map(({ scheduleIndex }) => scheduleIndex));
    const hasNonStaleSchedule = entryModel.dailySched.some((_, scheduleIndex) => !staleIndexes.has(scheduleIndex));

    entryModel.dailySched = entryModel.dailySched.flatMap((scheduleEntry, scheduleIndex) => {
      if (!staleIndexes.has(scheduleIndex)) {
        return [scheduleEntry];
      }

      if (isIntervalScheduleEntry(scheduleEntry) && hasNonStaleSchedule) {
        return [];
      }

      return [{
        ...scheduleEntry,
        status: 'pending',
        takenAt: null,
        skippedAt: null,
      }];
    });

    entryModel.totalDailyAmount = sumScheduleDoseSizes(entryModel.dailySched);
    entryModel.amount = entryModel.totalDailyAmount;
    entryModel.syncTakenStatusFromSchedule?.();
    this.persistMedEntry(userId, entryModel, existingCreatedAt);
    return entryModel;
  }

  persistResetIfNeeded(userId, entry, now = new Date()) {
    const archivedModel = this.archiveStaleMarkedSchedules(userId, toMedEntryModel(entry), entry.createdAt, now);
    const entryModel = archivedModel || toMedEntryModel(entry);

    const model = entryModel;
    const didReset = model.resetDailyScheduleStatusesIfNeeded(now);
    if (didReset) {
      this.persistMedEntry(userId, model, entry.createdAt);
    }

    return didReset ? model : toMedEntryModel(entry);
  }

  listMedTrackerDailyHistory(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      this.listMedEntries(normalizedUserId);
      this.deleteSoftDeletedRecords(normalizedUserId);
      return Array.from(this.realm.objects('MedTrackerDailyHistory').filtered('patientUserId == $0 AND isDeleted == false', normalizedUserId))
        .map(toHistoryModel)
        .sort((firstEntry, secondEntry) => {
          const dateCompare = String(secondEntry.historyDate || '').localeCompare(String(firstEntry.historyDate || ''));
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return String(secondEntry.medName || '').localeCompare(String(firstEntry.medName || ''));
        });
    });
  }

  deleteMedTrackerDailyHistory(userId, historyId) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryId = String(historyId || '').trim();
    if (!normalizedHistoryId) {
      throw new RangeError('historyId cannot be empty.');
    }

    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', normalizedHistoryId);
      if (!entry || entry.patientUserId !== normalizedUserId) {
        throw new Error(`Med tracker history not found: ${historyId}`);
      }

      const now = new Date();
      entry.isDeleted = true;
      entry.deletedAt = now;
      entry.syncStatus = SYNC_STATUS.PENDING;
      entry.syncOperation = entry.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.DELETE;
      entry.syncError = '';
      entry.localUpdatedAt = now;
      entry.syncVersion = Number(entry.syncVersion || 0) + 1;
      return true;
    });
  }

  deleteMedTrackerDailyHistoryRecords(userId, historyIds = []) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryIds = Array.from(new Set(historyIds.map((historyId) => String(historyId || '').trim()).filter(Boolean)));
    if (!normalizedHistoryIds.length) {
      return 0;
    }

    return this.write(() => {
      let deletedCount = 0;
      normalizedHistoryIds.forEach((historyId) => {
        const entry = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', historyId);
        if (entry && entry.patientUserId === normalizedUserId) {
          const now = new Date();
          entry.isDeleted = true;
          entry.deletedAt = now;
          entry.syncStatus = SYNC_STATUS.PENDING;
          entry.syncOperation = entry.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.DELETE;
          entry.syncError = '';
          entry.localUpdatedAt = now;
          entry.syncVersion = Number(entry.syncVersion || 0) + 1;
          deletedCount += 1;
        }
      });

      return deletedCount;
    });
  }

  deleteSoftDeletedRecords(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const deletedEntries = this.realm.objects('MedEntry').filtered('patientUserId == $0 AND isDeleted == true', normalizedUserId)
      .filter((entry) => entry.syncStatus === SYNC_STATUS.SYNCED && !entry.syncOperation);
    const deletedHistory = this.realm.objects('MedTrackerDailyHistory').filtered('patientUserId == $0 AND isDeleted == true', normalizedUserId)
      .filter((entry) => entry.syncStatus === SYNC_STATUS.SYNCED && !entry.syncOperation);
    const deletedCount = deletedEntries.length + deletedHistory.length;

    if (deletedEntries.length) {
      this.realm.delete(deletedEntries);
    }

    if (deletedHistory.length) {
      this.realm.delete(deletedHistory);
    }

    return deletedCount;
  }

  listMedEntries(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      this.deleteSoftDeletedRecords(normalizedUserId);
      const now = new Date();
      return Array.from(this.realm.objects('MedEntry').filtered('patientUserId == $0 AND isDeleted == false', normalizedUserId))
        .map((entry) => this.persistResetIfNeeded(normalizedUserId, entry, now));
    });
  }

  createMedEntry(userId, medData) {
    const normalizedUserId = normalizeUserId(userId);
    const medEntry = new MedEntry({
      ...medData,
      medEntryId: medData.medEntryId || `${normalizedUserId}-med-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    });

    this.persistMedEntry(normalizedUserId, medEntry);
    return medEntry;
  }

  addMedEntry(userId, medData) {
    return this.write(() => {
      this.ensurePatientUser(userId);
      return this.createMedEntry(userId, medData);
    });
  }

  getActiveEntry(userId, medEntryId) {
    const entry = this.realm.objectForPrimaryKey('MedEntry', normalizeMedEntryId(medEntryId));
    if (!entry || entry.patientUserId !== normalizeUserId(userId) || entry.isDeleted) {
      throw new Error(`Medication entry not found: ${medEntryId}`);
    }

    return entry;
  }

  updateMedEntry(userId, medEntryId, medData) {
    return this.write(() => {
      const existingEntry = this.getActiveEntry(userId, medEntryId);
      const currentModel = this.persistResetIfNeeded(userId, existingEntry);
      const updates = medData && typeof medData === 'object' ? medData : {};

      if (updates.medName !== undefined) currentModel.updateMedName(updates.medName);
      if (updates.unitStrength !== undefined) currentModel.updateUnitStrength(updates.unitStrength);
      if (updates.unit !== undefined) currentModel.updateUnit(updates.unit);
      const nextTotalDailyAmount = updates.totalDailyAmount ?? updates.amount;
      if (updates.dailySched !== undefined && nextTotalDailyAmount !== undefined) {
        currentModel.updateTotalDailyAmountAndDailySched(nextTotalDailyAmount, updates.dailySched);
      } else {
        if (updates.totalDailyAmount !== undefined) currentModel.updateTotalDailyAmount(updates.totalDailyAmount);
        if (updates.dailySched !== undefined) currentModel.updateDailySched(updates.dailySched);
      }
      if (updates.startDate !== undefined) currentModel.updateStartDate(updates.startDate);
      if (updates.endDate !== undefined) currentModel.updateEndDate(updates.endDate);
      if (updates.instructions !== undefined) currentModel.updateInstructions(updates.instructions);
      if (updates.prescriberContact !== undefined) currentModel.updatePrescriberContact(updates.prescriberContact);
      if (updates.totalPrescribedDoses !== undefined) {
        currentModel.totalPrescribedDoses = updates.totalPrescribedDoses === null || updates.totalPrescribedDoses === undefined || updates.totalPrescribedDoses === ''
          ? null
          : Number(updates.totalPrescribedDoses);
      }

      this.persistMedEntry(userId, currentModel, existingEntry.createdAt);
      return currentModel;
    });
  }

  deleteMedEntry(userId, medEntryId) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, medEntryId);
      const now = new Date();
      entry.isDeleted = true;
      entry.deletedAt = now;
      entry.syncStatus = SYNC_STATUS.PENDING;
      entry.syncOperation = entry.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.DELETE;
      entry.syncError = '';
      entry.localUpdatedAt = now;
      entry.syncVersion = Number(entry.syncVersion || 0) + 1;
      entry.updatedAt = now;
      return true;
    });
  }

  listPendingMedSyncChanges(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return Array.from(this.realm.objects('MedEntry').filtered('patientUserId == $0', normalizedUserId))
      .filter((entry) => entry.syncStatus === SYNC_STATUS.PENDING || entry.syncStatus === SYNC_STATUS.ERROR)
      .map(toPlainMedEntry)
      .sort((firstEntry, secondEntry) =>
        String(firstEntry.localUpdatedAt || firstEntry.updatedAt || '').localeCompare(String(secondEntry.localUpdatedAt || secondEntry.updatedAt || ''))
      );
  }

  markMedEntrySynced(userId, medEntryId, remoteUpdatedAt = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedMedEntryId = normalizeMedEntryId(medEntryId);

    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedEntry', normalizedMedEntryId);
      if (!entry || entry.patientUserId !== normalizedUserId) {
        return false;
      }

      const syncedAt = new Date();
      entry.syncStatus = SYNC_STATUS.SYNCED;
      entry.syncOperation = '';
      entry.syncError = '';
      entry.lastSyncedAt = syncedAt;
      entry.remoteUpdatedAt = toNullableDate(remoteUpdatedAt) || syncedAt;
      return true;
    });
  }

  markMedEntrySyncError(userId, medEntryId, error) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedMedEntryId = normalizeMedEntryId(medEntryId);

    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedEntry', normalizedMedEntryId);
      if (!entry || entry.patientUserId !== normalizedUserId) {
        return false;
      }

      entry.syncStatus = SYNC_STATUS.ERROR;
      entry.syncError = error instanceof Error ? error.message : String(error || 'Sync failed.');
      return true;
    });
  }

  hardDeleteMedEntry(userId, medEntryId) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedMedEntryId = normalizeMedEntryId(medEntryId);

    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedEntry', normalizedMedEntryId);
      if (!entry || entry.patientUserId !== normalizedUserId) {
        return false;
      }

      this.realm.delete(entry);
      return true;
    });
  }

  upsertRemoteMedEntry(userId, remoteData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const medEntryId = normalizeMedEntryId(remoteData.medEntryId || remoteData.id);
    const remoteUpdatedAt = toNullableDate(remoteData.remoteUpdatedAt || remoteData.updatedAt || remoteData.lastSyncedAt) || new Date();

    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      const existingEntry = this.realm.objectForPrimaryKey('MedEntry', medEntryId);
      const localUpdatedAt = toNullableDate(existingEntry?.localUpdatedAt || existingEntry?.updatedAt);
      const hasUnpushedLocalChange =
        existingEntry &&
        (existingEntry.syncStatus === SYNC_STATUS.PENDING || existingEntry.syncStatus === SYNC_STATUS.ERROR) &&
        localUpdatedAt &&
        localUpdatedAt.getTime() >= remoteUpdatedAt.getTime();

      if (hasUnpushedLocalChange) {
        return toPlainMedEntry(existingEntry);
      }

      const medEntry = new MedEntry({
        medEntryId,
        medName: remoteData.medName,
        unitStrength: remoteData.unitStrength || '',
        unit: remoteData.unit,
        totalDailyAmount: Number(remoteData.totalDailyAmount || 0),
        dailySched: Array.isArray(remoteData.dailySched) ? remoteData.dailySched : [],
        startDate: toNullableDate(remoteData.startDate) || new Date(),
        endDate: toNullableDate(remoteData.endDate),
        instructions: remoteData.instructions || '',
        prescriberContact: remoteData.prescriberContact || '',
        createdAt: toNullableDate(remoteData.createdAt),
        updatedAt: toNullableDate(remoteData.updatedAt),
        totalPrescribedDoses: remoteData.totalPrescribedDoses ?? null,
      });

      const savedEntry = this.persistMedEntry(normalizedUserId, medEntry, toNullableDate(remoteData.createdAt), {
        markPending: false,
        isDeleted: Boolean(remoteData.isDeleted),
        deletedAt: toNullableDate(remoteData.deletedAt),
        syncStatus: SYNC_STATUS.SYNCED,
        syncOperation: '',
        syncError: '',
        lastSyncedAt: new Date(),
        localUpdatedAt: remoteUpdatedAt,
        remoteUpdatedAt,
        syncVersion: Number(remoteData.syncVersion || existingEntry?.syncVersion || 0),
        syncDeviceId: remoteData.syncDeviceId || existingEntry?.syncDeviceId || '',
      });

      return toPlainMedEntry(savedEntry);
    });
  }

  listPendingMedHistorySyncChanges(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return Array.from(this.realm.objects('MedTrackerDailyHistory').filtered('patientUserId == $0', normalizedUserId))
      .filter((entry) => entry.syncStatus === SYNC_STATUS.PENDING || entry.syncStatus === SYNC_STATUS.ERROR)
      .map(toPlainMedHistory);
  }

  markMedHistorySynced(userId, historyId, remoteUpdatedAt = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryId = String(historyId || '').trim();
    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', normalizedHistoryId);
      if (!entry || entry.patientUserId !== normalizedUserId) return false;

      const syncedAt = new Date();
      entry.syncStatus = SYNC_STATUS.SYNCED;
      entry.syncOperation = '';
      entry.syncError = '';
      entry.lastSyncedAt = syncedAt;
      entry.remoteUpdatedAt = toNullableDate(remoteUpdatedAt) || syncedAt;
      return true;
    });
  }

  markMedHistorySyncError(userId, historyId, error) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryId = String(historyId || '').trim();
    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', normalizedHistoryId);
      if (!entry || entry.patientUserId !== normalizedUserId) return false;

      entry.syncStatus = SYNC_STATUS.ERROR;
      entry.syncError = error instanceof Error ? error.message : String(error || 'Sync failed.');
      return true;
    });
  }

  hardDeleteMedHistory(userId, historyId) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryId = String(historyId || '').trim();
    return this.write(() => {
      const entry = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', normalizedHistoryId);
      if (!entry || entry.patientUserId !== normalizedUserId) return false;

      this.realm.delete(entry);
      return true;
    });
  }

  upsertRemoteMedHistory(userId, remoteData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const historyId = String(remoteData.historyId || remoteData.id || '').trim();
    if (!historyId) {
      throw new RangeError('historyId cannot be empty.');
    }

    return this.write(() => {
      const existingHistory = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', historyId);
      const remoteUpdatedAt = toNullableDate(remoteData.remoteUpdatedAt || remoteData.createdAt || remoteData.lastSyncedAt) || new Date();
      const localUpdatedAt = toNullableDate(existingHistory?.localUpdatedAt || existingHistory?.createdAt);
      if (
        existingHistory &&
        (existingHistory.syncStatus === SYNC_STATUS.PENDING || existingHistory.syncStatus === SYNC_STATUS.ERROR) &&
        localUpdatedAt &&
        localUpdatedAt.getTime() >= remoteUpdatedAt.getTime()
      ) {
        return toPlainMedHistory(existingHistory);
      }

      const savedHistory = this.realm.create('MedTrackerDailyHistory', {
        historyId,
        patientUserId: normalizedUserId,
        medEntryId: remoteData.medEntryId || '',
        historyDate: remoteData.historyDate || '',
        medName: remoteData.medName || '',
        unitStrength: remoteData.unitStrength || '',
        unit: remoteData.unit || '',
        totalDailyAmount: Number(remoteData.totalDailyAmount || 0),
        startDate: toNullableDate(remoteData.startDate) || new Date(),
        endDate: toNullableDate(remoteData.endDate),
        instructions: remoteData.instructions || '',
        prescriberContact: remoteData.prescriberContact || '',
        dailySchedFinalStatuses: Array.isArray(remoteData.dailySchedFinalStatuses)
          ? remoteData.dailySchedFinalStatuses.map((scheduleEntry, index) => ({
              scheduleIndex: Number(scheduleEntry.scheduleIndex ?? index),
              doseSize: Number(scheduleEntry.doseSize || 0),
              scheduledTime: scheduleEntry.scheduledTime ?? null,
              intervalMinutes: scheduleEntry.intervalMinutes ? Number(scheduleEntry.intervalMinutes) : null,
              intervalUnit: scheduleEntry.intervalUnit ?? '',
              intervalCount: scheduleEntry.intervalCount ? Number(scheduleEntry.intervalCount) : null,
              dayOfWeek: scheduleEntry.dayOfWeek ?? '',
              monthOfYear: scheduleEntry.monthOfYear ?? '',
              dayOfMonth: scheduleEntry.dayOfMonth ? Number(scheduleEntry.dayOfMonth) : null,
              instructions: scheduleEntry.instructions ?? '',
              finalStatus: scheduleEntry.finalStatus || 'missed',
              takenAt: toNullableDate(scheduleEntry.takenAt),
              skippedAt: toNullableDate(scheduleEntry.skippedAt),
              activatedAt: toNullableDate(scheduleEntry.activatedAt),
              resolvedAt: toNullableDate(scheduleEntry.resolvedAt),
            }))
          : [],
        completedAllSchedules: Boolean(remoteData.completedAllSchedules),
        isDeleted: Boolean(remoteData.isDeleted),
        deletedAt: toNullableDate(remoteData.deletedAt),
        syncStatus: SYNC_STATUS.SYNCED,
        syncOperation: '',
        syncError: '',
        lastSyncedAt: new Date(),
        localUpdatedAt: remoteUpdatedAt,
        remoteUpdatedAt,
        syncVersion: Number(remoteData.syncVersion || existingHistory?.syncVersion || 0),
        syncDeviceId: remoteData.syncDeviceId || existingHistory?.syncDeviceId || '',
        createdAt: toNullableDate(remoteData.createdAt) || existingHistory?.createdAt || new Date(),
      }, 'modified');

      return toPlainMedHistory(savedHistory);
    });
  }

  markMedScheduleTaken(userId, medEntryId, scheduleIndex, takenAt = new Date()) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, medEntryId);
      const model = this.persistResetIfNeeded(userId, entry);
      model.markScheduleTaken(scheduleIndex, takenAt);
      this.persistMedEntry(userId, model, entry.createdAt);
      return model;
    });
  }

  markMedScheduleSkipped(userId, medEntryId, scheduleIndex, skippedAt = new Date()) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, medEntryId);
      const model = this.persistResetIfNeeded(userId, entry);
      model.markScheduleSkipped(scheduleIndex, skippedAt);
      this.persistMedEntry(userId, model, entry.createdAt);
      return model;
    });
  }

  clearMedScheduleStatus(userId, medEntryId, scheduleIndex) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, medEntryId);
      const model = this.persistResetIfNeeded(userId, entry);
      model.clearScheduleStatus(scheduleIndex);
      this.persistMedEntry(userId, model, entry.createdAt);
      return model;
    });
  }
}
