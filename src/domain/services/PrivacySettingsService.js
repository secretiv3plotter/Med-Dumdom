// PrivacySettingsService
// Role:
// Own the business logic for patient privacy permissions.
// This service decides what caregivers are allowed to access or modify.
//
// What belongs here:
// - exposing privacy settings for the current patient
// - toggling privacy permissions that exist in PatientPrivacyModel
// - validating which role can view or edit a resource
// - checking if a caregiver can access medication, appointment, or report data
// - checking if export permissions are allowed
//
// Use cases covered:
// - patient sets what data caregivers can access
// - caregiver can only manage what the patient allowed them to
//
// What should NOT belong here:
// - login or authentication logic
// - Realm persistence details
// - actual UI permission dialogs
// - data export formatting
//
// Model methods this service should wrap:
// - toggleMedTrackerPermit()
// - toggleConsultTrackerPermit()
// - toggleViewReportPermit()
// - toggleModifyMedTracker()
// - toggleModifyApptTracker()
// - toggleManualCaregiverReminderPermit()
// - toggleExportMedReportPermit()
// - toggleExportApptReportPermit()
//
// Suggested service methods:
// - getPrivacySettings(patientId)
// - updatePrivacySettings(patientId, payload)
// - canCaregiverViewMedTracker(patientId, caregiverId)
// - canCaregiverViewApptTracker(patientId, caregiverId)
// - canCaregiverViewReports(patientId, caregiverId)
// - canCaregiverModifyMedTracker(patientId, caregiverId)
// - canCaregiverModifyApptTracker(patientId, caregiverId)
// - canCaregiverSendManualReminder(patientId, caregiverId)
//
// Notes:
// - this service should enforce patient-owned control over caregiver access
// - keep the service aligned with the exact permissions exposed by PatientPrivacyModel
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: PatientCaregiverLinkService, resource access checks in tracker/report services
