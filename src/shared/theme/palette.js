export const THEME_MODE_LIGHT = 'light';
export const THEME_MODE_DARK = 'dark';

export const LIGHT_COLORS = Object.freeze({
  pageBg: '#F8FAFC',
  surface: '#FFFFFF',
  title: '#0F172A',
  body: '#334155',
  bodyMuted: '#475569',
  brand: '#0284C7',
  brandSoft: '#F0F9FF',
  brandText: '#0369A1',
  brandSubText: '#075985',
  border: '#64748B',
  placeholder: '#64748B',
  focusRing: '#0284C7',
  success: '#166534',
  warning: '#9A3412',
  error: '#991B1B',
});

export const DARK_COLORS = Object.freeze({
  pageBg: '#0F172A',
  surface: '#111827',
  title: '#F8FAFC',
  body: '#CBD5E1',
  bodyMuted: '#94A3B8',
  brand: '#38BDF8',
  brandSoft: '#0B1220',
  brandText: '#7DD3FC',
  brandSubText: '#BAE6FD',
  border: '#334155',
  placeholder: '#94A3B8',
  focusRing: '#38BDF8',
  success: '#4ADE80',
  warning: '#FB923C',
  error: '#F87171',
});

const COLOR_BLIND_COLOR_OVERRIDES = Object.freeze({
  light: {
    success: '#0072B2',
    warning: '#8B5CF6',
    error: '#D55E00',
  },
  dark: {
    success: '#56B4E9',
    warning: '#C084FC',
    error: '#D97706',
  },
});

const COLOR_BLIND_VALUE_MAP = Object.freeze({
  '#064E3B': '#1D4ED8',
  '#0F2A1B': '#0B1F3A',
  '#12301B': '#0B1F3A',
  '#15803D': '#0072B2',
  '#166534': '#0072B2',
  '#1B6B4A': '#0072B2',
  '#4ADE80': '#56B4E9',
  '#52B788': '#0072B2',
  '#86EFAC': '#56B4E9',
  '#B7E4C7': '#BFDBFE',
  '#D1FAE5': '#DBEAFE',
  '#D1FAE56C': '#DBEAFE6C',

  '#2A1111': '#2C1E12',
  '#991B1B': '#D55E00',
  '#B91C1C': '#C2410C',
  '#D32F2F': '#D55E00',
  '#F87171': '#D97706',
  '#FEE2E2': '#FFEDD5',
  '#FFEBEE': '#FFEDD5',
});

export const LIGHT_TO_DARK_COLOR_MAP = Object.freeze({
  '#000000': '#F8FAFC',
  '#0284C7': '#38BDF8',
  '#0369A1': '#7DD3FC',
  '#075985': '#BAE6FD',
  '#0F172A': '#F8FAFC',
  '#166534': '#4ADE80',
  '#1B6B4A': '#86EFAC',
  '#1E293B': '#E2E8F0',
  '#334155': '#CBD5E1',
  '#475569': '#94A3B8',
  '#64748B': '#94A3B8',
  '#991B1B': '#F87171',
  '#9A3412': '#FB923C',
  '#9CA3AF': '#94A3B8',
  '#52B788': '#86EFAC',
  '#C7DBFF': '#1E3A5F',
  '#C9D6EA': '#1E293B',
  '#CBD5E1': '#94A3B8',
  '#D1D5DB': '#374151',
  '#D1FAE5': '#0F2A1B',
  '#DBEAFE': '#0B1F3A',
  '#E2E8F0': '#1F2937',
  '#E5E7EB': '#1F2937',
  '#E8EFF1': '#0B1220',
  '#E8F7EF': '#0B1220',
  '#E9F8F1': '#0B1220',
  '#ECEFF4': '#0F172A',
  '#ECF3F6': '#0F172A',
  '#F0F9FF': '#0B1220',
  '#F1F5F9': '#111827',
  '#F3F4F6': '#1F2937',
  '#F4FAFF': '#0B1220',
  '#F8FAFC': '#0F172A',
  '#FEE2E2': '#2A1111',
  '#FEF3C7': '#2C2412',
  '#FED7AA': '#2C1E12',
  '#FFEBEE': '#2A1111',
  '#FFFFFF': '#111827',
  '#B7E4C7': '#12301B',
  '#B91C1C': '#F87171',
  '#BFDBFE': '#0B1F3A',
});

