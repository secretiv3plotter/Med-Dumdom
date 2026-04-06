// PatientPrivacy
// In PatientPrivacy.js, put:

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

class PatientPrivacy {
  constructor(
    medTrackerPermit,
    consultTrackerPermit,
    viewReportPermit,
    modifyMedTracker,
    modifyApptTracker,
    manualCaregiverReminderPermit,
    exportMedReportPermit,
    exportApptReportPermit
  ) {
    this.medTrackerPermit = medTrackerPermit;
    this.consultTrackerPermit = consultTrackerPermit;
    this.viewReportPermit = viewReportPermit;
    this.modifyMedTracker = modifyMedTracker;
    this.modifyApptTracker = modifyApptTracker;
    this.manualCaregiverReminderPermit = manualCaregiverReminderPermit;
    this.exportMedReportPermit = exportMedReportPermit;
    this.exportApptReportPermit = exportApptReportPermit;
  }

  toggleMedTrackerPermit() {
    this.medTrackerPermit = !this.medTrackerPermit;
  }

  toggleConsultTrackerPermit() {
    this.consultTrackerPermit = !this.consultTrackerPermit;
  }

  toggleViewReportPermit() {
    this.viewReportPermit = !this.viewReportPermit;
  }

  toggleModifyMedTracker() {
    this.modifyMedTracker = !this.modifyMedTracker;
  }

  toggleModifyApptTracker() {
    this.modifyApptTracker = !this.modifyApptTracker;
  }

  toggleManualCaregiverReminderPermit() {
    this.manualCaregiverReminderPermit = !this.manualCaregiverReminderPermit;
  }

  toggleExportMedReportPermit() {
    this.exportMedReportPermit = !this.exportMedReportPermit;
  }

  toggleExportApptReportPermit() {
    this.exportApptReportPermit = !this.exportApptReportPermit;
  }
}

export default PatientPrivacy;