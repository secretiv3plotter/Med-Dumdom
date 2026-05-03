// PatientPrivacy
// In PatientPrivacyModel.js, put:

// attributes for privacy choices, like:
// medTrackerPermit: boolean
// consultTrackerPermit: boolean
// modifyMedTracker: boolean
// modifyApptTracker: boolean
// manualCaregiverReminderPermit: boolean

// a constructor

// methods like:
// toggleMedTrackerPermit()
// toggleConsultTrackerPermit()
// toggleModifyMedTracker()
// toggleModifyApptTracker()
// toggleManualCaregiverReminderPermit()

const normalizeBoolean = (value, fieldName) => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
};

class PatientPrivacy {
  constructor({
    medTrackerPermit = false,
    consultTrackerPermit = false,
    modifyMedTracker = false,
    modifyApptTracker = false,
    manualCaregiverReminderPermit = false,
  } = {}) {
    this.medTrackerPermit = normalizeBoolean(medTrackerPermit, 'medTrackerPermit');
    this.consultTrackerPermit = normalizeBoolean(consultTrackerPermit, 'consultTrackerPermit');
    this.modifyMedTracker = normalizeBoolean(modifyMedTracker, 'modifyMedTracker');
    this.modifyApptTracker = normalizeBoolean(modifyApptTracker, 'modifyApptTracker');
    this.manualCaregiverReminderPermit = normalizeBoolean(
      manualCaregiverReminderPermit,
      'manualCaregiverReminderPermit'
    );
  }

  toggleMedTrackerPermit() {
    this.medTrackerPermit = !normalizeBoolean(this.medTrackerPermit, 'medTrackerPermit');
    return this.medTrackerPermit;
  }

  toggleConsultTrackerPermit() {
    this.consultTrackerPermit = !normalizeBoolean(this.consultTrackerPermit, 'consultTrackerPermit');
    return this.consultTrackerPermit;
  }

  toggleModifyMedTracker() {
    this.modifyMedTracker = !normalizeBoolean(this.modifyMedTracker, 'modifyMedTracker');
    return this.modifyMedTracker;
  }

  toggleModifyApptTracker() {
    this.modifyApptTracker = !normalizeBoolean(this.modifyApptTracker, 'modifyApptTracker');
    return this.modifyApptTracker;
  }

  toggleManualCaregiverReminderPermit() {
    this.manualCaregiverReminderPermit = !normalizeBoolean(
      this.manualCaregiverReminderPermit,
      'manualCaregiverReminderPermit'
    );
    return this.manualCaregiverReminderPermit;
  }

}

export default PatientPrivacy;
