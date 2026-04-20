// MedTrackerService
// Role:
// Own the business logic for medication tracking.
// This service should decide how medications are created, edited, marked taken,
// soft-deleted, and included in due or progress calculations.
//
// What belongs here:
// - view medication entries
// - create and update medication entries
// - soft delete medication entries
// - confirm taken medication
// - clear taken status
// - compute whether a medication is due
// - calculate medication status for UI summaries
// - handle daily schedule logic
//
// Use cases covered:
// - patient manages med tracker
// - reminder generation based on medication due state
// - progress report medication summaries
//
// What should NOT belong here:
// - notification delivery
// - Realm storage implementation
// - UI cards, forms, or modals
// - backend sync details
//
// Suggested service methods:
// - listMedEntries(userId)
// - addMedEntry(userId, medData)
// - updateMedEntry(userId, medEntryId, medData)
// - softDeleteMedEntry(userId, medEntryId)
// - markMedTaken(userId, medEntryId, takenAt)
// - undoMedTaken(userId, medEntryId)
// - getDueMedEntries(userId, now)
// - getMedTrackerSummary(userId, range)
//
// Model methods this service should wrap:
// - updateMedName(newMedName)
// - updateDosage(newDosage)
// - updateAmount(newAmount)
// - updateQuantityUnit(newUnit)
// - updateDailySched(newDailySched)
// - updateStartDate(newStartDate)
// - updateEndDate(newEndDate)
// - markTaken(takenAt)
// - clearTakenStatus()
// - isActiveOnDate(currDate)
// - isDue(currTime, currDate)
//
// Notes:
// - this service should work with the MedEntryModel
// - deletions here are soft deletions only
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: ReminderService, ProgressReportService, medication tracker UI
