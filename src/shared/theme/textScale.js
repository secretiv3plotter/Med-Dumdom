import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import accessibilitySettingsService from '../../domain/services/AccessibilitySettingsService';
import { roundToPixel } from './scaling';

export const MIN_TEXT_SCALE = 1.0;
export const MAX_TEXT_SCALE = 2.0;
const MIN_TEXT_PX = 16;
const DEFAULT_USER_ID = 'current-user';

const clampTextScale = (value) => Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));
const layoutScaleFromTextScale = (scale) => 1 + (scale - 1) * 0.7;
const originalStyleSheetCreate = StyleSheet.create.bind(StyleSheet);
let styleSheetCreatePatched = false;

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

  return nextStyle;
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
  const initialScale = normalizeTextScale(
    accessibilitySettingsService.getAccessibilitySettings(userId)?.textSizeLevel ?? MIN_TEXT_SCALE
  );

  currentTextScale = initialScale;
  const [textScale, setTextScaleState] = useState(initialScale);

  const updateTextScale = useCallback(
    (nextScale) => {
      const normalized = normalizeTextScale(nextScale);
      currentTextScale = normalized;
      setTextScaleState(normalized);
      accessibilitySettingsService.updateTextScale(userId, normalized);
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      textScale,
      setTextScale: updateTextScale,
    }),
    [textScale, updateTextScale]
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
