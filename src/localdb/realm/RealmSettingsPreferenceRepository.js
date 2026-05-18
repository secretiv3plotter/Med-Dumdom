import AccessibilitySetting from '../../domain/models/AccessibilitySettingModel';

const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
};

const SYNC_OPERATION = {
  CREATE: 'create',
  UPDATE: 'update',
};

const normalizeUserId = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new RangeError('userId cannot be empty.');
  }

  return normalizedUserId;
};

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

const toSettingsModel = (settings) =>
  new AccessibilitySetting(
    settings.textScale ?? settings.textSizeLevel ?? 1.0,
    Boolean(settings.highContrastEnabled),
    settings.hapticEnabled ?? true,
    Boolean(settings.colorBlindModeEnabled),
    Boolean(settings.darkModeEnabled),
  );

const toPlainSettings = (settings) => ({
  userId: settings.userId,
  textSizeLevel: Number(settings.textSizeLevel ?? 1.0),
  highContrastEnabled: Boolean(settings.highContrastEnabled),
  hapticEnabled: settings.hapticEnabled ?? true,
  colorBlindModeEnabled: Boolean(settings.colorBlindModeEnabled),
  darkModeEnabled: Boolean(settings.darkModeEnabled),
  syncStatus: settings.syncStatus || SYNC_STATUS.SYNCED,
  syncOperation: settings.syncOperation || '',
  syncError: settings.syncError || '',
  lastSyncedAt: toIsoOrNull(settings.lastSyncedAt),
  localUpdatedAt: toIsoOrNull(settings.localUpdatedAt),
  remoteUpdatedAt: toIsoOrNull(settings.remoteUpdatedAt),
  syncVersion: Number(settings.syncVersion || 0),
  syncDeviceId: settings.syncDeviceId || '',
  createdAt: toIsoOrNull(settings.createdAt),
  updatedAt: toIsoOrNull(settings.updatedAt),
});

export default class RealmSettingsPreferenceRepository {
  constructor(realm) {
    this.realm = realm;
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
  }

  ensureSettings(userId, settingsData = {}, syncOptions = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const existingSettings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
    if (existingSettings) {
      return existingSettings;
    }

    const now = new Date();
    const markPending = syncOptions.markPending === true;
    return this.realm.create('AccessibilityPreference', {
      userId: normalizedUserId,
      textSizeLevel: Number(settingsData.textScale ?? settingsData.textSizeLevel ?? 1.0),
      highContrastEnabled: Boolean(settingsData.highContrastEnabled),
      hapticEnabled: settingsData.hapticEnabled ?? true,
      colorBlindModeEnabled: Boolean(settingsData.colorBlindModeEnabled),
      darkModeEnabled: Boolean(settingsData.darkModeEnabled),
      syncStatus: syncOptions.syncStatus || (markPending ? SYNC_STATUS.PENDING : SYNC_STATUS.SYNCED),
      syncOperation: syncOptions.syncOperation ?? (markPending ? SYNC_OPERATION.CREATE : ''),
      syncError: syncOptions.syncError || '',
      lastSyncedAt: toNullableDate(syncOptions.lastSyncedAt),
      localUpdatedAt: toNullableDate(syncOptions.localUpdatedAt) || now,
      remoteUpdatedAt: toNullableDate(syncOptions.remoteUpdatedAt),
      syncVersion: Number(syncOptions.syncVersion || 0) + (markPending ? 1 : 0),
      syncDeviceId: syncOptions.syncDeviceId || '',
      createdAt: now,
      updatedAt: now,
    });
  }

