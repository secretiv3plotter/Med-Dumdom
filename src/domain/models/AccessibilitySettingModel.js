// In AccessibilitySettingModel.js, put:

// attributes for accessibility preferences, like:
// textSizeLevel: small | medium | large
// highContrastEnabled: boolean
// reducedMotionEnabled: boolean
// screenReaderSupportEnabled: boolean
// hapticEnabled: boolean
// speechToTextEnabled: boolean
// assistiveDeviceEnabled: boolean
// voiceTypingEnabled: boolean
// colorBlindModeEnabled: boolean
// easyModeEnabled: boolean
// darkModeEnabled: boolean

// a constructor

// methods like:
// updateTextSizeLevel(newLevel)
// toggleHighContrast()
// toggleReducedMotion()
// toggleScreenReaderSupport()
// toggleHaptic()
// toggleSpeechToText()
// toggleAssistiveDevice()
// toggleVoiceTyping()
// toggleColorBlindMode()
// toggleEasyMode()
// toggleDarkMode()

const TEXT_SIZE_LEVELS = new Set(['small', 'medium', 'large']);

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
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

class AccessibilitySetting {
  constructor(
    textSizeLevel = 'medium',
    highContrastEnabled = false,
    reducedMotionEnabled = false,
    screenReaderSupportEnabled = false,
    hapticEnabled = true,
    speechToTextEnabled = false,
    assistiveDeviceEnabled = false,
    voiceTypingEnabled = false,
    colorBlindModeEnabled = false,
    easyModeEnabled = false,
    darkModeEnabled = false
  ) {
    this.textSizeLevel = normalizeTextSizeLevel(textSizeLevel);
    this.highContrastEnabled = normalizeBoolean(highContrastEnabled, 'highContrastEnabled');
    this.reducedMotionEnabled = normalizeBoolean(reducedMotionEnabled, 'reducedMotionEnabled');
    this.screenReaderSupportEnabled = normalizeBoolean(
      screenReaderSupportEnabled,
      'screenReaderSupportEnabled'
    );
    this.hapticEnabled = normalizeBoolean(hapticEnabled, 'hapticEnabled');
    this.speechToTextEnabled = normalizeBoolean(speechToTextEnabled, 'speechToTextEnabled');
    this.assistiveDeviceEnabled = normalizeBoolean(assistiveDeviceEnabled, 'assistiveDeviceEnabled');
    this.voiceTypingEnabled = normalizeBoolean(voiceTypingEnabled, 'voiceTypingEnabled');
    this.colorBlindModeEnabled = normalizeBoolean(colorBlindModeEnabled, 'colorBlindModeEnabled');
    this.easyModeEnabled = normalizeBoolean(easyModeEnabled, 'easyModeEnabled');
    this.darkModeEnabled = normalizeBoolean(darkModeEnabled, 'darkModeEnabled');
  }

  updateTextSizeLevel(newLevel) {
    this.textSizeLevel = normalizeTextSizeLevel(newLevel);
  }

  toggleHighContrast() {
    this.highContrastEnabled = !normalizeBoolean(this.highContrastEnabled, 'highContrastEnabled');
  }

  toggleReducedMotion() {
    this.reducedMotionEnabled = !normalizeBoolean(this.reducedMotionEnabled, 'reducedMotionEnabled');
  }

  toggleScreenReaderSupport() {
    this.screenReaderSupportEnabled = !normalizeBoolean(
      this.screenReaderSupportEnabled,
      'screenReaderSupportEnabled'
    );
  }

  toggleHaptic() {
    this.hapticEnabled = !normalizeBoolean(this.hapticEnabled, 'hapticEnabled');
  }

  toggleSpeechToText() {
    this.speechToTextEnabled = !normalizeBoolean(this.speechToTextEnabled, 'speechToTextEnabled');
  }

  toggleAssistiveDevice() {
    this.assistiveDeviceEnabled = !normalizeBoolean(this.assistiveDeviceEnabled, 'assistiveDeviceEnabled');
  }

  toggleVoiceTyping() {
    this.voiceTypingEnabled = !normalizeBoolean(this.voiceTypingEnabled, 'voiceTypingEnabled');
  }

  toggleColorBlindMode() {
    this.colorBlindModeEnabled = !normalizeBoolean(this.colorBlindModeEnabled, 'colorBlindModeEnabled');
  }

  toggleEasyMode() {
    this.easyModeEnabled = !normalizeBoolean(this.easyModeEnabled, 'easyModeEnabled');
  }

  toggleDarkMode() {
    this.darkModeEnabled = !normalizeBoolean(this.darkModeEnabled, 'darkModeEnabled');
  }
}

export default AccessibilitySetting;
