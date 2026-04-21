// ProgressReportService
// Role:
// Own report generation and export logic for progress reporting.
// This service should aggregate medication and appointment data into summaries
// for days, weeks, months, or years.
//
// What belongs here:
// - build report data from medication and appointment trackers
// - compute adherence and completion summaries
// - filter reports by date range
// - prepare export payloads
// - generate report previews for the UI
//
// Use cases covered:
// - patient manages progress report
// - patient exports progress report
//
// What should NOT belong here:
// - file system write logic unless wrapped in a separate export adapter
// - Realm schema definitions
// - chart rendering or report UI layout
// - notification delivery
//
// Suggested service methods:
// - generateReport(userId, range)
// - getReportSummary(userId, range)
// - getMedicationReportSection(userId, range)
// - getAppointmentReportSection(userId, range)
// - exportReport(userId, range, format)
// - getAvailableReportRanges()
//
// Model methods this service should wrap:
// - updateTitle(newTitle)
// - updateSubtitle(newSubtitle)
// - updateSummary(newSummary)
// - updateDetails(newDetails)
// - updateDateRange(startDate, endDate)
// - updateGeneratedAt(generatedAt)
// - setMedEntries(medEntries)
// - setApptEntries(apptEntries)
// - addMedEntry(medEntry)
// - addApptEntry(apptEntry)
// - getDateRange()
// - isWithinReportRange(dateValue)
// - getMedEntriesInRange()
// - getApptEntriesInRange()
// - getMedicationStats()
// - getAppointmentStats()
// - getReportSnapshot()
//
// Notes:
// - this service should work with MedEntryModel and ApptEntryModel data
// - export later can be adapted for PDF, CSV, or share-sheet output
//
// Dependencies:
// - direct dependencies: MedTrackerService, ApptTrackerService
// - commonly used by: progress report screen, export flow

import ProgressReport from '../models/ProgressReportModel';

const DEFAULT_RANGE_KEY = 'month';
const SUPPORTED_RANGE_DEFINITIONS = Object.freeze({
  day: { key: 'day', label: 'Today', dayCount: 1 },
  week: { key: 'week', label: 'Last 7 Days', dayCount: 7 },
  month: { key: 'month', label: 'Last 30 Days', dayCount: 30 },
  year: { key: 'year', label: 'Last 365 Days', dayCount: 365 },
});
const SUPPORTED_EXPORT_FORMATS = new Set(['json', 'csv', 'object']);

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const normalizeUserId = (userId) => {
  if (typeof userId === 'string') {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      throw new RangeError('userId cannot be empty.');
    }
    return trimmedUserId;
  }

  if (typeof userId === 'number' && Number.isFinite(userId)) {
    return String(userId);
  }

  throw new TypeError('userId must be a non-empty string or a finite number.');
};

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new RangeError(`${fieldName} is required.`);
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const startOfDay = (dateValue) => {
  const result = new Date(dateValue.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (dateValue) => {
  const result = new Date(dateValue.getTime());
  result.setHours(23, 59, 59, 999);
  return result;
};

const formatDateRangeLabel = (startDate, endDate) => {
  return `${dateFormatter.format(startDate)} - ${dateFormatter.format(endDate)}`;
};

const getPresetRange = (rangeKey, now = new Date()) => {
  const normalizedKey = typeof rangeKey === 'string' ? rangeKey.trim().toLowerCase() : '';
  const rangeDefinition = SUPPORTED_RANGE_DEFINITIONS[normalizedKey];
  if (!rangeDefinition) {
    throw new RangeError(`Unsupported report range: ${rangeKey}.`);
  }

  const endDate = endOfDay(now);
  const startDate = startOfDay(now);
  startDate.setDate(startDate.getDate() - (rangeDefinition.dayCount - 1));

  return {
    key: normalizedKey,
    label: rangeDefinition.label,
    startDate,
    endDate,
  };
};

const normalizeRange = (range, now = new Date()) => {
  if (range === undefined || range === null || range === '') {
    return getPresetRange(DEFAULT_RANGE_KEY, now);
  }

  if (typeof range === 'string') {
    return getPresetRange(range, now);
  }

  if (!range || typeof range !== 'object' || Array.isArray(range)) {
    throw new TypeError('range must be a supported string preset or an object.');
  }

  const hasStartDate = Object.prototype.hasOwnProperty.call(range, 'startDate');
  const hasEndDate = Object.prototype.hasOwnProperty.call(range, 'endDate');
  const rangeKey = range.preset ?? range.key ?? null;
  const presetRange = rangeKey ? getPresetRange(rangeKey, now) : getPresetRange(DEFAULT_RANGE_KEY, now);

  const startDate = hasStartDate
    ? startOfDay(normalizeDate(range.startDate, 'range.startDate'))
    : presetRange.startDate;
  const endDate = hasEndDate
    ? endOfDay(normalizeDate(range.endDate, 'range.endDate'))
    : presetRange.endDate;

  if (startDate.getTime() > endDate.getTime()) {
    throw new RangeError('range.startDate must be the same as or earlier than range.endDate.');
  }

  const label = typeof range.label === 'string' && range.label.trim() ? range.label.trim() : presetRange.label;
  const key = typeof range.key === 'string' && range.key.trim() ? range.key.trim().toLowerCase() : presetRange.key;

  return {
    key,
    label,
    startDate,
    endDate,
  };
};

const normalizeExportFormat = (format) => {
  if (format === undefined || format === null || format === '') {
    return 'json';
  }

  if (typeof format !== 'string') {
    throw new TypeError('format must be a string.');
  }

  const normalizedFormat = format.trim().toLowerCase();
  if (!SUPPORTED_EXPORT_FORMATS.has(normalizedFormat)) {
    throw new RangeError(`Unsupported export format: ${format}.`);
  }

  return normalizedFormat;
};

const toSerializable = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item));
  }

  if (value && typeof value === 'object') {
    const serialized = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      serialized[key] = toSerializable(nestedValue);
    });
    return serialized;
  }

  return value;
};

