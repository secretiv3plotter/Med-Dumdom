// AccessibilitySettingsService
// Role:
// Own the business logic for accessibility preferences.
// This service defines how accessibility settings are loaded, updated, and interpreted.
//
// What belongs here:
// - exposing accessibility settings for the current user
// - updating text size level
// - toggling high contrast
// - toggling haptic feedback
// - toggling color blind mode
// - toggling dark mode
//
// Use cases covered:
// - patient manages settings/preferences
//
// What should NOT belong here:
// - UI theme rendering
// - platform accessibility APIs
// - Realm storage details
// - actual animation or style implementation
//
// Suggested service methods:
// - getAccessibilitySettings(userId)
// - updateTextSizeLevel(userId, level)
// - toggleHighContrast(userId)
// - toggleHaptic(userId)
// - toggleColorBlindMode(userId)
// - toggleDarkMode(userId)
//
// Notes:
// - this service should mirror the exact capabilities in AccessibilitySettingModel
// - do not add extra accessibility features here unless the model adds them too
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: patient settings UI only

import AccessibilitySetting from '../models/AccessibilitySettingModel';

const normalizeUserId = (userId) => {
  if (typeof userId === 'string') {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      throw new RangeError('userId cannot be empty.');
    }

    return trimmedUserId;
  }

  if (typeof userId === 'number' && Number.isFinite(userId)) {
    return String(userId);
  }

  throw new TypeError('userId must be a non-empty string or a finite number.');
};

const cloneSettings = (settings) =>
  new AccessibilitySetting(
    settings.textScale ?? settings.textSizeLevel ?? 1.0,
    settings.highContrastEnabled,
    settings.hapticEnabled,
    settings.colorBlindModeEnabled,
    settings.darkModeEnabled
  );

const toSettingsModel = (settings) => {
  if (settings instanceof AccessibilitySetting) {
    return cloneSettings(settings);
  }

  if (settings && typeof settings === 'object') {
    return new AccessibilitySetting(
      settings.textScale ?? settings.textSizeLevel ?? 1.0,
      settings.highContrastEnabled,
      settings.hapticEnabled,
      settings.colorBlindModeEnabled,
      settings.darkModeEnabled
    );
  }

  return new AccessibilitySetting();
};

export class AccessibilitySettingsService {
  constructor(initialSettingsByUserId = null) {
    this.settingsByUserId = new Map();

    if (initialSettingsByUserId instanceof Map) {
      initialSettingsByUserId.forEach((settings, userId) => {
        this.settingsByUserId.set(normalizeUserId(userId), toSettingsModel(settings));
      });
      return;
    }

    if (initialSettingsByUserId && typeof initialSettingsByUserId === 'object') {
      Object.entries(initialSettingsByUserId).forEach(([userId, settings]) => {
        this.settingsByUserId.set(normalizeUserId(userId), toSettingsModel(settings));
      });
    }
  }

  getAccessibilitySettings(userId) {
    return cloneSettings(this._getStoredSettings(userId));
  }

  updateTextScale(userId, scale) {
    const settings = this._getStoredSettings(userId);
    settings.updateTextScale(scale);
    return cloneSettings(settings);
  }

  updateTextSizeLevel(userId, level) {
    return this.updateTextScale(userId, level);
  }

  toggleHighContrast(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleHighContrast();
    return cloneSettings(settings);
  }

  toggleHaptic(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleHaptic();
    return cloneSettings(settings);
  }

  toggleColorBlindMode(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleColorBlindMode();
    return cloneSettings(settings);
  }

  toggleDarkMode(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleDarkMode();
    return cloneSettings(settings);
  }

  setDarkModeEnabled(userId, enabled) {
    const settings = this._getStoredSettings(userId);
    settings.setDarkModeEnabled(enabled);
    return cloneSettings(settings);
  }

  _getStoredSettings(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const storedSettings = this.settingsByUserId.get(normalizedUserId);

    if (storedSettings) {
      return storedSettings;
    }

    const defaultSettings = new AccessibilitySetting();
    this.settingsByUserId.set(normalizedUserId, defaultSettings);
    return defaultSettings;
  }
}

const accessibilitySettingsService = new AccessibilitySettingsService();

export default accessibilitySettingsService;
