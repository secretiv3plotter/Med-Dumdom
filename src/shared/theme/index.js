import { moderateScale, moderateVerticalScale, roundToPixel } from './scaling';

export const colors = {
  // High-contrast neutrals and action colors for accessible defaults.
  pageBg: '#F3F6FA',
  surface: '#FFFFFF',
  title: '#111827',
  body: '#1F2937',
  bodyMuted: '#4B5563',
  brand: '#0B5FFF',
  brandSoft: '#E6F0FF',
  brandText: '#0A3D91',
  brandSubText: '#1E4F9A',
  border: '#D1D5DB',
  placeholder: '#6B7280',
  focusRing: '#0B5FFF',
  success: '#15803D',
  warning: '#B45309',
  error: '#B91C1C',
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
    fontSize: roundToPixel(moderateScale(28)),
    lineHeight: roundToPixel(moderateVerticalScale(36)),
    fontWeight: '700',
  },
  titleSmall: {
    fontSize: roundToPixel(moderateScale(22)),
    lineHeight: roundToPixel(moderateVerticalScale(30)),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: roundToPixel(moderateScale(16)),
    lineHeight: roundToPixel(moderateVerticalScale(24)),
    fontWeight: '400',
  },
  body: {
    fontSize: roundToPixel(moderateScale(16)),
    lineHeight: roundToPixel(moderateVerticalScale(24)),
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: roundToPixel(moderateScale(14)),
    lineHeight: roundToPixel(moderateVerticalScale(20)),
    fontWeight: '400',
  },
  button: {
    fontSize: roundToPixel(moderateScale(16)),
    lineHeight: roundToPixel(moderateVerticalScale(24)),
    fontWeight: '600',
  },
};

export const accessibility = {
  minTouchTarget: roundToPixel(moderateScale(48)),
  focusRingWidth: roundToPixel(moderateScale(2)),
};

export { moderateScale, moderateVerticalScale, roundToPixel };
