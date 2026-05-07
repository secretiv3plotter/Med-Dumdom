import { colors } from '../../../shared/theme';

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

  if (status === 'completed') {
    return { status, label: 'Completed', bgColor: '#BFDBFE', textColor: '#1D4ED8' };
  }

  if (status === 'skipped') {
    return { status, label: 'Skipped', bgColor: '#E5E7EB', textColor: '#B91C1C' };
  }

  if (status === 'missed') {
    return { status, label: 'Missed', bgColor: '#FECACA', textColor: '#B91C1C' };
  }

  if (status === 'pending') {
    return { status, label: 'Pending', bgColor: '#FCD34D', textColor: '#92400E' };
  }

  if (status === 'due') {
    return { status, label: 'Due now', bgColor: '#BBF7D0', textColor: '#15803D' };
  }

  return { status, label: 'Upcoming', bgColor: colors.surface, textColor: '#854D0E' };
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
