// PatientPrivacy
// In PatientPrivacyModel.js, put:

// attributes for privacy choices, like:
// medTrackerPermit: boolean
// consultTrackerPermit: boolean
// viewReportPermit: boolean
// modifyMedTracker: boolean
// modifyApptTracker: boolean
// manualCaregiverReminderPermit: boolean
// exportMedReportPermit: boolean
// exportApptReportPermit: boolean

// a constructor

// methods like:
// toggleMedTrackerPermit()
// toggleConsultTrackerPermit()
// toggleViewReportPermit()
// toggleModifyMedTracker()
// toggleModifyApptTracker()
// toggleManualCaregiverReminderPermit()
// toggleExportMedReportPermit()
// toggleExportApptReportPermit()

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
    viewReportPermit = false,
    modifyMedTracker = false,
    modifyApptTracker = false,
    manualCaregiverReminderPermit = false,
    exportMedReportPermit = false,
    exportApptReportPermit = false,
  } = {}) {
    this.medTrackerPermit = normalizeBoolean(medTrackerPermit, 'medTrackerPermit');
    this.consultTrackerPermit = normalizeBoolean(consultTrackerPermit, 'consultTrackerPermit');
    this.viewReportPermit = normalizeBoolean(viewReportPermit, 'viewReportPermit');
    this.modifyMedTracker = normalizeBoolean(modifyMedTracker, 'modifyMedTracker');
    this.modifyApptTracker = normalizeBoolean(modifyApptTracker, 'modifyApptTracker');
    this.manualCaregiverReminderPermit = normalizeBoolean(
      manualCaregiverReminderPermit,
      'manualCaregiverReminderPermit'
    );
    this.exportMedReportPermit = normalizeBoolean(exportMedReportPermit, 'exportMedReportPermit');
    this.exportApptReportPermit = normalizeBoolean(exportApptReportPermit, 'exportApptReportPermit');
  }

  toggleMedTrackerPermit() {
    this.medTrackerPermit = !normalizeBoolean(this.medTrackerPermit, 'medTrackerPermit');
    return this.medTrackerPermit;
  }

  toggleConsultTrackerPermit() {
    this.consultTrackerPermit = !normalizeBoolean(this.consultTrackerPermit, 'consultTrackerPermit');
    return this.consultTrackerPermit;
  }

  toggleViewReportPermit() {
    this.viewReportPermit = !normalizeBoolean(this.viewReportPermit, 'viewReportPermit');
    return this.viewReportPermit;
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

  toggleExportMedReportPermit() {
    this.exportMedReportPermit = !normalizeBoolean(this.exportMedReportPermit, 'exportMedReportPermit');
    return this.exportMedReportPermit;
  }

  toggleExportApptReportPermit() {
    this.exportApptReportPermit = !normalizeBoolean(this.exportApptReportPermit, 'exportApptReportPermit');
    return this.exportApptReportPermit;
  }
}

export default PatientPrivacy;
