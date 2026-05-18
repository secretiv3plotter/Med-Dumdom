const MIN_TEXT_SCALE = 1.0;
const MAX_TEXT_SCALE = 2.0;

const LEGACY_TEXT_SIZE_LEVEL_TO_SCALE = {
  small: 1.0,
  medium: 1.5,
  large: 2.0,
};

const clampTextScale = (value) => Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));

const normalizeTextScale = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampTextScale(value);
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (Object.prototype.hasOwnProperty.call(LEGACY_TEXT_SIZE_LEVEL_TO_SCALE, normalizedValue)) {
      return LEGACY_TEXT_SIZE_LEVEL_TO_SCALE[normalizedValue];
    }

    const parsed = Number(normalizedValue);
    if (Number.isFinite(parsed)) {
      return clampTextScale(parsed);
    }
  }

  throw new TypeError('textSizeLevel must be a number between 1.0 and 2.5 or a legacy level.');
};

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
};

class AccessibilitySetting {
  constructor(
    textSizeLevel = 1.0,
    highContrastEnabled = false,
    hapticEnabled = true,
    colorBlindModeEnabled = false,
    darkModeEnabled = false
  ) {
    const normalizedTextScale = normalizeTextScale(textSizeLevel);

    this.textSizeLevel = normalizedTextScale;
    this.textScale = normalizedTextScale;

    this.highContrastEnabled = normalizeBoolean(highContrastEnabled, 'highContrastEnabled');
    this.hapticEnabled = normalizeBoolean(hapticEnabled, 'hapticEnabled');
    this.colorBlindModeEnabled = normalizeBoolean(colorBlindModeEnabled, 'colorBlindModeEnabled');
    this.darkModeEnabled = normalizeBoolean(darkModeEnabled, 'darkModeEnabled');
  }

  updateTextSizeLevel(newLevel) {
    const normalizedTextScale = normalizeTextScale(newLevel);
    this.textSizeLevel = normalizedTextScale;
    this.textScale = normalizedTextScale;
  }

  updateTextScale(newScale) {
    this.updateTextSizeLevel(newScale);
  }

  toggleHighContrast() {
    this.highContrastEnabled = !normalizeBoolean(this.highContrastEnabled, 'highContrastEnabled');
  }

  toggleHaptic() {
    this.hapticEnabled = !normalizeBoolean(this.hapticEnabled, 'hapticEnabled');
  }

  toggleColorBlindMode() {
    this.colorBlindModeEnabled = !normalizeBoolean(this.colorBlindModeEnabled, 'colorBlindModeEnabled');
  }

  toggleDarkMode() {
    this.darkModeEnabled = !normalizeBoolean(this.darkModeEnabled, 'darkModeEnabled');
  }

  setDarkModeEnabled(enabled) {
    this.darkModeEnabled = normalizeBoolean(enabled, 'darkModeEnabled');
  }
}

export default AccessibilitySetting;
