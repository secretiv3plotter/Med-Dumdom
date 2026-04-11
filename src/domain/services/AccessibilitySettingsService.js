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

class AccessibilitySettingsService {
  constructor(accessibilitySettingModel) {
    this.accessibilitySettingModel = accessibilitySettingModel;
  }

  getAccessibilitySettings(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.accessibilitySettingModel.getSettingsByUserId(userId);
  }

  updateTextSizeLevel(userId, level) {
    if (!userId || level === undefined) {
      throw new Error('userId and level are required');
    }

    const validLevels = [1, 2, 3, 4, 5];
    if (!validLevels.includes(level)) {
      throw new Error('Text size level must be between 1 and 5');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    return settings.updateTextSizeLevel(level);
  }

  toggleHighContrast(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.highContrastEnabled;
    return settings.updateHighContrast(!currentState);
  }

  toggleReducedMotion(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.reducedMotionEnabled;
    return settings.updateReducedMotion(!currentState);
  }

  toggleScreenReaderSupport(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.screenReaderEnabled;
    return settings.updateScreenReaderSupport(!currentState);
  }

  toggleHaptic(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.hapticEnabled;
    return settings.updateHaptic(!currentState);
  }

  toggleSpeechToText(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.speechToTextEnabled;
    return settings.updateSpeechToText(!currentState);
  }

  toggleAssistiveDevice(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.assistiveDeviceEnabled;
    return settings.updateAssistiveDevice(!currentState);
  }

  toggleVoiceTyping(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.voiceTypingEnabled;
    return settings.updateVoiceTyping(!currentState);
  }

  toggleColorBlindMode(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.colorBlindModeEnabled;
    return settings.updateColorBlindMode(!currentState);
  }

  toggleEasyMode(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.easyModeEnabled;
    return settings.updateEasyMode(!currentState);
  }

  toggleDarkMode(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const settings = this.accessibilitySettingModel.getSettingsByUserId(userId);
    const currentState = settings.darkModeEnabled;
    return settings.updateDarkMode(!currentState);
  }
}

module.exports = AccessibilitySettingsService;
