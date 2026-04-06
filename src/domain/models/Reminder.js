export default class Reminder {
  constructor({
    reminderId,
    type,
    relatedEntryId,
    title,
    message,
    snoozeDateTime = null,
    status = 'pending',
  } = {}) {
    this.reminderId = reminderId;
    this.type = type;
    this.relatedEntryId = relatedEntryId;
    this.title = title;
    this.message = message;
    this.snoozeDateTime = snoozeDateTime;
    this.status = status;
  }

  markCompleted() {
    this.status = 'completed';
    return this;
  }

  dismissReminder() {
    this.status = 'dismissed';
    return this;
  }

  snoozeReminder(newSnoozeDateTime) {
    if (newSnoozeDateTime !== undefined) {
      this.snoozeDateTime = newSnoozeDateTime;
    }
    this.status = 'pending';
    return this;
  }

  isMedicationReminder() {
    return typeof this.type === 'string' && this.type.toLowerCase() === 'medication';
  }

  isAppointmentReminder() {
    return typeof this.type === 'string' && this.type.toLowerCase() === 'appointment';
  }
}
