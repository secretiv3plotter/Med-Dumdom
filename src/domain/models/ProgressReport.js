import MedEntry from './MedEntry';
import ApptEntry from './ApptEntry';

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const startOfDay = (value) => {
  const parsedDate = normalizeDate(value, 'date');

  if (!parsedDate) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const isWithinRange = (dateValue, startDate, endDate) => {
  const targetDay = startOfDay(dateValue);
  if (!targetDay) {
    return false;
  }

  const startDay = startOfDay(startDate);
  const endDay = startOfDay(endDate);

  if (startDay && targetDay < startDay) {
    return false;
  }

  if (endDay && targetDay > endDay) {
    return false;
  }

  return true;
};

const getOverlapRange = (firstStart, firstEnd, secondStart, secondEnd) => {
  const startCandidates = [startOfDay(firstStart), startOfDay(secondStart)].filter(Boolean);
  const endCandidates = [startOfDay(firstEnd), startOfDay(secondEnd)].filter(Boolean);

  const overlapStart = startCandidates.length
    ? new Date(Math.max(...startCandidates.map((date) => date.getTime())))
    : null;
  const overlapEnd = endCandidates.length
    ? new Date(Math.min(...endCandidates.map((date) => date.getTime())))
    : null;

  if (!overlapStart || !overlapEnd || overlapStart.getTime() > overlapEnd.getTime()) {
    return null;
  }

  return {
    startDate: overlapStart,
    endDate: overlapEnd,
  };
};

const getInclusiveDayCount = (startDate, endDate) => {
  const startDay = startOfDay(startDate);
  const endDay = startOfDay(endDate);

  if (!startDay || !endDay || startDay.getTime() > endDay.getTime()) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDay.getTime() - startDay.getTime()) / millisecondsPerDay) + 1;
};

const ensureArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an array.`);
  }

  return value;
};

const coerceMedEntry = (value) => {
  if (value instanceof MedEntry) {
    return value;
  }

  return new MedEntry(value);
};

const coerceApptEntry = (value) => {
  if (value instanceof ApptEntry) {
    return value;
  }

  return new ApptEntry(value);
};

const countCompletedMedications = (medEntry) => {
  if (!(medEntry instanceof MedEntry)) {
    return 0;
  }

  if (!medEntry.isTaken) {
    return 0;
  }

  return Array.isArray(medEntry.timesTaken) && medEntry.timesTaken.length ? medEntry.timesTaken.length : 1;
};

const countScheduledMedications = (medEntry) => {
  if (!(medEntry instanceof MedEntry)) {
    return 0;
  }

  return Array.isArray(medEntry.dailySched) ? medEntry.dailySched.length : 0;
};

const hasDateOverlap = (startDate, endDate, reportStart, reportEnd) => {
  return Boolean(getOverlapRange(startDate, endDate, reportStart, reportEnd));
};

export default class ProgressReport {
  constructor({
    reportId = '',
    title = '',
    subtitle = '',
    summary = '',
    details = '',
    startDate = null,
    endDate = null,
    generatedAt = new Date(),
    medEntries = [],
    apptEntries = [],
  } = {}) {
    this.reportId = reportId === undefined || reportId === null ? '' : String(reportId).trim();
    this.title = normalizeOptionalString(title, 'title');
    this.subtitle = normalizeOptionalString(subtitle, 'subtitle');
    this.summary = normalizeOptionalString(summary, 'summary');
    this.details = normalizeOptionalString(details, 'details');
    this.startDate = normalizeDate(startDate, 'startDate');
    this.endDate = normalizeDate(endDate, 'endDate');
    this.generatedAt = normalizeDate(generatedAt, 'generatedAt') ?? new Date();
    this.medEntries = ensureArray(medEntries, 'medEntries').map(coerceMedEntry);
    this.apptEntries = ensureArray(apptEntries, 'apptEntries').map(coerceApptEntry);

    if (this.startDate && this.endDate && this.startDate.getTime() > this.endDate.getTime()) {
      throw new RangeError('endDate must be the same as or later than startDate.');
    }
  }

  updateTitle(newTitle) {
    this.title = normalizeOptionalString(newTitle, 'title');
    return this.title;
  }

  updateSubtitle(newSubtitle) {
    this.subtitle = normalizeOptionalString(newSubtitle, 'subtitle');
    return this.subtitle;
  }

  updateSummary(newSummary) {
    this.summary = normalizeOptionalString(newSummary, 'summary');
    return this.summary;
  }

  updateDetails(newDetails) {
    this.details = normalizeOptionalString(newDetails, 'details');
    return this.details;
  }

  updateDateRange(startDate, endDate) {
    const nextStartDate = normalizeDate(startDate, 'startDate');
    const nextEndDate = normalizeDate(endDate, 'endDate');

    if (nextStartDate && nextEndDate && nextStartDate.getTime() > nextEndDate.getTime()) {
      throw new RangeError('endDate must be the same as or later than startDate.');
    }

    this.startDate = nextStartDate;
    this.endDate = nextEndDate;
    return this.getDateRange();
  }

  updateGeneratedAt(generatedAt = new Date()) {
    this.generatedAt = normalizeDate(generatedAt, 'generatedAt') ?? new Date();
    return this.generatedAt;
  }

  setMedEntries(medEntries) {
    this.medEntries = ensureArray(medEntries, 'medEntries').map(coerceMedEntry);
    return [...this.medEntries];
  }

  setApptEntries(apptEntries) {
    this.apptEntries = ensureArray(apptEntries, 'apptEntries').map(coerceApptEntry);
    return [...this.apptEntries];
  }

  addMedEntry(medEntry) {
    this.medEntries.push(coerceMedEntry(medEntry));
    return [...this.medEntries];
  }

  addApptEntry(apptEntry) {
    this.apptEntries.push(coerceApptEntry(apptEntry));
    return [...this.apptEntries];
  }

  getDateRange() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  isWithinReportRange(dateValue) {
    return isWithinRange(dateValue, this.startDate, this.endDate);
  }

  getMedEntriesInRange() {
    return this.medEntries.filter((medEntry) => {
      if (!(medEntry instanceof MedEntry)) {
        return false;
      }

      return hasDateOverlap(medEntry.startDate, medEntry.endDate, this.startDate, this.endDate);
    });
  }

  getApptEntriesInRange() {
    return this.apptEntries.filter((apptEntry) => {
      if (!(apptEntry instanceof ApptEntry)) {
        return false;
      }

      return this.isWithinReportRange(apptEntry.dateSched || this.generatedAt);
    });
  }

  getMedicationStats() {
    const medEntries = this.getMedEntriesInRange();
    const totalMedEntries = medEntries.length;
    const totalScheduledDoses = medEntries.reduce((total, medEntry) => {
      const overlapRange = getOverlapRange(
        medEntry.startDate,
        medEntry.endDate,
        this.startDate ?? medEntry.startDate,
        this.endDate ?? medEntry.endDate
      );

      if (!overlapRange) {
        return total;
      }

      return total + countScheduledMedications(medEntry) * getInclusiveDayCount(overlapRange.startDate, overlapRange.endDate);
    }, 0);
    const totalTakenDoses = medEntries.reduce((total, medEntry) => {
      return total + countCompletedMedications(medEntry);
    }, 0);
    const adherenceRate =
      totalScheduledDoses > 0 ? Math.round((totalTakenDoses / totalScheduledDoses) * 100) : 0;

    return {
      totalMedEntries,
      totalScheduledDoses,
      totalTakenDoses,
      adherenceRate,
    };
  }

  getAppointmentStats() {
    const apptEntries = this.getApptEntriesInRange();
    const totalAppointments = apptEntries.length;
    const completedAppointments = apptEntries.filter(
      (apptEntry) => apptEntry instanceof ApptEntry && apptEntry.isCompleted
    ).length;
    const upcomingAppointments = totalAppointments - completedAppointments;

    return {
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
    };
  }

  getReportSnapshot() {
    const medicationStats = this.getMedicationStats();
    const appointmentStats = this.getAppointmentStats();

    return {
      reportId: this.reportId,
      title: this.title,
      subtitle: this.subtitle,
      summary: this.summary,
      details: this.details,
      generatedAt: this.generatedAt,
      startDate: this.startDate,
      endDate: this.endDate,
      medicationStats,
      appointmentStats,
      medEntries: [...this.getMedEntriesInRange()],
      apptEntries: [...this.getApptEntriesInRange()],
    };
  }
}
