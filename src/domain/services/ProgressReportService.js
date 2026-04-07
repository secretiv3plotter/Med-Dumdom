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
