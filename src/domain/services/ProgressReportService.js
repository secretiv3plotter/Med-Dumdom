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
import medTrackerService from './MedTrackerService';
import apptTrackerService from './ApptTrackerService';

const normalizeEntityId = (value, fieldName) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new RangeError(`${fieldName} cannot be empty.`);
    }

    return trimmedValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError(`${fieldName} must be a non-empty string or a finite number.`);
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

const endOfDay = (value) => {
  const parsedDate = normalizeDate(value, 'date');
  if (!parsedDate) {
    return null;
  }

  parsedDate.setHours(23, 59, 59, 999);
  return parsedDate;
};

const resolveRange = (range, now = new Date()) => {
  const currentDate = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(currentDate.getTime())) {
    throw new RangeError('now must be a valid date or datetime.');
  }

  if (!range) {
    return {
      preset: 'monthly',
      label: 'This month',
      startDate: startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)),
      endDate: endOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)),
    };
  }

  if (typeof range === 'string') {
    const preset = range.trim().toLowerCase();
    const today = startOfDay(currentDate);

    switch (preset) {
      case 'daily':
      case 'day':
        return { preset: 'daily', label: 'Today', startDate: today, endDate: endOfDay(today) };
      case 'weekly': {
        const start = startOfDay(new Date(currentDate));
        start.setDate(start.getDate() - start.getDay());
        const end = endOfDay(new Date(start));
        end.setDate(end.getDate() + 6);
        return { preset: 'weekly', label: 'This week', startDate: start, endDate: end };
      }
      case 'monthly':
      case 'month':
        return {
          preset: 'monthly',
          label: 'This month',
          startDate: startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)),
          endDate: endOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)),
        };
      case 'yearly':
      case 'year':
        return {
          preset: 'yearly',
          label: 'This year',
          startDate: startOfDay(new Date(currentDate.getFullYear(), 0, 1)),
          endDate: endOfDay(new Date(currentDate.getFullYear(), 11, 31)),
        };
      default:
        return { preset, label: preset || 'Custom range', startDate: null, endDate: null };
    }
  }

  if (typeof range !== 'object') {
    throw new TypeError('range must be an object, string, or null.');
  }

  const startDate = range.startDate ?? range.from ?? null;
  const endDate = range.endDate ?? range.to ?? null;
  return {
    preset: typeof range.preset === 'string' ? range.preset.trim().toLowerCase() : 'custom',
    label: range.label || 'Custom range',
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
  };
};

const rangeContains = (dateValue, range) => {
  const date = normalizeDate(dateValue, 'dateValue');
  if (!date) {
    return false;
  }

  if (range.startDate && date < range.startDate) {
    return false;
  }

  if (range.endDate && date > range.endDate) {
    return false;
  }

  return true;
};

const describeRange = (range) => {
  if (!range.startDate && !range.endDate) {
    return range.label || 'All time';
  }

  const start = range.startDate ? range.startDate.toISOString().slice(0, 10) : '...';
  const end = range.endDate ? range.endDate.toISOString().slice(0, 10) : '...';
  return `${range.label || 'Custom range'} (${start} to ${end})`;
};

const buildSummaryText = (medStats, apptStats) =>
  `Medication adherence: ${medStats.adherenceRate}%. Appointment completion: ${apptStats.completedAppointments}/${apptStats.totalAppointments}.`;

const buildDetailsText = (medStats, apptStats) =>
  [
    `Med entries: ${medStats.totalMedEntries}`,
    `Scheduled doses: ${medStats.totalScheduledDoses}`,
    `Taken doses: ${medStats.totalTakenDoses}`,
    `Appointments: ${apptStats.totalAppointments}`,
    `Completed appointments: ${apptStats.completedAppointments}`,
  ].join(' | ');

