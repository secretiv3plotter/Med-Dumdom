import { Platform } from 'react-native';
import { moderateScale, moderateVerticalScale, roundToPixel } from './scaling';
import { getThemeColors } from './palette';

// Base typography helpers. Live accessibility scaling is applied at render time
// by the shared text-scale layer so these values stay stable as a baseline.
export const getFontSize = (size) => {
  if (Platform.OS === 'web') {
    return `${size / 16}rem`;
  }

  return roundToPixel(moderateScale(size));
};

export const getLineHeight = (lineHeight) => {
  if (Platform.OS === 'web') {
    return `${lineHeight / 16}rem`;
  }

  return roundToPixel(moderateVerticalScale(lineHeight));
};

export const colors = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      return getThemeColors()[prop];
    },
    ownKeys() {
      return Reflect.ownKeys(getThemeColors());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Object.getOwnPropertyDescriptor(getThemeColors(), prop);
      if (descriptor) {
        descriptor.configurable = true;
      }
      return descriptor;
    },
  }
);

export const spacing = {
  xxs: roundToPixel(moderateScale(4)),
  xs: roundToPixel(moderateScale(8)),
  sm: roundToPixel(moderateScale(12)),
  md: roundToPixel(moderateScale(16)),
  lg: roundToPixel(moderateScale(20)),
  xl: roundToPixel(moderateScale(24)),
  xxl: roundToPixel(moderateScale(32)),
};

export const radius = {
  xs: roundToPixel(moderateScale(8)),
  sm: roundToPixel(moderateScale(10)),
  md: roundToPixel(moderateScale(12)),
  lg: roundToPixel(moderateScale(14)),
  xl: roundToPixel(moderateScale(18)),
};

export const typography = {
  title: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(20), // Standardized header font size: 20
    lineHeight: getLineHeight(26),
    fontWeight: '700', // Bold for highlight headers
  },
  titleSmall: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(18), // Standardized subheading font size: 18
    lineHeight: getLineHeight(24),
    fontWeight: '700', // Bold
  },
  subtitle: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(18), // Standardized subheading font size: 18
    lineHeight: getLineHeight(24),
    fontWeight: '400', // Normal text
  },
  body: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(16), // Standardized paragraph/body font size: 16
    lineHeight: getLineHeight(22),
    fontWeight: '400', // Normal text
  },
  bodySmall: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(14),
    lineHeight: getLineHeight(18),
    fontWeight: '400', // Normal text
  },
  button: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(16), // Standardized action button font size: 16
    lineHeight: getLineHeight(22),
    fontWeight: '600', // Semi-bold for highlight buttons
  },
};

export const accessibility = {
  minTouchTarget: roundToPixel(moderateScale(48)),
  focusRingWidth: roundToPixel(moderateScale(2)),
};

export { moderateScale, moderateVerticalScale, roundToPixel };
