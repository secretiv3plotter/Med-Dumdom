import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import accessibilitySettingsService from '../../domain/services/AccessibilitySettingsService';
import { roundToPixel } from './scaling';
import {
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

export const getTextScale = () => currentTextScale;

export const setTextScale = (nextScale) => {
  currentTextScale = normalizeTextScale(nextScale);
  return currentTextScale;
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

  return transformThemeStyle(nextStyle);
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

export function TextScaleProvider({ children, userId = DEFAULT_USER_ID }) {
  const initialSettings = accessibilitySettingsService.getAccessibilitySettings(userId);
  const initialScale = normalizeTextScale(initialSettings?.textSizeLevel ?? MIN_TEXT_SCALE);
  const initialDarkMode = Boolean(initialSettings?.darkModeEnabled);
  const initialColorBlindMode = Boolean(initialSettings?.colorBlindModeEnabled);
  const initialHapticEnabled = initialSettings?.hapticEnabled ?? true;

  currentTextScale = initialScale;
  setThemeMode(initialDarkMode ? THEME_MODE_DARK : THEME_MODE_LIGHT);
  setColorBlindModeEnabled(initialColorBlindMode);
  const [textScale, setTextScaleState] = useState(initialScale);
  const [darkModeEnabled, setDarkModeEnabledState] = useState(initialDarkMode);
  const [colorBlindModeEnabled, setColorBlindModeEnabledState] = useState(initialColorBlindMode);
  const [hapticEnabled, setHapticEnabledState] = useState(initialHapticEnabled);

  const updateTextScale = useCallback(
    (nextScale) => {
      const normalized = normalizeTextScale(nextScale);
      currentTextScale = normalized;
      setTextScaleState(normalized);
      accessibilitySettingsService.updateTextScale(userId, normalized);
    },
    [userId]
  );

  const updateDarkMode = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setThemeMode(nextEnabled ? THEME_MODE_DARK : THEME_MODE_LIGHT);
      setDarkModeEnabledState(nextEnabled);
      accessibilitySettingsService.setDarkModeEnabled(userId, nextEnabled);
    },
    [userId]
  );

  const updateColorBlindMode = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setColorBlindModeEnabled(nextEnabled);
      setColorBlindModeEnabledState(nextEnabled);

      const currentSettings = accessibilitySettingsService.getAccessibilitySettings(userId);
      if (Boolean(currentSettings.colorBlindModeEnabled) !== nextEnabled) {
        accessibilitySettingsService.toggleColorBlindMode(userId);
      }
    },
    [userId]
  );

  const updateHapticEnabled = useCallback(
    (enabled) => {
      const nextEnabled = Boolean(enabled);
      setHapticEnabledState(nextEnabled);

      const currentSettings = accessibilitySettingsService.getAccessibilitySettings(userId);
      if (Boolean(currentSettings.hapticEnabled) !== nextEnabled) {
        accessibilitySettingsService.toggleHaptic(userId);
      }
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      textScale,
      setTextScale: updateTextScale,
      darkModeEnabled,
      setDarkModeEnabled: updateDarkMode,
      colorBlindModeEnabled,
      setColorBlindModeEnabled: updateColorBlindMode,
      hapticEnabled,
      setHapticEnabled: updateHapticEnabled,
    }),
    [textScale, updateTextScale, darkModeEnabled, updateDarkMode, colorBlindModeEnabled, updateColorBlindMode, hapticEnabled, updateHapticEnabled]
  );

  return <TextScaleContext.Provider value={value}>{children}</TextScaleContext.Provider>;
}

export function useTextScale() {
  const context = useContext(TextScaleContext);

  if (!context) {
    throw new Error('useTextScale must be used inside a TextScaleProvider.');
  }

  return context;
}

installTextScaling();
