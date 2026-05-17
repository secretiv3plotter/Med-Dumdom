import ApptEntry from '../../domain/models/ApptEntryModel';

const DEFAULT_PATIENT_EMAIL = 'current-user@local.invalid';

const normalizeUserId = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new RangeError('userId cannot be empty.');
  }

  return normalizedUserId;
};

const normalizeApptEntryId = (apptEntryId) => {
  const normalizedApptEntryId = String(apptEntryId || '').trim();
  if (!normalizedApptEntryId) {
    throw new RangeError('apptEntryId cannot be empty.');
  }

  return normalizedApptEntryId;
};

const toNullableDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoOrNull = (value) => {
  const date = toNullableDate(value);
  return date ? date.toISOString() : null;
};

const scheduledDateTime = (entry) => {
  const date = new Date(`${entry.dateSched}T${entry.timeSched}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const statusResolvedAt = (entry) => {
  if (entry.isCompleted) {
    return toNullableDate(entry.completedAt);
  }

  if (entry.isSkipped) {
    return toNullableDate(entry.skippedAt);
  }

  return null;
};

const getHistoryStatus = (entry, now = new Date()) => {
  const model = entry instanceof ApptEntry ? entry : toApptEntryModel(entry);
  if (model.isCompleted) return 'completed';
  if (model.isSkipped) return 'skipped';
  if (model.isMissed(now, now)) return 'missed';
  return 'deleted';
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

const toApptEntryModel = (entry) =>
  new ApptEntry({
    apptEntryId: entry.apptEntryId,
    concern: entry.concern,
    address: entry.address,
    doctorName: entry.doctorName || '',
    contactNumber: entry.contactNumber || '',
    timeSched: entry.timeSched,
    dateSched: entry.dateSched,
    note: entry.note || '',
    isCompleted: Boolean(entry.isCompleted),
    isSkipped: Boolean(entry.isSkipped),
    completedAt: entry.completedAt || null,
    skippedAt: entry.skippedAt || null,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
  });

const toHistoryModel = (entry) => ({
  historyId: entry.historyId,
  patientUserId: entry.patientUserId,
  apptEntryId: entry.apptEntryId,
  concern: entry.concern,
  address: entry.address,
  doctorName: entry.doctorName || '',
  contactNumber: entry.contactNumber || '',
  dateSched: entry.dateSched,
  timeSched: entry.timeSched,
  note: entry.note || '',
  finalStatus: entry.finalStatus,
  completedAt: entry.completedAt || null,
  skippedAt: entry.skippedAt || null,
  missedAt: entry.missedAt || null,
  deletedAt: entry.deletedAt || null,
  isDeleted: Boolean(entry.isDeleted),
  recordDeletedAt: entry.recordDeletedAt || null,
  createdAt: entry.createdAt,
});

export default class RealmApptTrackerRepository {
  constructor(realm) {
    this.realm = realm;
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
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

  persistApptEntry(userId, apptEntry, existingCreatedAt = null, existingDeleted = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const now = new Date();
    return this.realm.create(
      'ApptEntry',
      {
        apptEntryId: apptEntry.apptEntryId,
        patientUserId: normalizedUserId,
        concern: apptEntry.concern,
        address: apptEntry.address,
        doctorName: apptEntry.doctorName || '',
        contactNumber: apptEntry.contactNumber || '',
        dateSched: apptEntry.dateSched,
        timeSched: apptEntry.timeSched,
        note: apptEntry.note || '',
        isCompleted: Boolean(apptEntry.isCompleted),
        isSkipped: Boolean(apptEntry.isSkipped),
        completedAt: toNullableDate(apptEntry.completedAt),
        skippedAt: toNullableDate(apptEntry.skippedAt),
        isDeleted: Boolean(existingDeleted.isDeleted),
        deletedAt: toNullableDate(existingDeleted.deletedAt),
        createdAt: existingCreatedAt || now,
        updatedAt: now,
      },
      'modified',
    );
  }

  snapshotHistory(userId, entry, finalStatus = null, resolvedAt = new Date()) {
    return this.write(() => {
      const normalizedUserId = normalizeUserId(userId);
      const model = entry instanceof ApptEntry ? entry : toApptEntryModel(entry);
      const status = finalStatus || getHistoryStatus(model, resolvedAt);
      const resolvedDate = toNullableDate(resolvedAt) || new Date();
      const historyId = `${normalizedUserId}-${model.apptEntryId}-${status}`;

      this.realm.create(
        'ApptTrackerHistory',
        {
          historyId,
          patientUserId: normalizedUserId,
          apptEntryId: model.apptEntryId,
          concern: model.concern,
          address: model.address,
          doctorName: model.doctorName || '',
          contactNumber: model.contactNumber || '',
          dateSched: model.dateSched,
          timeSched: model.timeSched,
          note: model.note || '',
          finalStatus: status,
          completedAt: status === 'completed' ? toNullableDate(model.completedAt || resolvedDate) : null,
          skippedAt: status === 'skipped' ? toNullableDate(model.skippedAt || resolvedDate) : null,
          missedAt: status === 'missed' ? scheduledDateTime(model) || resolvedDate : null,
          deletedAt: status === 'deleted' ? resolvedDate : null,
          isDeleted: false,
          recordDeletedAt: null,
          createdAt: new Date(),
        },
        'modified',
      );
    });
  }

  snapshotFinalizedEntriesIfNeeded(userId, now = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    const currentDateTime = toNullableDate(now) || new Date();
    Array.from(this.realm.objects('ApptEntry').filtered('patientUserId == $0 AND isDeleted == false', normalizedUserId))
      .forEach((entry) => {
        const model = toApptEntryModel(entry);
        let finalStatus = 'missed';
        let snapshotTime = scheduledDateTime(model) || currentDateTime;

        if (model.isCompleted) {
          const resolvedAt = statusResolvedAt(model);
          const finalizeAt = nextMidnightAfterSchedule(model);
          if (!resolvedAt || !finalizeAt || currentDateTime < finalizeAt) {
            return;
          }

          finalStatus = 'completed';
          snapshotTime = resolvedAt;
        } else if (model.isSkipped) {
          const resolvedAt = statusResolvedAt(model);
          const finalizeAt = nextMidnightAfterSchedule(model);
          if (!resolvedAt || !finalizeAt || currentDateTime < finalizeAt) {
            return;
          }

          finalStatus = 'skipped';
          snapshotTime = resolvedAt;
        } else if (!model.isMissed(currentDateTime, currentDateTime)) {
          return;
        }

        const historyId = `${normalizedUserId}-${model.apptEntryId}-${finalStatus}`;
        if (!this.realm.objectForPrimaryKey('ApptTrackerHistory', historyId)) {
          this.snapshotHistory(normalizedUserId, model, finalStatus, snapshotTime);
        }

        this.realm.delete(entry);
      });
  }

  removeHistoryStatus(userId, apptEntryId, status) {
    const historyId = `${normalizeUserId(userId)}-${normalizeApptEntryId(apptEntryId)}-${status}`;
    const history = this.realm.objectForPrimaryKey('ApptTrackerHistory', historyId);
    if (history) {
      this.realm.delete(history);
    }
  }

  listApptEntries(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      this.deleteSoftDeletedRecords(normalizedUserId);
      this.snapshotFinalizedEntriesIfNeeded(normalizedUserId);
      return Array.from(this.realm.objects('ApptEntry').filtered('patientUserId == $0 AND isDeleted == false', normalizedUserId))
        .map(toApptEntryModel);
    });
  }

  createApptEntry(userId, apptData) {
    const normalizedUserId = normalizeUserId(userId);
    const apptEntry = new ApptEntry({
      ...apptData,
      apptEntryId: apptData.apptEntryId || `${normalizedUserId}-appt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    });

    this.persistApptEntry(normalizedUserId, apptEntry);
    return apptEntry;
  }

  addApptEntry(userId, apptData) {
    return this.write(() => {
      this.ensurePatientUser(userId);
      return this.createApptEntry(userId, apptData);
    });
  }

  getActiveEntry(userId, apptEntryId) {
    const entry = this.realm.objectForPrimaryKey('ApptEntry', normalizeApptEntryId(apptEntryId));
    if (!entry || entry.patientUserId !== normalizeUserId(userId) || entry.isDeleted) {
      throw new Error(`Appointment entry not found: ${apptEntryId}`);
    }

    return entry;
  }

  updateApptEntry(userId, apptEntryId, apptData) {
    return this.write(() => {
      const existingEntry = this.getActiveEntry(userId, apptEntryId);
      const model = toApptEntryModel(existingEntry);
      const updates = apptData && typeof apptData === 'object' ? apptData : {};

      if (updates.concern !== undefined) model.updateConcern(updates.concern);
      if (updates.address !== undefined) model.updateAddress(updates.address);
      if (updates.doctorName !== undefined) model.updateDoctorName(updates.doctorName);
      if (updates.contactNumber !== undefined) model.updateContactNumber(updates.contactNumber);
      if (updates.contactNum !== undefined) model.updateContactNumber(updates.contactNum);
      if (updates.timeSched !== undefined) model.updateTimeSched(updates.timeSched);
      if (updates.dateSched !== undefined) model.updateDateSched(updates.dateSched);
      if (updates.note !== undefined) model.updateNote(updates.note);

      this.persistApptEntry(userId, model, existingEntry.createdAt, existingEntry);
      return model;
    });
  }

  deleteApptEntry(userId, apptEntryId) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, apptEntryId);
      this.realm.delete(entry);
      return true;
    });
  }

  cancelApptEntry(userId, apptEntryId) {
    return this.deleteApptEntry(userId, apptEntryId);
  }

  markApptCompleted(userId, apptEntryId, completedAt = new Date()) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, apptEntryId);
      const model = toApptEntryModel(entry).markCompleted(completedAt);
      this.persistApptEntry(userId, model, entry.createdAt, entry);
      this.removeHistoryStatus(userId, apptEntryId, 'missed');
      return model;
    });
  }

  undoApptCompleted(userId, apptEntryId) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, apptEntryId);
      const model = toApptEntryModel(entry).clearCompletedStatus();
      this.persistApptEntry(userId, model, entry.createdAt, entry);
      return model;
    });
  }

  markApptSkipped(userId, apptEntryId, skippedAt = new Date()) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, apptEntryId);
      const model = toApptEntryModel(entry).markSkipped(skippedAt);
      this.persistApptEntry(userId, model, entry.createdAt, entry);
      this.removeHistoryStatus(userId, apptEntryId, 'missed');
      return model;
    });
  }

  undoApptSkipped(userId, apptEntryId) {
    return this.write(() => {
      const entry = this.getActiveEntry(userId, apptEntryId);
      const model = toApptEntryModel(entry).clearSkippedStatus();
      this.persistApptEntry(userId, model, entry.createdAt, entry);
      return model;
    });
  }

  getDueApptEntries(userId, now = new Date()) {
    return this.listApptEntries(userId)
      .filter((entry) => entry.isDue(now, now))
      .filter((entry) => !entry.isMissed(now, now));
  }

  getMissedApptEntries(userId, now = new Date()) {
    return this.listApptEntries(userId).filter((entry) => entry.isMissed(now, now));
  }

  getApptTrackerSummary(userId, range = null) {
    const entries = this.listApptEntries(userId);
    const normalizedRange = {
      startDate: range?.startDate ?? range?.from ?? null,
      endDate: range?.endDate ?? range?.to ?? null,
      preset: typeof range?.preset === 'string' ? range.preset : '',
    };
    const startDate = toNullableDate(normalizedRange.startDate);
    const endDate = toNullableDate(normalizedRange.endDate);
    const filteredEntries = entries.filter((entry) => {
      const scheduleDate = scheduledDateTime(entry);
      if (!scheduleDate) {
        return false;
      }

      if (startDate && scheduleDate < startDate) {
        return false;
      }

      if (endDate && scheduleDate > endDate) {
        return false;
      }

      return true;
    });
    const now = new Date();

    return {
      userId: normalizeUserId(userId),
      range: { startDate, endDate, preset: normalizedRange.preset },
      totalEntries: filteredEntries.length,
      activeEntries: filteredEntries.filter((entry) => !entry.isCompleted && !entry.isSkipped).length,
      completedEntries: filteredEntries.filter((entry) => entry.isCompleted).length,
      skippedEntries: filteredEntries.filter((entry) => entry.isSkipped).length,
      dueEntries: filteredEntries.filter((entry) => entry.isDue(now, now) && !entry.isMissed(now, now)).length,
      missedEntries: filteredEntries.filter((entry) => entry.isMissed(now, now)).length,
      deletedEntries: 0,
      entries: filteredEntries,
    };
  }

  listPreviousApptRecords(userId, now = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      this.ensurePatientUser(normalizedUserId);
      this.deleteSoftDeletedRecords(normalizedUserId);
      this.snapshotFinalizedEntriesIfNeeded(normalizedUserId, now);
      return Array.from(this.realm.objects('ApptTrackerHistory').filtered('patientUserId == $0 AND isDeleted == false', normalizedUserId))
        .map(toHistoryModel)
        .sort((firstEntry, secondEntry) => {
          const dateCompare = String(secondEntry.dateSched || '').localeCompare(String(firstEntry.dateSched || ''));
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return String(secondEntry.timeSched || '').localeCompare(String(firstEntry.timeSched || ''));
        });
    });
  }

  deleteApptTrackerHistoryRecords(userId, historyIds = []) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedHistoryIds = Array.from(new Set(historyIds.map((historyId) => String(historyId || '').trim()).filter(Boolean)));
    if (!normalizedHistoryIds.length) {
      return 0;
    }

    return this.write(() => {
      let deletedCount = 0;
      normalizedHistoryIds.forEach((historyId) => {
        const entry = this.realm.objectForPrimaryKey('ApptTrackerHistory', historyId);
        if (entry && entry.patientUserId === normalizedUserId) {
          this.realm.delete(entry);
          deletedCount += 1;
        }
      });

      return deletedCount;
    });
  }

  deleteSoftDeletedRecords(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const deletedEntries = this.realm.objects('ApptEntry').filtered('patientUserId == $0 AND isDeleted == true', normalizedUserId);
    const deletedHistory = this.realm.objects('ApptTrackerHistory').filtered('patientUserId == $0 AND isDeleted == true', normalizedUserId);
    const deletedCount = deletedEntries.length + deletedHistory.length;

    if (deletedEntries.length) {
      this.realm.delete(deletedEntries);
    }

    if (deletedHistory.length) {
      this.realm.delete(deletedHistory);
    }

    return deletedCount;
  }
}