const csvEscape = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  const rawValue = Array.isArray(value)
    ? value.join('|')
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  if (/[",\n]/.test(rawValue)) {
    return `"${rawValue.replace(/"/g, '""')}"`;
  }

  return rawValue;
};

const ensureEntryArray = (entries, fieldName) => {
  if (!Array.isArray(entries)) {
    throw new TypeError(`${fieldName} must be an array.`);
  }

  return [...entries];
};

const resolveTrackerEntries = (service, methodNames, userId) => {
  if (!service || typeof service !== 'object') {
    return null;
  }

  for (const methodName of methodNames) {
    const method = service[methodName];
    if (typeof method !== 'function') {
      continue;
    }

    const result = method.call(service, userId);
    if (result && typeof result.then === 'function') {
      throw new TypeError(`${methodName} must return an array synchronously.`);
    }

    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === 'object') {
      if (Array.isArray(result.entries)) {
        return result.entries;
      }
      if (Array.isArray(result.data)) {
        return result.data;
      }
    }
  }

  return null;
};

const buildMedicationSummary = (medicationStats) => {
  const { totalScheduledDoses, totalTakenDoses, adherenceRate } = medicationStats;
  if (totalScheduledDoses === 0) {
    return 'No scheduled medication doses in this range.';
  }

  return `Medication adherence is ${adherenceRate}% (${totalTakenDoses}/${totalScheduledDoses} doses taken).`;
};

const buildAppointmentSummary = (appointmentStats) => {
  const { totalAppointments, completedAppointments, upcomingAppointments } = appointmentStats;
  if (totalAppointments === 0) {
    return 'No appointments in this range.';
  }

  return `${completedAppointments}/${totalAppointments} appointments completed, ${upcomingAppointments} upcoming.`;
};

