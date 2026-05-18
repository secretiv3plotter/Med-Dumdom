import AccessibilitySetting from '../../domain/models/AccessibilitySettingModel';

const normalizeUserId = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new RangeError('userId cannot be empty.');
  }

  return normalizedUserId;
};

const toSettingsModel = (settings) =>
  new AccessibilitySetting(
    settings.textScale ?? settings.textSizeLevel ?? 1.0,
    Boolean(settings.highContrastEnabled),
    settings.hapticEnabled ?? true,
    Boolean(settings.colorBlindModeEnabled),
    Boolean(settings.darkModeEnabled),
  );

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

  ensureSettings(userId, settingsData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const existingSettings = this.realm.objectForPrimaryKey('AccessibilityPreference', normalizedUserId);
    if (existingSettings) {
      return existingSettings;
    }

    const now = new Date();
    return this.realm.create('AccessibilityPreference', {
      userId: normalizedUserId,
      textSizeLevel: Number(settingsData.textScale ?? settingsData.textSizeLevel ?? 1.0),
      highContrastEnabled: Boolean(settingsData.highContrastEnabled),
      hapticEnabled: settingsData.hapticEnabled ?? true,
      colorBlindModeEnabled: Boolean(settingsData.colorBlindModeEnabled),
      darkModeEnabled: Boolean(settingsData.darkModeEnabled),
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
      const savedSettings = this.realm.create(
        'AccessibilityPreference',
        {
          userId: normalizedUserId,
          textSizeLevel: nextSettings.textScale,
          highContrastEnabled: nextSettings.highContrastEnabled,
          hapticEnabled: nextSettings.hapticEnabled,
          colorBlindModeEnabled: nextSettings.colorBlindModeEnabled,
          darkModeEnabled: nextSettings.darkModeEnabled,
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
}
