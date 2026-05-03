import MedEntry from '../../domain/models/MedEntryModel';

const DEFAULT_PATIENT_EMAIL = 'current-user@local.invalid';

const demoEntries = [
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
    inventoryCount: 30,
    prescriberContact: 'Dr. Santos',
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
    inventoryCount: 20,
    prescriberContact: 'Dr. Reyes',
  },
];

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

  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
};

const toNullableDate = (value) => {
  const date = toDate(value);
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const dateKey = (date) => {
  const normalizedDate = toNullableDate(date) ?? new Date();
  return normalizedDate.toISOString().slice(0, 10);
};

const toRealmScheduleEntry = (entry, index) => ({
  scheduleIndex: index,
  scheduleType: entry.scheduleType,
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime ?? null,
  mealContext: entry.mealContext ?? null,
  associatedMeal: entry.associatedMeal ?? null,
  mealTime: entry.mealTime ?? null,
  instructions: entry.instructions ?? '',
  status: entry.status ?? 'pending',
  takenAt: toNullableDate(entry.takenAt),
  skippedAt: toNullableDate(entry.skippedAt),
});

const toModelScheduleEntry = (entry) => ({
  scheduleType: entry.scheduleType,
  doseSize: entry.doseSize,
  scheduledTime: entry.scheduledTime || undefined,
  mealContext: entry.mealContext || undefined,
  associatedMeal: entry.associatedMeal || undefined,
  mealTime: entry.mealTime || undefined,
  instructions: entry.instructions || '',
  status: entry.status || 'pending',
  takenAt: entry.takenAt || null,
  skippedAt: entry.skippedAt || null,
});

const toMedEntryModel = (entry) =>
  new MedEntry({
    medEntryId: entry.medEntryId,
    medName: entry.medName,
    unitStrength: entry.unitStrength,
    unit: entry.unit,
    totalDailyAmount: entry.totalDailyAmount,
    dailySched: Array.from(entry.dailySched || []).map(toModelScheduleEntry),
    startDate: entry.startDate,
    endDate: entry.endDate,
    instructions: entry.instructions || '',
    inventoryCount: entry.inventoryCount ?? null,
    prescriberContact: entry.prescriberContact || '',
  });

const toHistoryScheduleEntry = (entry) => ({
  scheduleIndex: Number(entry.scheduleIndex ?? 0),
  scheduleType: entry.scheduleType,
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime ?? null,
  mealContext: entry.mealContext ?? null,
  associatedMeal: entry.associatedMeal ?? null,
  mealTime: entry.mealTime ?? null,
  instructions: entry.instructions ?? '',
  finalStatus: entry.status === 'taken' ? 'taken' : 'missed',
  takenAt: toNullableDate(entry.takenAt),
  skippedAt: toNullableDate(entry.skippedAt),
  resolvedAt: toNullableDate(entry.takenAt || entry.skippedAt) ?? new Date(),
});

const hasPreviousDayStatus = (entry, currentDayKey) =>
  Array.from(entry.dailySched || []).some((scheduleEntry) => {
    const statusDate = scheduleEntry.takenAt || scheduleEntry.skippedAt;
    return statusDate && dateKey(statusDate) < currentDayKey;
  });

const hasSameDayStatus = (entry, currentDayKey) =>
  Array.from(entry.dailySched || []).some((scheduleEntry) => {
    const statusDate = scheduleEntry.takenAt || scheduleEntry.skippedAt;
    return statusDate && dateKey(statusDate) === currentDayKey;
  });

const toMinutes = (timeValue) => {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const scheduleEffectiveTime = (entry) => entry.scheduledTime || entry.mealTime || '';

const shouldRunDailyRollover = (entry, now) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstScheduleMinutes = Array.from(entry.dailySched || [])
    .map((scheduleEntry) => toMinutes(scheduleEffectiveTime(scheduleEntry)))
    .filter((minutes) => minutes !== null)
    .sort((firstMinute, secondMinute) => firstMinute - secondMinute)[0];

  if (firstScheduleMinutes === undefined) {
    return false;
  }

  const resetStartMinutes =
    Array.from(entry.dailySched || []).length === 1
      ? Math.max(0, firstScheduleMinutes - 60)
      : firstScheduleMinutes;

  return currentMinutes >= resetStartMinutes;
};

const previousDay = (now) => {
  const date = new Date(now.getTime());
  date.setDate(date.getDate() - 1);
  return date;
};

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

  seedDemoEntriesIfNeeded(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const hasEntries = this.realm.objects('MedEntry').filtered('patientUserId == $0', normalizedUserId).length > 0;
    if (hasEntries) {
      return;
    }

    demoEntries.forEach((entry, index) => {
      this.createMedEntry(normalizedUserId, {
        ...entry,
        medEntryId: `${normalizedUserId}-med-${index + 1}`,
      });
    });
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
  }

  persistMedEntry(userId, medEntry, existingCreatedAt = null) {
    const normalizedUserId = normalizeUserId(userId);
    const now = new Date();
    return this.realm.create(
      'MedEntry',
      {
        medEntryId: medEntry.medEntryId,
        patientUserId: normalizedUserId,
        medName: medEntry.medName,
        unitStrength: medEntry.unitStrength,
        unit: medEntry.unit,
        totalDailyAmount: medEntry.totalDailyAmount,
        dailySched: medEntry.dailySched.map(toRealmScheduleEntry),
        startDate: medEntry.startDate,
        endDate: medEntry.endDate,
        instructions: medEntry.instructions || '',
        inventoryCount: medEntry.inventoryCount,
        prescriberContact: medEntry.prescriberContact || '',
        isDeleted: false,
        createdAt: existingCreatedAt || now,
        updatedAt: now,
      },
      'modified',
    );
  }

  snapshotDailyHistory(userId, entry, historyDate = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const historyDateKey = dateKey(historyDate);
    const historyId = `${normalizedUserId}-${entry.medEntryId}-${historyDateKey}`;

    this.realm.create(
      'MedTrackerDailyHistory',
      {
        historyId,
        patientUserId: normalizedUserId,
        medEntryId: entry.medEntryId,
        historyDate: historyDateKey,
        medName: entry.medName,
        unitStrength: entry.unitStrength,
        unit: entry.unit,
        totalDailyAmount: entry.totalDailyAmount,
        startDate: entry.startDate,
        endDate: entry.endDate,
        instructions: entry.instructions || '',
        inventoryCount: entry.inventoryCount,
        prescriberContact: entry.prescriberContact || '',
        dailySchedFinalStatuses: Array.from(entry.dailySched || []).map(toHistoryScheduleEntry),
        completedAllSchedules: Array.from(entry.dailySched || []).every((scheduleEntry) => scheduleEntry.status === 'taken'),
        createdAt: new Date(),
      },
      'modified',
    );
  }

  persistResetIfNeeded(userId, entry, now = new Date()) {
    const currentDayKey = dateKey(now);
    const yesterday = previousDay(now);
    const yesterdayKey = dateKey(yesterday);
    const existingHistory = this.realm.objectForPrimaryKey('MedTrackerDailyHistory', `${normalizeUserId(userId)}-${entry.medEntryId}-${yesterdayKey}`);
    const entryModel = toMedEntryModel(entry);
    const shouldSnapshotYesterday =
      !existingHistory &&
      entryModel.isActiveOnDate(yesterday) &&
      shouldRunDailyRollover(entry, now) &&
      (hasPreviousDayStatus(entry, currentDayKey) || !hasSameDayStatus(entry, currentDayKey));

    if (shouldSnapshotYesterday) {
      this.snapshotDailyHistory(userId, entry, yesterday);
    }

    const model = entryModel;
    const didReset = model.resetDailyScheduleStatusesIfNeeded(now);
    if (didReset) {
      this.persistMedEntry(userId, model, entry.createdAt);
    }

    return didReset ? model : toMedEntryModel(entry);
  }

  listMedTrackerDailyHistory(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return Array.from(this.realm.objects('MedTrackerDailyHistory').filtered('patientUserId == $0', normalizedUserId));
  }

  listMedEntries(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      this.seedDemoEntriesIfNeeded(normalizedUserId);
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
      if (updates.inventoryCount !== undefined) currentModel.updateInventoryCount(updates.inventoryCount);
      if (updates.prescriberContact !== undefined) currentModel.updatePrescriberContact(updates.prescriberContact);

      this.persistMedEntry(userId, currentModel, existingEntry.createdAt);
      return currentModel;
    });
  }

  softDeleteMedEntry(userId, medEntryId) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, medEntryId);
      entry.isDeleted = true;
      entry.updatedAt = new Date();
      return true;
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
