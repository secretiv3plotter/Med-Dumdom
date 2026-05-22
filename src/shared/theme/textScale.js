import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import accessibilitySettingsService from '../../domain/services/AccessibilitySettingsService';
import { roundToPixel } from './scaling';
import {
  getThemeColors,
  getThemeMode,
  getColorBlindModeEnabled,
  setColorBlindModeEnabled,
  setThemeMode,
  transformThemeValue,
  THEME_MODE_DARK,
  THEME_MODE_LIGHT,
} from './palette';

export const MIN_TEXT_SCALE = 1.0;
export const MAX_TEXT_SCALE = 2.0;
const MIN_TEXT_PX = 16;
const DEFAULT_USER_ID = 'current-user';

const clampTextScale = (value) => Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));
const layoutScaleFromTextScale = (scale) => 1 + (scale - 1) * 0.7;
const originalStyleSheetCreate = StyleSheet.create.bind(StyleSheet);
let styleSheetCreatePatched = false;
const THEME_STYLE_COLOR_KEYS = new Set([
  'accentColor',
  'backgroundColor',
  'borderBottomColor',
  'borderColor',
  'borderLeftColor',
  'borderRightColor',
  'borderTopColor',
  'color',
  'caretColor',
  'placeholderTextColor',
  'shadowColor',
  'textDecorationColor',
  'textShadowColor',
  'tintColor',
]);

export const normalizeTextScale = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampTextScale(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return clampTextScale(parsed);
    }
  }

  return MIN_TEXT_SCALE;
};

let currentTextScale = MIN_TEXT_SCALE;
let currentHighContrastEnabled = false;

export const getTextScale = () => currentTextScale;
export const getHighContrastEnabled = () => currentHighContrastEnabled;

export const setTextScale = (nextScale) => {
  currentTextScale = normalizeTextScale(nextScale);
  return currentTextScale;
};

export const setHighContrastEnabled = (enabled) => {
  currentHighContrastEnabled = Boolean(enabled);
  return currentHighContrastEnabled;
};

export const scaleFontSize = (baseSize) =>
  roundToPixel(Math.max(baseSize, MIN_TEXT_PX) * currentTextScale);

export const scaleLineHeight = (baseLineHeight) =>
  roundToPixel(Math.max(baseLineHeight, MIN_TEXT_PX) * currentTextScale);

export const getLayoutScale = () => layoutScaleFromTextScale(currentTextScale);

export const scaleLayoutValue = (value) => roundToPixel(value * getLayoutScale());

const transformThemeStyle = (style) => {
  if ((getThemeMode() !== THEME_MODE_DARK && !getColorBlindModeEnabled()) || !style || typeof style !== 'object') {
    return style;
  }

  if (Array.isArray(style)) {
    return style.map((item) => transformThemeStyle(item));
  }

  const transformed = { ...style };

  Object.entries(transformed).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[key] = transformThemeStyle(value);
      return;
    }

    if (THEME_STYLE_COLOR_KEYS.has(key)) {
      transformed[key] = transformThemeValue(value, undefined, key);
    }
  });

  return transformed;
};