let currentThemeMode = THEME_MODE_LIGHT;
let currentColorBlindModeEnabled = false;

const FOREGROUND_COLOR_KEYS = new Set([
  'accentColor',
  'caretColor',
  'color',
  'placeholderTextColor',
  'textDecorationColor',
  'textShadowColor',
  'tintColor',
]);

const SURFACE_COLOR_KEYS = new Set([
  'backgroundColor',
  'borderBottomColor',
  'borderColor',
  'borderLeftColor',
  'borderRightColor',
  'borderTopColor',
  'shadowColor',
]);

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

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();

const mixColors = (left, right, weight = 0.5) => {
  const amount = Math.max(0, Math.min(1, weight));
  const inverse = 1 - amount;

  return rgbToHex({
    r: left.r * inverse + right.r * amount,
    g: left.g * inverse + right.g * amount,
    b: left.b * inverse + right.b * amount,
  });
};

const getRelativeLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const linearR = toLinear(r);
  const linearG = toLinear(g);
  const linearB = toLinear(b);

  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
};

const transformHexForDarkMode = (value, key) => {
  if (!isHexColor(value)) {
    return value;
  }

  const mapped = LIGHT_TO_DARK_COLOR_MAP[value.toUpperCase()];
  if (mapped) {
    return mapped;
  }

  const luminance = getRelativeLuminance(value);
  const rgb = hexToRgb(value);

  if (FOREGROUND_COLOR_KEYS.has(key)) {
    if (luminance >= 0.58) {
      return value;
    }

    return mixColors(rgb, hexToRgb(DARK_COLORS.title), 0.76);
  }

  if (SURFACE_COLOR_KEYS.has(key)) {
    if (luminance <= 0.24) {
      return value;
    }

    return mixColors(rgb, hexToRgb(DARK_COLORS.pageBg), 0.82);
  }

  if (luminance >= 0.72) {
    return mixColors(rgb, hexToRgb(DARK_COLORS.pageBg), 0.84);
  }

  if (luminance <= 0.35) {
    return mixColors(rgb, hexToRgb(DARK_COLORS.title), 0.62);
  }

  return mixColors(rgb, hexToRgb(DARK_COLORS.pageBg), 0.68);
};

export const normalizeThemeMode = (value) =>
  value === THEME_MODE_DARK ? THEME_MODE_DARK : THEME_MODE_LIGHT;

export const setThemeMode = (nextMode) => {
  currentThemeMode = normalizeThemeMode(nextMode);
  return currentThemeMode;
};

export const getThemeMode = () => currentThemeMode;

export const setColorBlindModeEnabled = (enabled) => {
  currentColorBlindModeEnabled = Boolean(enabled);
  return currentColorBlindModeEnabled;
};

export const getColorBlindModeEnabled = () => currentColorBlindModeEnabled;

export const getThemeColors = (mode = currentThemeMode) =>
  Object.freeze({
    ...(normalizeThemeMode(mode) === THEME_MODE_DARK ? DARK_COLORS : LIGHT_COLORS),
    ...(currentColorBlindModeEnabled
      ? COLOR_BLIND_COLOR_OVERRIDES[normalizeThemeMode(mode) === THEME_MODE_DARK ? 'dark' : 'light']
      : null),
  });

const transformColorBlindValue = (value) => {
  if (!currentColorBlindModeEnabled || typeof value !== 'string') {
    return value;
  }

  return COLOR_BLIND_VALUE_MAP[value.toUpperCase()] || value;
};

export const transformThemeValue = (value, mode = currentThemeMode, key = null) => {
  if (typeof value !== 'string') {
    return value;
  }

  let transformedValue = transformColorBlindValue(value);

  if (normalizeThemeMode(mode) === THEME_MODE_DARK) {
    if (LIGHT_TO_DARK_COLOR_MAP[transformedValue.toUpperCase()]) {
      transformedValue = LIGHT_TO_DARK_COLOR_MAP[transformedValue.toUpperCase()];
    } else if (isHexColor(transformedValue)) {
      transformedValue = transformHexForDarkMode(transformedValue, key);
    }
  }

  return transformColorBlindValue(transformedValue);
};
