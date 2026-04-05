// Put fields like:

// reminderId
// type Example: 'medication' or 'appointment'
// relatedEntryId The medication entry or appointment entry this reminder belongs to
// title
// message
// snoozeDateTime (snooze until this date/time)
// status Example: 'pending', 'completed', 'dismissed'

// Add:
// a constructor that assigns those fields
// Simple methods that belong in the model:

// markCompleted()
// dismissReminder()
// snoozeReminder()
// isMedicationReminder()
// isAppointmentReminder()

// Do not put these in Reminder:

// actual notification popup code
// scheduling device notifications
// Firebase push notification logic
// syncing with backend/local DB
// Those belong in a notification/reminder service.