  getAccessibilitySettings(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => toSettingsModel(this.ensureSettings(normalizedUserId)));
  }

  saveAccessibilitySettings(userId, settingsData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const existingSettings = this.ensureSettings(normalizedUserId, settingsData);
      const currentSettings = toSettingsModel(existingSettings);
      const nextSettings = settingsData instanceof AccessibilitySetting
        ? settingsData
        : new AccessibilitySetting(
            settingsData.textScale ?? settingsData.textSizeLevel ?? currentSettings.textScale,
            settingsData.highContrastEnabled ?? currentSettings.highContrastEnabled,
            settingsData.hapticEnabled ?? currentSettings.hapticEnabled,
            settingsData.colorBlindModeEnabled ?? currentSettings.colorBlindModeEnabled,
            settingsData.darkModeEnabled ?? currentSettings.darkModeEnabled,
          );
      const now = new Date();
      const operation = existingSettings.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.UPDATE;
      const savedSettings = this.realm.create(
        'AccessibilityPreference',
        {
          userId: normalizedUserId,
          textSizeLevel: nextSettings.textScale,
          highContrastEnabled: nextSettings.highContrastEnabled,
          hapticEnabled: nextSettings.hapticEnabled,
          colorBlindModeEnabled: nextSettings.colorBlindModeEnabled,
          darkModeEnabled: nextSettings.darkModeEnabled,
          syncStatus: SYNC_STATUS.PENDING,
          syncOperation: operation,
          syncError: '',
          lastSyncedAt: toNullableDate(existingSettings.lastSyncedAt),
          localUpdatedAt: now,
          remoteUpdatedAt: toNullableDate(existingSettings.remoteUpdatedAt),
          syncVersion: Number(existingSettings.syncVersion || 0) + 1,
          syncDeviceId: existingSettings.syncDeviceId || '',
          createdAt: existingSettings.createdAt || now,
          updatedAt: now,
        },
        'modified',
      );

      return toSettingsModel(savedSettings);
    });
  }

  updateTextScale(userId, scale) {
    const settings = this.getAccessibilitySettings(userId);
    settings.updateTextScale(scale);
    return this.saveAccessibilitySettings(userId, settings);
  }

  updateTextSizeLevel(userId, level) {
    return this.updateTextScale(userId, level);
  }

  toggleHighContrast(userId) {
    const settings = this.getAccessibilitySettings(userId);
    settings.toggleHighContrast();
    return this.saveAccessibilitySettings(userId, settings);
  }

  toggleHaptic(userId) {
    const settings = this.getAccessibilitySettings(userId);
    settings.toggleHaptic();
    return this.saveAccessibilitySettings(userId, settings);
  }

  toggleColorBlindMode(userId) {
    const settings = this.getAccessibilitySettings(userId);
    settings.toggleColorBlindMode();
    return this.saveAccessibilitySettings(userId, settings);
  }

  toggleDarkMode(userId) {
    const settings = this.getAccessibilitySettings(userId);
    settings.toggleDarkMode();
    return this.saveAccessibilitySettings(userId, settings);
  }

  setDarkModeEnabled(userId, enabled) {
    const settings = this.getAccessibilitySettings(userId);
    settings.setDarkModeEnabled(enabled);
    return this.saveAccessibilitySettings(userId, settings);
  }

  listPendingSettingsSyncChanges(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const settings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
    if (!settings || (settings.syncStatus !== SYNC_STATUS.PENDING && settings.syncStatus !== SYNC_STATUS.ERROR)) {
      return [];
    }

    return [toPlainSettings(settings)];
  }

  markSettingsSynced(userId, remoteUpdatedAt = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const settings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
      if (!settings) return false;

      const syncedAt = new Date();
      settings.syncStatus = SYNC_STATUS.SYNCED;
      settings.syncOperation = '';
      settings.syncError = '';
      settings.lastSyncedAt = syncedAt;
      settings.remoteUpdatedAt = toNullableDate(remoteUpdatedAt) || syncedAt;
      return true;
    });
  }

  markSettingsSyncError(userId, error) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const settings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
      if (!settings) return false;

      settings.syncStatus = SYNC_STATUS.ERROR;
      settings.syncError = error instanceof Error ? error.message : String(error || 'Sync failed.');
      return true;
    });
  }

  upsertRemoteSettings(userId, remoteData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const remoteUpdatedAt = toNullableDate(remoteData.remoteUpdatedAt || remoteData.updatedAt || remoteData.lastSyncedAt) || new Date();

    return this.write(() => {
      const existingSettings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
      const localUpdatedAt = toNullableDate(existingSettings?.localUpdatedAt || existingSettings?.updatedAt);
      const hasUnpushedLocalChange =
        existingSettings &&
        (existingSettings.syncStatus === SYNC_STATUS.PENDING || existingSettings.syncStatus === SYNC_STATUS.ERROR) &&
        localUpdatedAt &&
        localUpdatedAt.getTime() >= remoteUpdatedAt.getTime();

      if (hasUnpushedLocalChange) {
        return toPlainSettings(existingSettings);
      }

      const now = new Date();
      const savedSettings = this.realm.create('AccessibilityPreference', {
        userId: normalizedUserId,
        textSizeLevel: Number(remoteData.textSizeLevel ?? remoteData.textScale ?? existingSettings?.textSizeLevel ?? 1.0),
        highContrastEnabled: Boolean(remoteData.highContrastEnabled ?? existingSettings?.highContrastEnabled),
        hapticEnabled: remoteData.hapticEnabled ?? existingSettings?.hapticEnabled ?? true,
        colorBlindModeEnabled: Boolean(remoteData.colorBlindModeEnabled ?? existingSettings?.colorBlindModeEnabled),
        darkModeEnabled: Boolean(remoteData.darkModeEnabled ?? existingSettings?.darkModeEnabled),
        syncStatus: SYNC_STATUS.SYNCED,
        syncOperation: '',
        syncError: '',
        lastSyncedAt: now,
        localUpdatedAt: remoteUpdatedAt,
        remoteUpdatedAt,
        syncVersion: Number(remoteData.syncVersion || existingSettings?.syncVersion || 0),
        syncDeviceId: remoteData.syncDeviceId || existingSettings?.syncDeviceId || '',
        createdAt: toNullableDate(remoteData.createdAt) || existingSettings?.createdAt || now,
        updatedAt: toNullableDate(remoteData.updatedAt) || now,
      }, 'modified');

      return toPlainSettings(savedSettings);
    });
  }
}
