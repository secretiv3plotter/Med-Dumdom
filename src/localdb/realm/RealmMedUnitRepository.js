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

const normalizeUnitId = (unitId) => {
  const normalizedUnitId = String(unitId || '').trim();
  if (!normalizedUnitId) {
    throw new RangeError('unitId cannot be empty.');
  }

  return normalizedUnitId;
};

const normalizeUnitName = (name) => String(name || '').trim().toLowerCase();

const toNullableDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoOrNull = (value) => {
  const date = toNullableDate(value);
  return date ? date.toISOString() : null;
};

const toPlainMedUnit = (unit) => ({
  unitId: unit.unitId,
  name: unit.name || '',
  isCustom: Boolean(unit.isCustom),
  isDeleted: Boolean(unit.isDeleted),
  deletedAt: toIsoOrNull(unit.deletedAt),
  syncStatus: unit.syncStatus || SYNC_STATUS.SYNCED,
  syncOperation: unit.syncOperation || '',
  syncError: unit.syncError || '',
  lastSyncedAt: toIsoOrNull(unit.lastSyncedAt),
  localUpdatedAt: toIsoOrNull(unit.localUpdatedAt),
  remoteUpdatedAt: toIsoOrNull(unit.remoteUpdatedAt),
  syncVersion: Number(unit.syncVersion || 0),
  syncDeviceId: unit.syncDeviceId || '',
  createdAt: toIsoOrNull(unit.createdAt),
  updatedAt: toIsoOrNull(unit.updatedAt),
});

export default class RealmMedUnitRepository {
  constructor(realm) {
    this.realm = realm;
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
  }

  listMedUnits() {
    return Array.from(this.realm.objects('MedUnit'))
      .filter((unit) => unit.unitId !== 'seeded-marker' && !unit.isDeleted)
      .map(toPlainMedUnit);
  }

  saveMedUnit(unitData = {}, syncOptions = {}) {
    const unitId = normalizeUnitId(unitData.unitId || `unit-${Date.now()}-${Math.floor(Math.random() * 100000)}`);
    const name = normalizeUnitName(unitData.name);
    if (!name) {
      throw new RangeError('name cannot be empty.');
    }

    return this.write(() => {
      const now = new Date();
      const existingUnit = this.realm.objectForPrimaryKey('MedUnit', unitId);
      const markPending = syncOptions.markPending !== false;
      const operation = syncOptions.operation ||
        (existingUnit?.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : existingUnit ? SYNC_OPERATION.UPDATE : SYNC_OPERATION.CREATE);
      const savedUnit = this.realm.create('MedUnit', {
        unitId,
        name,
        isCustom: Boolean(unitData.isCustom),
        isDeleted: Boolean(syncOptions.isDeleted ?? unitData.isDeleted ?? false),
        deletedAt: toNullableDate(syncOptions.deletedAt ?? unitData.deletedAt),
        syncStatus: syncOptions.syncStatus || (markPending ? SYNC_STATUS.PENDING : existingUnit?.syncStatus || SYNC_STATUS.SYNCED),
        syncOperation: syncOptions.syncOperation ?? (markPending ? operation : existingUnit?.syncOperation || ''),
        syncError: syncOptions.syncError ?? (markPending ? '' : existingUnit?.syncError || ''),
        lastSyncedAt: toNullableDate(syncOptions.lastSyncedAt ?? existingUnit?.lastSyncedAt),
        localUpdatedAt: toNullableDate(syncOptions.localUpdatedAt) || now,
        remoteUpdatedAt: toNullableDate(syncOptions.remoteUpdatedAt ?? existingUnit?.remoteUpdatedAt),
        syncVersion: Number(syncOptions.syncVersion ?? existingUnit?.syncVersion ?? 0) + (markPending ? 1 : 0),
        syncDeviceId: syncOptions.syncDeviceId ?? existingUnit?.syncDeviceId ?? '',
        createdAt: toNullableDate(unitData.createdAt) || existingUnit?.createdAt || now,
        updatedAt: toNullableDate(unitData.updatedAt) || now,
      }, 'modified');

      return toPlainMedUnit(savedUnit);
    });
  }

  deleteMedUnit(unitId) {
    const normalizedUnitId = normalizeUnitId(unitId);
    return this.write(() => {
      const unit = this.realm.objectForPrimaryKey('MedUnit', normalizedUnitId);
      if (!unit) return false;

      const now = new Date();
      unit.isDeleted = true;
      unit.deletedAt = now;
      unit.syncStatus = SYNC_STATUS.PENDING;
      unit.syncOperation = unit.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.DELETE;
      unit.syncError = '';
      unit.localUpdatedAt = now;
      unit.updatedAt = now;
      unit.syncVersion = Number(unit.syncVersion || 0) + 1;
      return true;
    });
  }

  listPendingMedUnitSyncChanges() {
    return Array.from(this.realm.objects('MedUnit'))
      .filter((unit) => unit.unitId !== 'seeded-marker')
      .filter((unit) => unit.syncStatus === SYNC_STATUS.PENDING || unit.syncStatus === SYNC_STATUS.ERROR)
      .map(toPlainMedUnit);
  }

  markMedUnitSynced(unitId, remoteUpdatedAt = new Date()) {
    const normalizedUnitId = normalizeUnitId(unitId);
    return this.write(() => {
      const unit = this.realm.objectForPrimaryKey('MedUnit', normalizedUnitId);
      if (!unit) return false;

      const syncedAt = new Date();
      unit.syncStatus = SYNC_STATUS.SYNCED;
      unit.syncOperation = '';
      unit.syncError = '';
      unit.lastSyncedAt = syncedAt;
      unit.remoteUpdatedAt = toNullableDate(remoteUpdatedAt) || syncedAt;
      return true;
    });
  }

  markMedUnitSyncError(unitId, error) {
    const normalizedUnitId = normalizeUnitId(unitId);
    return this.write(() => {
      const unit = this.realm.objectForPrimaryKey('MedUnit', normalizedUnitId);
      if (!unit) return false;

      unit.syncStatus = SYNC_STATUS.ERROR;
      unit.syncError = error instanceof Error ? error.message : String(error || 'Sync failed.');
      return true;
    });
  }

  hardDeleteMedUnit(unitId) {
    const normalizedUnitId = normalizeUnitId(unitId);
    return this.write(() => {
      const unit = this.realm.objectForPrimaryKey('MedUnit', normalizedUnitId);
      if (!unit) return false;

      this.realm.delete(unit);
      return true;
    });
  }

  upsertRemoteMedUnit(remoteData = {}) {
    return this.saveMedUnit(remoteData, {
      markPending: false,
      isDeleted: Boolean(remoteData.isDeleted),
      deletedAt: toNullableDate(remoteData.deletedAt),
      syncStatus: SYNC_STATUS.SYNCED,
      syncOperation: '',
      syncError: '',
      lastSyncedAt: new Date(),
      localUpdatedAt: toNullableDate(remoteData.remoteUpdatedAt || remoteData.updatedAt || remoteData.lastSyncedAt) || new Date(),
      remoteUpdatedAt: toNullableDate(remoteData.remoteUpdatedAt || remoteData.updatedAt || remoteData.lastSyncedAt) || new Date(),
      syncVersion: Number(remoteData.syncVersion || 0),
      syncDeviceId: remoteData.syncDeviceId || '',
    });
  }
}
