import { Platform } from 'react-native';
import { moderateScale, moderateVerticalScale, roundToPixel } from './scaling';

// Dynamic typography scaling helpers to support 200% screen resizing compliance.
// Web utilizes relative 'rem' units to align with native browser font adjustments, 
// while Mobile leverages native device pixels alongside dynamic system font scaling.
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

export const colors = {
  // Ultra high-contrast neutrals and action colors satisfying WCAG AA standards.
  pageBg: '#F8FAFC',       // Clean, slate-tinted background
  surface: '#FFFFFF',      // Pure white surface
  title: '#0F172A',        // Dark slate-900 for ultra-crisp title headings (contrast ratio 15.0+)
  body: '#334155',         // Slate-700 for highly legible body copy (contrast ratio 6.0+)
  bodyMuted: '#475569',    // Slate-600 for subtext and captions (passes WCAG AA, contrast ratio 4.7+)
  brand: '#0284C7',        // Sky-600: Punchy, accessible brand blue (passes WCAG AA against white text)
  brandSoft: '#F0F9FF',    // Sky-50: Softer, clean light blue card tint
  brandText: '#0369A1',    // Sky-700: Dark blue active text highlights
  brandSubText: '#075985', // Sky-800: Strong dark blue text
  border: '#64748B',       // Slate-500: Deep slate-500 to guarantee 100% WCAG AA border compliance (contrast 4.0+)
  placeholder: '#64748B',  // Slate-500: Legible placeholder text (passes WCAG AA)
  focusRing: '#0284C7',    // Sky-600 active border rings
  success: '#166534',      // Deep forest green for positive states (high contrast)
  warning: '#9A3412',      // Warm rust amber for alert states (high contrast)
  error: '#991B1B',        // Rich crimson red for critical states (high contrast)
};

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