export class ProgressReportService {
  constructor({
    medTrackerService = null,
    apptTrackerService = null,
    initialMedEntriesByUserId = null,
    initialApptEntriesByUserId = null,
  } = {}) {
    this.medTrackerService = medTrackerService;
    this.apptTrackerService = apptTrackerService;
    this.medEntriesByUserId = new Map();
    this.apptEntriesByUserId = new Map();
    this.reportsByUserId = new Map();

    this._hydrateEntryMap(initialMedEntriesByUserId, this.medEntriesByUserId, 'initialMedEntriesByUserId');
    this._hydrateEntryMap(initialApptEntriesByUserId, this.apptEntriesByUserId, 'initialApptEntriesByUserId');
  }

  setMedEntries(userId, medEntries) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedEntries = ensureEntryArray(medEntries, 'medEntries');
    this.medEntriesByUserId.set(normalizedUserId, normalizedEntries);

    const existingReport = this.reportsByUserId.get(normalizedUserId);
    if (existingReport) {
      return existingReport.setMedEntries(normalizedEntries);
    }

    return [...normalizedEntries];
  }

  setApptEntries(userId, apptEntries) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedEntries = ensureEntryArray(apptEntries, 'apptEntries');
    this.apptEntriesByUserId.set(normalizedUserId, normalizedEntries);

    const existingReport = this.reportsByUserId.get(normalizedUserId);
    if (existingReport) {
      return existingReport.setApptEntries(normalizedEntries);
    }

    return [...normalizedEntries];
  }

  updateTitle(userId, newTitle) {
    const report = this._getOrCreateReport(userId);
    return report.updateTitle(newTitle);
  }

  updateSubtitle(userId, newSubtitle) {
    const report = this._getOrCreateReport(userId);
    return report.updateSubtitle(newSubtitle);
  }

  updateSummary(userId, newSummary) {
    const report = this._getOrCreateReport(userId);
    return report.updateSummary(newSummary);
  }

  updateDetails(userId, newDetails) {
    const report = this._getOrCreateReport(userId);
    return report.updateDetails(newDetails);
  }

  updateDateRange(userId, startDate, endDate) {
    const report = this._getOrCreateReport(userId);
    return report.updateDateRange(startDate, endDate);
  }

  updateGeneratedAt(userId, generatedAt = new Date()) {
    const report = this._getOrCreateReport(userId);
    return report.updateGeneratedAt(generatedAt);
  }

  addMedEntry(userId, medEntry) {
    const report = this._getOrCreateReport(userId);
    const updatedEntries = report.addMedEntry(medEntry);
    this.medEntriesByUserId.set(normalizeUserId(userId), [...report.medEntries]);
    return updatedEntries;
  }

  addApptEntry(userId, apptEntry) {
    const report = this._getOrCreateReport(userId);
    const updatedEntries = report.addApptEntry(apptEntry);
    this.apptEntriesByUserId.set(normalizeUserId(userId), [...report.apptEntries]);
    return updatedEntries;
  }

  getDateRange(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getDateRange();
  }

  isWithinReportRange(userId, dateValue) {
    const report = this._getOrCreateReport(userId);
    return report.isWithinReportRange(dateValue);
  }

  getMedEntriesInRange(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getMedEntriesInRange();
  }

  getApptEntriesInRange(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getApptEntriesInRange();
  }

  getMedicationStats(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getMedicationStats();
  }

  getAppointmentStats(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getAppointmentStats();
  }

  getReportSnapshot(userId) {
    const report = this._getOrCreateReport(userId);
    return report.getReportSnapshot();
  }

  generateReport(userId, range = DEFAULT_RANGE_KEY) {
    const normalizedUserId = normalizeUserId(userId);
    const resolvedRange = normalizeRange(range);
    const report = this._createReportForRange(normalizedUserId, resolvedRange);

    const snapshot = report.getReportSnapshot();
    this.reportsByUserId.set(normalizedUserId, report);
    return snapshot;
  }

  getReportSummary(userId, range = DEFAULT_RANGE_KEY) {
    const snapshot = this.generateReport(userId, range);

    return {
      reportId: snapshot.reportId,
      title: snapshot.title,
      subtitle: snapshot.subtitle,
      generatedAt: snapshot.generatedAt,
      startDate: snapshot.startDate,
      endDate: snapshot.endDate,
      medicationStats: snapshot.medicationStats,
      appointmentStats: snapshot.appointmentStats,
      summary: snapshot.summary,
    };
  }

  getMedicationReportSection(userId, range = DEFAULT_RANGE_KEY) {
    const snapshot = this.generateReport(userId, range);

    return {
      title: 'Medication Summary',
      stats: snapshot.medicationStats,
      entries: [...snapshot.medEntries],
    };
  }

  getAppointmentReportSection(userId, range = DEFAULT_RANGE_KEY) {
    const snapshot = this.generateReport(userId, range);

    return {
      title: 'Appointment Summary',
      stats: snapshot.appointmentStats,
      entries: [...snapshot.apptEntries],
    };
  }

  exportReport(userId, range = DEFAULT_RANGE_KEY, format = 'json') {
    const snapshot = this.generateReport(userId, range);
    const normalizedFormat = normalizeExportFormat(format);
    const payload = toSerializable(snapshot);

    if (normalizedFormat === 'object') {
      return payload;
    }

    if (normalizedFormat === 'json') {
      return JSON.stringify(payload, null, 2);
    }

    return this._toCsv(payload);
  }

  getAvailableReportRanges() {
    return Object.values(SUPPORTED_RANGE_DEFINITIONS).map(({ key, label, dayCount }) => ({
      key,
      label,
      dayCount,
    }));
  }

  _getOrCreateReport(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const existingReport = this.reportsByUserId.get(normalizedUserId);
    if (existingReport) {
      return existingReport;
    }

    const defaultRange = normalizeRange(DEFAULT_RANGE_KEY);
    const report = this._createReportForRange(normalizedUserId, defaultRange);
    this.reportsByUserId.set(normalizedUserId, report);
    return report;
  }

  _createReportForRange(userId, resolvedRange) {
    const medEntries = this._getMedEntries(userId);
    const apptEntries = this._getApptEntries(userId);

    const report = new ProgressReport({
      reportId: this._buildReportId(userId, resolvedRange.key),
      title: 'Progress Report',
      subtitle: formatDateRangeLabel(resolvedRange.startDate, resolvedRange.endDate),
      startDate: resolvedRange.startDate,
      endDate: resolvedRange.endDate,
      generatedAt: new Date(),
      medEntries,
      apptEntries,
    });

    this._updateReportNarrative(report, resolvedRange);
    return report;
  }

  _updateReportNarrative(report, resolvedRange) {
    const initialSnapshot = report.getReportSnapshot();
    report.updateSummary(
      `${buildMedicationSummary(initialSnapshot.medicationStats)} ${buildAppointmentSummary(initialSnapshot.appointmentStats)}`
    );
    report.updateDetails(
      `Range: ${formatDateRangeLabel(resolvedRange.startDate, resolvedRange.endDate)}. ` +
        `Medication entries: ${initialSnapshot.medicationStats.totalMedEntries}. ` +
        `Appointments: ${initialSnapshot.appointmentStats.totalAppointments}.`
    );
  }

  _getMedEntries(userId) {
    const trackerEntries = resolveTrackerEntries(this.medTrackerService, ['listMedEntries', 'getMedEntries'], userId);
    if (trackerEntries) {
      const normalizedEntries = ensureEntryArray(trackerEntries, 'medTrackerEntries');
      this.medEntriesByUserId.set(userId, normalizedEntries);
      return [...normalizedEntries];
    }

    const storedEntries = this.medEntriesByUserId.get(userId);
    return storedEntries ? [...storedEntries] : [];
  }

  _getApptEntries(userId) {
    const trackerEntries = resolveTrackerEntries(
      this.apptTrackerService,
      ['listApptEntries', 'getApptEntries'],
      userId
    );
    if (trackerEntries) {
      const normalizedEntries = ensureEntryArray(trackerEntries, 'apptTrackerEntries');
      this.apptEntriesByUserId.set(userId, normalizedEntries);
      return [...normalizedEntries];
    }

    const storedEntries = this.apptEntriesByUserId.get(userId);
    return storedEntries ? [...storedEntries] : [];
  }

  _hydrateEntryMap(source, targetMap, fieldName) {
    if (!source) {
      return;
    }

    if (source instanceof Map) {
      source.forEach((entries, userId) => {
        targetMap.set(normalizeUserId(userId), ensureEntryArray(entries, `${fieldName} map values`));
      });
      return;
    }

    if (typeof source === 'object' && !Array.isArray(source)) {
      Object.entries(source).forEach(([userId, entries]) => {
        targetMap.set(normalizeUserId(userId), ensureEntryArray(entries, `${fieldName} object values`));
      });
      return;
    }

    throw new TypeError(`${fieldName} must be a Map or plain object.`);
  }

  _buildReportId(userId, rangeKey) {
    return `${userId}-${rangeKey}-${Date.now()}`;
  }

  _toCsv(payload) {
    const medStats = payload.medicationStats || {};
    const apptStats = payload.appointmentStats || {};
    const medEntries = Array.isArray(payload.medEntries) ? payload.medEntries : [];
    const apptEntries = Array.isArray(payload.apptEntries) ? payload.apptEntries : [];

    const lines = [
      'section,key,value',
      `meta,reportId,${csvEscape(payload.reportId)}`,
      `meta,title,${csvEscape(payload.title)}`,
      `meta,subtitle,${csvEscape(payload.subtitle)}`,
      `meta,generatedAt,${csvEscape(payload.generatedAt)}`,
      `meta,startDate,${csvEscape(payload.startDate)}`,
      `meta,endDate,${csvEscape(payload.endDate)}`,
      `meta,summary,${csvEscape(payload.summary)}`,
      `meta,details,${csvEscape(payload.details)}`,
      `medicationStats,totalMedEntries,${csvEscape(medStats.totalMedEntries)}`,
      `medicationStats,totalScheduledDoses,${csvEscape(medStats.totalScheduledDoses)}`,
      `medicationStats,totalTakenDoses,${csvEscape(medStats.totalTakenDoses)}`,
      `medicationStats,adherenceRate,${csvEscape(medStats.adherenceRate)}`,
      `appointmentStats,totalAppointments,${csvEscape(apptStats.totalAppointments)}`,
      `appointmentStats,completedAppointments,${csvEscape(apptStats.completedAppointments)}`,
      `appointmentStats,upcomingAppointments,${csvEscape(apptStats.upcomingAppointments)}`,
      'medEntries,medEntryId,medName,dosage,amount,quantityUnit,dailySched,startDate,endDate,isTaken,timeTaken,dateTaken,timesTaken',
    ];

    medEntries.forEach((entry) => {
      lines.push(
        [
          'medEntries',
          csvEscape(entry.medEntryId),
          csvEscape(entry.medName),
          csvEscape(entry.dosage),
          csvEscape(entry.amount),
          csvEscape(entry.quantityUnit),
          csvEscape(entry.dailySched),
          csvEscape(entry.startDate),
          csvEscape(entry.endDate),
          csvEscape(entry.isTaken),
          csvEscape(entry.timeTaken),
          csvEscape(entry.dateTaken),
          csvEscape(entry.timesTaken),
        ].join(',')
      );
    });

    lines.push('apptEntries,apptEntryId,concern,address,contactNumber,timeSched,dateSched,isCompleted,timeCompleted,dateCompleted,completedAt,note');
    apptEntries.forEach((entry) => {
      lines.push(
        [
          'apptEntries',
          csvEscape(entry.apptEntryId),
          csvEscape(entry.concern),
          csvEscape(entry.address),
          csvEscape(entry.contactNumber),
          csvEscape(entry.timeSched),
          csvEscape(entry.dateSched),
          csvEscape(entry.isCompleted),
          csvEscape(entry.timeCompleted),
          csvEscape(entry.dateCompleted),
          csvEscape(entry.completedAt),
          csvEscape(entry.note),
        ].join(',')
      );
    });

    return `${lines.join('\n')}\n`;
  }
}

const progressReportService = new ProgressReportService();

export default progressReportService;