const toCsv = (snapshot) => {
  const rows = [
    ['field', 'value'],
    ['reportId', snapshot.reportId],
    ['title', snapshot.title],
    ['subtitle', snapshot.subtitle],
    ['summary', snapshot.summary],
    ['details', snapshot.details],
    ['generatedAt', snapshot.generatedAt?.toISOString?.() ?? ''],
    ['startDate', snapshot.startDate?.toISOString?.() ?? ''],
    ['endDate', snapshot.endDate?.toISOString?.() ?? ''],
    ['medication.totalMedEntries', snapshot.medicationStats.totalMedEntries],
    ['medication.totalScheduledDoses', snapshot.medicationStats.totalScheduledDoses],
    ['medication.totalTakenDoses', snapshot.medicationStats.totalTakenDoses],
    ['medication.adherenceRate', snapshot.medicationStats.adherenceRate],
    ['appointments.totalAppointments', snapshot.appointmentStats.totalAppointments],
    ['appointments.completedAppointments', snapshot.appointmentStats.completedAppointments],
    ['appointments.upcomingAppointments', snapshot.appointmentStats.upcomingAppointments],
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
};

export class ProgressReportService {
  constructor(options = {}) {
    this.medTrackerService = options.medTrackerService ?? medTrackerService;
    this.apptTrackerService = options.apptTrackerService ?? apptTrackerService;
    this.reportsByUserId = new Map();
    this.reportCounter = 0;
  }

  generateReport(userId, range = 'monthly') {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const resolvedRange = resolveRange(range, new Date());
    const medEntries = this._getMedEntriesForRange(normalizedUserId, resolvedRange);
    const apptEntries = this._getApptEntriesForRange(normalizedUserId, resolvedRange);
    const report = new ProgressReport({
      reportId: `${normalizedUserId}-report-${++this.reportCounter}`,
      title: 'Progress Report',
      subtitle: describeRange(resolvedRange),
      summary: '',
      details: '',
      startDate: resolvedRange.startDate,
      endDate: resolvedRange.endDate,
      generatedAt: new Date(),
      medEntries,
      apptEntries,
    });

    const medicationStats = report.getMedicationStats();
    const appointmentStats = report.getAppointmentStats();
    report.updateSummary(buildSummaryText(medicationStats, appointmentStats));
    report.updateDetails(buildDetailsText(medicationStats, appointmentStats));

    this.reportsByUserId.set(normalizedUserId, report);
    return report.getReportSnapshot();
  }

  getReportSummary(userId, range = 'monthly') {
    const report = this.generateReport(userId, range);
    return {
      reportId: report.reportId,
      title: report.title,
      subtitle: report.subtitle,
      summary: report.summary,
      details: report.details,
      generatedAt: report.generatedAt,
      dateRange: {
        startDate: report.startDate,
        endDate: report.endDate,
      },
      medicationStats: report.medicationStats,
      appointmentStats: report.appointmentStats,
    };
  }

  getMedicationReportSection(userId, range = 'monthly') {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const resolvedRange = resolveRange(range, new Date());
    const medEntries = this._getMedEntriesForRange(normalizedUserId, resolvedRange);
    const report = new ProgressReport({
      title: 'Medication Report Section',
      startDate: resolvedRange.startDate,
      endDate: resolvedRange.endDate,
      medEntries,
    });

    return {
      range: resolvedRange,
      entries: report.getMedEntriesInRange(),
      stats: report.getMedicationStats(),
    };
  }

  getAppointmentReportSection(userId, range = 'monthly') {
    const normalizedUserId = normalizeEntityId(userId, 'userId');
    const resolvedRange = resolveRange(range, new Date());
    const apptEntries = this._getApptEntriesForRange(normalizedUserId, resolvedRange);
    const report = new ProgressReport({
      title: 'Appointment Report Section',
      startDate: resolvedRange.startDate,
      endDate: resolvedRange.endDate,
      apptEntries,
    });

    return {
      range: resolvedRange,
      entries: report.getApptEntriesInRange(),
      stats: report.getAppointmentStats(),
    };
  }

  exportReport(userId, range = 'monthly', format = 'json') {
    const snapshot = this.generateReport(userId, range);
    const normalizedFormat = typeof format === 'string' ? format.trim().toLowerCase() : 'json';

    switch (normalizedFormat) {
      case 'json':
        return snapshot;
      case 'csv':
        return toCsv(snapshot);
      case 'text':
      case 'plain':
        return [
          `Title: ${snapshot.title}`,
          `Subtitle: ${snapshot.subtitle}`,
          `Summary: ${snapshot.summary}`,
          `Details: ${snapshot.details}`,
          `Medication: ${JSON.stringify(snapshot.medicationStats)}`,
          `Appointments: ${JSON.stringify(snapshot.appointmentStats)}`,
        ].join('\n');
      default:
        throw new RangeError('format must be json, csv, or text.');
    }
  }

  getAvailableReportRanges() {
    return [
      { key: 'daily', label: 'Daily', description: 'A single day report.' },
      { key: 'weekly', label: 'Weekly', description: 'A seven-day report.' },
      { key: 'monthly', label: 'Monthly', description: 'A month-to-date report.' },
      { key: 'yearly', label: 'Yearly', description: 'A year-to-date report.' },
    ];
  }

  _getMedEntriesForRange(userId, resolvedRange) {
    const entries = this.medTrackerService.listMedEntries(userId);
    return entries.filter((entry) => {
      if (!resolvedRange.startDate && !resolvedRange.endDate) {
        return true;
      }

      const entryStart = normalizeDate(entry.startDate, 'startDate');
      const entryEnd = normalizeDate(entry.endDate, 'endDate');

      if (resolvedRange.startDate && entryEnd && entryEnd < resolvedRange.startDate) {
        return false;
      }

      if (resolvedRange.endDate && entryStart && entryStart > resolvedRange.endDate) {
        return false;
      }

      return true;
    });
  }

  _getApptEntriesForRange(userId, resolvedRange) {
    const entries = this.apptTrackerService.listApptEntries(userId);
    return entries.filter((entry) => {
      if (!resolvedRange.startDate && !resolvedRange.endDate) {
        return true;
      }

      const scheduledDateTime = entry.getScheduledDateTime();
      if (!scheduledDateTime) {
        return false;
      }

      return rangeContains(scheduledDateTime, resolvedRange);
    });
  }
}

const progressReportService = new ProgressReportService();

export default progressReportService;