const scaleTextStyle = (style) => {
  const flattened = StyleSheet.flatten(style);

  if (!flattened) {
    return flattened;
  }

  const nextStyle = { ...flattened };

  const resolveBasePx = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(value, MIN_TEXT_PX);
    }

    if (typeof value === 'string' && /rem$/i.test(value)) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return Math.max(parsed * 16, MIN_TEXT_PX);
      }
    }

    return null;
  };

  const resolvedFontBase = resolveBasePx(nextStyle.fontSize);
  if (resolvedFontBase != null) {
    nextStyle.fontSize = roundToPixel(resolvedFontBase * currentTextScale);
  }

  const resolvedLineHeightBase = resolveBasePx(nextStyle.lineHeight);
  if (resolvedLineHeightBase != null) {
    nextStyle.lineHeight = roundToPixel(resolvedLineHeightBase * currentTextScale);
  }

  const themedStyle = transformThemeStyle(nextStyle);

  if (!currentHighContrastEnabled || !themedStyle || typeof themedStyle !== 'object') {
    return themedStyle;
  }

  const HIGH_CONTRAST_EDGE_COLOR_KEYS = new Set([
    'borderColor',
    'borderBottomColor',
    'borderTopColor',
    'borderLeftColor',
    'borderRightColor',
  ]);
  const HIGH_CONTRAST_BACKGROUND_KEYS = new Set(['backgroundColor']);
  const HIGH_CONTRAST_TEXT_COLOR_KEYS = new Set([
    'color',
    'placeholderTextColor',
    'textDecorationColor',
    'textShadowColor',
    'tintColor',
    'accentColor',
    'caretColor',
  ]);

  const HIGH_CONTRAST_BORDER_WIDTH_KEYS = new Set(['borderWidth']);

  const isHexColor = (value) =>
    typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

  const normalizeHex = (hex) => {
    const raw = hex.slice(1);
    if (raw.length === 3) {
      return raw
        .split('')
        .map((char) => char + char)
        .join('');
    }
    return raw;
  };

  const hexToRgb = (hex) => {
    const normalized = normalizeHex(hex);
    const intValue = Number.parseInt(normalized, 16);
    return {
      r: (intValue >> 16) & 255,
      g: (intValue >> 8) & 255,
      b: intValue & 255,
    };
  };

  const contrastedStyle = { ...themedStyle };
  const darkMode = getThemeMode() === THEME_MODE_DARK;
  const edgeColor = darkMode ? '#94A3B8' : '#000000';
  const uniformBackground = getThemeColors(darkMode ? THEME_MODE_DARK : THEME_MODE_LIGHT).pageBg;

  const contrastTextColor = (value) => {
    if (!isHexColor(value)) {
      return value;
    }

    const { r, g, b } = hexToRgb(value);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const isGray = delta <= 20;
    const isGreen = g >= r + 20 && g >= b + 20;
    const isBlue = b >= r + 20 && b >= g + 20;

    if (isGray) {
      return darkMode ? '#F8FAFC' : '#0F172A';
    }

    if (isGreen) {
      return darkMode ? '#86EFAC' : '#166534';
    }

    if (isBlue) {
      return darkMode ? '#93C5FD' : '#1E3A8A';
    }

    // For other hues, bias toward strong readable foreground per mode.
    return darkMode ? '#F8FAFC' : '#0F172A';
  };

  Object.entries(contrastedStyle).forEach(([key, value]) => {
    if (HIGH_CONTRAST_BACKGROUND_KEYS.has(key) && isHexColor(value)) {
      contrastedStyle[key] = uniformBackground;
      return;
    }

    if (HIGH_CONTRAST_EDGE_COLOR_KEYS.has(key) && isHexColor(value)) {
      contrastedStyle[key] = edgeColor;
      return;
    }

    if (HIGH_CONTRAST_TEXT_COLOR_KEYS.has(key)) {
      contrastedStyle[key] = contrastTextColor(value);
      return;
    }

    if (HIGH_CONTRAST_BORDER_WIDTH_KEYS.has(key) && typeof value === 'number') {
      contrastedStyle[key] = Math.max(value, 2);
      return;
    }

    if (key === 'fontWeight' && (typeof value === 'string' || typeof value === 'number')) {
      contrastedStyle[key] = '700';
    }
  });

  return contrastedStyle;
};

