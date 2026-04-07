// ReminderService
// Role:
// Own reminder business logic across medication, appointments, and manual caregiver reminders.
// This service decides when reminders exist, when they are due, and how they change state.
//
// What belongs here:
// - create reminders from medication or appointment events
// - build reminder content for notification popups
// - mark reminders completed, dismissed, or snoozed
// - determine which reminders should appear in the notifications screen
// - manage manual reminders sent by caregivers
//
// Use cases covered:
// - receive reminders as pop-up notifications and in the notifications screen
// - receive real time manual reminders from caregivers
// - send manual reminders from caregivers to patients
//
// What should NOT belong here:
// - actual device notification APIs
// - Firebase push delivery
// - Realm persistence details
// - UI popup rendering
//
// Suggested service methods:
// - createMedicationReminder(medEntry, now)
// - createAppointmentReminder(apptEntry, now)
// - createManualReminder(senderId, patientId, payload)
// - getDueReminders(userId, now)
// - snoozeReminder(reminderId, snoozeUntil)
// - dismissReminder(reminderId)
// - markReminderCompleted(reminderId)
// - getNotificationFeed(userId)
//
// Model methods this service should wrap:
// - markCompleted()
// - dismissReminder()
// - snoozeReminder(newSnoozeDateTime)
// - isMedicationReminder()
// - isAppointmentReminder()
//
// Notes:
// - this service should work with the ReminderModel
// - actual notification scheduling belongs in a separate adapter/service later
//
// Dependencies:
// - direct dependencies: MedTrackerService, ApptTrackerService, NotifSettingsService,
//   PrivacySettingsService, PatientCaregiverLinkService
// - commonly used by: notification screen, reminder popup logic, caregiver reminder flows
