// AccessibilitySettingsService
// Role:
// Own the business logic for accessibility preferences.
// This service defines how accessibility settings are loaded, updated, and interpreted.
//
// What belongs here:
// - exposing accessibility settings for the current user
// - updating text size level
// - toggling high contrast
// - toggling reduced motion
// - toggling screen reader support
// - toggling haptic feedback
// - toggling speech to text
// - toggling assistive device support
// - toggling voice typing
// - toggling color blind mode
// - toggling easy mode
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
// - toggleReducedMotion(userId)
// - toggleScreenReaderSupport(userId)
// - toggleHaptic(userId)
// - toggleSpeechToText(userId)
// - toggleAssistiveDevice(userId)
// - toggleVoiceTyping(userId)
// - toggleColorBlindMode(userId)
// - toggleEasyMode(userId)
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

const TEXT_SIZE_LEVELS = new Set(['small', 'medium', 'large']);

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

const normalizeTextSizeLevel = (value) => {
  if (typeof value !== 'string') {
    throw new TypeError('textSizeLevel must be a string.');
  }

  const normalizedValue = value.trim().toLowerCase();
  if (!TEXT_SIZE_LEVELS.has(normalizedValue)) {
    throw new RangeError(`textSizeLevel must be one of: ${Array.from(TEXT_SIZE_LEVELS).join(', ')}.`);
  }

  return normalizedValue;
};

const cloneSettings = (settings) =>
  new AccessibilitySetting(
    settings.textSizeLevel,
    settings.highContrastEnabled,
    settings.reducedMotionEnabled,
    settings.screenReaderSupportEnabled,
    settings.hapticEnabled,
    settings.speechToTextEnabled,
    settings.assistiveDeviceEnabled,
    settings.voiceTypingEnabled,
    settings.colorBlindModeEnabled,
    settings.easyModeEnabled,
    settings.darkModeEnabled
  );

const toSettingsModel = (settings) => {
  if (settings instanceof AccessibilitySetting) {
    return cloneSettings(settings);
  }

  if (settings && typeof settings === 'object') {
    return new AccessibilitySetting(
      settings.textSizeLevel,
      settings.highContrastEnabled,
      settings.reducedMotionEnabled,
      settings.screenReaderSupportEnabled,
      settings.hapticEnabled,
      settings.speechToTextEnabled,
      settings.assistiveDeviceEnabled,
      settings.voiceTypingEnabled,
      settings.colorBlindModeEnabled,
      settings.easyModeEnabled,
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

  updateTextSizeLevel(userId, level) {
    const settings = this._getStoredSettings(userId);
    const normalizedLevel = normalizeTextSizeLevel(level);
    settings.updateTextSizeLevel(normalizedLevel);
    return cloneSettings(settings);
  }

  toggleHighContrast(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleHighContrast();
    return cloneSettings(settings);
  }

  toggleReducedMotion(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleReducedMotion();
    return cloneSettings(settings);
  }

  toggleScreenReaderSupport(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleScreenReaderSupport();
    return cloneSettings(settings);
  }

  toggleHaptic(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleHaptic();
    return cloneSettings(settings);
  }

  toggleSpeechToText(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleSpeechToText();
    return cloneSettings(settings);
  }

  toggleAssistiveDevice(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleAssistiveDevice();
    return cloneSettings(settings);
  }

  toggleVoiceTyping(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleVoiceTyping();
    return cloneSettings(settings);
  }

  toggleColorBlindMode(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleColorBlindMode();
    return cloneSettings(settings);
  }

  toggleEasyMode(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleEasyMode();
    return cloneSettings(settings);
  }

  toggleDarkMode(userId) {
    const settings = this._getStoredSettings(userId);
    settings.toggleDarkMode();
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
