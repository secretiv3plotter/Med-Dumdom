// In NotifSetting.js, put:

// attributes for notification preferences, like:
// medRemindersEnabled
// apptRemindersEnabled
// medReminderTime
// apptReminderTime
// vibrationEnabled
// snoozeDuration
// a constructor that assigns them

// simple methods like:
// toggleMedReminders()
// toggleApptReminders()
// updateMedReminderTime(newTime)
// updateApptReminderTime(newTime)
// toggleVibration()
// updateSnoozeDuration(newDuration)

export default class NotifSetting {
  constructor({
    medRemindersEnabled = true,
    apptRemindersEnabled = true,
    medReminderTime = null,
    apptReminderTime = null,
    vibrationEnabled = true,
    snoozeDuration = null,
  } = {}) {
    this.medRemindersEnabled = medRemindersEnabled;
    this.apptRemindersEnabled = apptRemindersEnabled;
    this.medReminderTime = medReminderTime;
    this.apptReminderTime = apptReminderTime;
    this.vibrationEnabled = vibrationEnabled;
    this.snoozeDuration = snoozeDuration;
  }

  toggleMedReminders() {
    this.medRemindersEnabled = !this.medRemindersEnabled;
    return this;
  }

  toggleApptReminders() {
    this.apptRemindersEnabled = !this.apptRemindersEnabled;
    return this;
  }

  updateMedReminderTime(newTime) {
    this.medReminderTime = newTime;
    return this;
  }

  updateApptReminderTime(newTime) {
    this.apptReminderTime = newTime;
    return this;
  }

  toggleVibration() {
    this.vibrationEnabled = !this.vibrationEnabled;
    return this;
  }

  updateSnoozeDuration(newDuration) {
    this.snoozeDuration = newDuration;
    return this;
  }
}