const createScaledStyleProxy = (styles) =>
  new Proxy(styles, {
    get(target, prop, receiver) {
      if (prop === '__isScaledStyleSheet') {
        return true;
      }

      const value = Reflect.get(target, prop, receiver);

      if (value == null || typeof prop === 'symbol') {
        return value;
      }

      return scaleTextStyle(value);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  });

const patchTextComponent = (Component) => {
  if (!Component || Component.__textScalePatched) {
    return;
  }

  const originalRender = Component.render;
  if (typeof originalRender !== 'function') {
    return;
  }

  Component.render = function patchedRender(...args) {
    const element = originalRender.apply(this, args);

    if (!React.isValidElement(element)) {
      return element;
    }

    const originalStyle = element.props?.style;
    if (!originalStyle) {
      return element;
    }

    const scaledStyle = scaleTextStyle(originalStyle);
    return React.cloneElement(element, {
      style: scaledStyle,
      allowFontScaling: false,
    });
  };

  Component.__textScalePatched = true;
};

export const installTextScaling = () => {
  if (!styleSheetCreatePatched) {
    styleSheetCreatePatched = true;
    StyleSheet.create = (styles) => createScaledStyleProxy(originalStyleSheetCreate(styles));
  }

  patchTextComponent(Text);
  patchTextComponent(TextInput);
};

const TextScaleContext = createContext(null);

const highContrastFilterStyle = Platform.OS === 'web'
  ? { flex: 1, filter: 'contrast(2)' }
  : { flex: 1, filter: [{ contrast: 2 }] };

export function TextScaleProvider({ children, userId = DEFAULT_USER_ID, settingsService = accessibilitySettingsService }) {
  const initialSettings = settingsService.getAccessibilitySettings(userId);
  const initialScale = normalizeTextScale(initialSettings?.textSizeLevel ?? MIN_TEXT_SCALE);
  const initialDarkMode = Boolean(initialSettings?.darkModeEnabled);
  const initialHighContrast = Boolean(initialSettings?.highContrastEnabled);
  const initialColorBlindMode = Boolean(initialSettings?.colorBlindModeEnabled);
  const initialHapticEnabled = initialSettings?.hapticEnabled ?? true;

  currentTextScale = initialScale;
  currentHighContrastEnabled = initialHighContrast;
  setThemeMode(initialDarkMode ? THEME_MODE_DARK : THEME_MODE_LIGHT);
  setColorBlindModeEnabled(initialColorBlindMode);
  const [textScale, setTextScaleState] = useState(initialScale);
  const [darkModeEnabled, setDarkModeEnabledState] = useState(initialDarkMode);
  const [highContrastEnabled, setHighContrastEnabledState] = useState(initialHighContrast);
  const [colorBlindModeEnabled, setColorBlindModeEnabledState] = useState(initialColorBlindMode);
  const [hapticEnabled, setHapticEnabledState] = useState(initialHapticEnabled);

  const updateTextScale = useCallback(
    (nextScale) => {
      const normalized = normalizeTextScale(nextScale);
      currentTextScale = normalized;
      setTextScaleState(normalized);
      settingsService.updateTextScale(userId, normalized);
    },
    [userId, settingsService]
  );

  const updateDarkMode = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setThemeMode(nextEnabled ? THEME_MODE_DARK : THEME_MODE_LIGHT);
      setDarkModeEnabledState(nextEnabled);
      settingsService.setDarkModeEnabled(userId, nextEnabled);
    },
    [userId, settingsService]
  );

  const updateHighContrast = useCallback((enabled) => {
    const nextEnabled = Boolean(enabled);
    currentHighContrastEnabled = nextEnabled;
    setHighContrastEnabledState(nextEnabled);
  }, []);

  const updateColorBlindMode = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setColorBlindModeEnabled(nextEnabled);
      setColorBlindModeEnabledState(nextEnabled);

      const currentSettings = settingsService.getAccessibilitySettings(userId);
      if (Boolean(currentSettings.colorBlindModeEnabled) !== nextEnabled) {
        settingsService.toggleColorBlindMode(userId);
      }
    },
    [userId, settingsService]
  );

  const updateHapticEnabled = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setHapticEnabledState(nextEnabled);

      const currentSettings = settingsService.getAccessibilitySettings(userId);
      if (Boolean(currentSettings.hapticEnabled) !== nextEnabled) {
        settingsService.toggleHaptic(userId);
      }
    },
    [userId, settingsService]
  );

  const value = useMemo(
    () => ({
      textScale,
      setTextScale: updateTextScale,
      darkModeEnabled,
      setDarkModeEnabled: updateDarkMode,
      highContrastEnabled,
      setHighContrastEnabled: updateHighContrast,
      colorBlindModeEnabled,
      setColorBlindModeEnabled: updateColorBlindMode,
      hapticEnabled,
      setHapticEnabled: updateHapticEnabled,
    }),
    [textScale, updateTextScale, darkModeEnabled, updateDarkMode, colorBlindModeEnabled, updateColorBlindMode, hapticEnabled, updateHapticEnabled, highContrastEnabled, updateHighContrast]
  );

  return (
    <TextScaleContext.Provider value={value}>
      <View style={highContrastEnabled ? highContrastFilterStyle : { flex: 1 }}>
        {children}
      </View>
    </TextScaleContext.Provider>
  );
}

export function useTextScale() {
  const context = useContext(TextScaleContext);

  if (!context) {
    throw new Error('useTextScale must be used inside a TextScaleProvider.');
  }

  return context;
}

installTextScaling();
