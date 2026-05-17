import { colors } from '../../../shared/theme';
import { getThemeMode, THEME_MODE_DARK } from '../../../shared/theme/palette';

const isDarkMode = () => getThemeMode() === THEME_MODE_DARK;

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const EMPTY_APPT_FORM = {
  concern: '',
  address: '',
  doctorName: '',
  contactNumber: '',
  dateSched: '',
  timeSched: '',
  note: '',
};

export const parseDateTime = (dateSched, timeSched) => {
  const parsed = new Date(`${dateSched}T${timeSched}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeSearchText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\bskip+p?ed\b/g, 'missed skipped skip')
  .replace(/\bskips?\b/g, 'missed skipped skip')
  .replace(/\bmiss(?:ed|es)?\b/g, 'missed skipped skip');

export const formatDate = (dateString) => {
  if (!dateString) {
    return '--';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (timeString) => {
  if (!timeString) {
    return '--';
  }

  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatIsoDateTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatIsoTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getApptStatusStyle = (appointment, now = new Date()) => {
  const status = typeof appointment.getStatus === 'function'
    ? appointment.getStatus(now, now)
    : 'upcoming';

  if (isDarkMode()) {
    if (status === 'completed' || status === 'due') {
      return { status, label: status === 'due' ? 'Due now' : 'Completed', bgColor: '#0F2A1B', textColor: '#86EFAC' };
    }

    if (status === 'skipped') {
      return { status, label: 'Skipped', bgColor: colors.surface, textColor: colors.body };
    }

    if (status === 'missed') {
      return { status, label: 'Missed', bgColor: '#2A1111', textColor: colors.error };
    }

    if (status === 'pending') {
      return { status, label: 'Pending', bgColor: '#2C2412', textColor: colors.warning };
    }

    return { status, label: 'Upcoming', bgColor: colors.surface, textColor: colors.body };
  }

  // Accessible color palette conforming to WCAG AA contrast ratio requirements
  if (status === 'completed') {
    return { status, label: 'Completed', bgColor: '#D1FAE5', textColor: '#064E3B' }; // Soft green background on deep green text
  }

  if (status === 'skipped') {
    return { status, label: 'Skipped', bgColor: '#F3F4F6', textColor: '#374151' }; // Soft neutral gray on charcoal text
  }

  if (status === 'missed') {
    return { status, label: 'Missed', bgColor: '#FEE2E2', textColor: '#991B1B' }; // Softer red on dark burgundy text
  }

  if (status === 'pending') {
    return { status, label: 'Pending', bgColor: '#FEF3C7', textColor: '#78350F' }; // Soft amber on deep warm amber text
  }

  if (status === 'due') {
    return { status, label: 'Due now', bgColor: '#D1FAE5', textColor: '#064E3B' }; // Mint green on dark forest green text
  }

  return { status, label: 'Upcoming', bgColor: colors.surface, textColor: '#374151' };
};

export const buildApptSearchText = (appointment) => [
  appointment.concern,
  appointment.address,
  appointment.doctorName,
  appointment.contactNumber,
  appointment.dateSched,
  formatDate(appointment.dateSched),
  formatTime(appointment.timeSched),
  appointment.note,
  getApptStatusStyle(appointment).label,
].filter((value) => value !== undefined && value !== null).map(normalizeSearchText).join(' ');

export const buildFormStateFromAppointment = (appointment) => ({
  concern: appointment.concern || '',
  address: appointment.address || '',
  doctorName: appointment.doctorName || '',
  contactNumber: appointment.contactNumber || '',
  dateSched: appointment.dateSched || '',
  timeSched: appointment.timeSched || '',
  note: appointment.note || '',
});

export const getSortTime = (appointment) =>
  parseDateTime(appointment.dateSched, appointment.timeSched)?.getTime() || 0;
