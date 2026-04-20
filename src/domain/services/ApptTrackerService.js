// AppointmentTrackerService
// Role:
// Own the business logic for appointment tracking.
// This service should decide how appointments are created, edited, cancelled,
// completed, and summarized.
//
// What belongs here:
// - view appointment entries
// - create and update appointment entries
// - cancel or soft delete appointment entries
// - finish appointment entries
// - add or update notes
// - compute whether an appointment is due now
// - derive appointment status for the UI
//
// Use cases covered:
// - patient manages appt tracker
// - reminder generation based on appointment due state
// - progress report appointment summaries
//
// What should NOT belong here:
// - notification delivery
// - Realm storage implementation
// - UI rendering and form handling
// - backend sync details
//
// Suggested service methods:
// - listApptEntries(userId)
// - addApptEntry(userId, apptData)
// - updateApptEntry(userId, apptEntryId, apptData)
// - cancelApptEntry(userId, apptEntryId)
// - markApptCompleted(userId, apptEntryId, completedAt)
// - undoApptCompleted(userId, apptEntryId)
// - getDueApptEntries(userId, now)
// - getApptTrackerSummary(userId, range)
//
// Model methods this service should wrap:
// - updateConcern(newConcern)
// - updateAddress(newAddress)
// - updateContactNumber(newContactNumber)
// - updateTimeSched(newTimeSched)
// - updateDateSched(newDateSched)
// - updateNote(newNote)
// - markCompleted(completedAt)
// - clearCompletedStatus()
// - getScheduledDateTime()
// - getCompletedDateTime()
// - isDue(currTime, currDate)
//
// Notes:
// - this service should work with the ApptEntryModel
// - cancellation should be soft and preserve history if possible
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: ReminderService, ProgressReportService, appointment tracker UI
