// PatientCaregiverLinkService
// Role:
// Own caregiver-patient linking business logic for internet-backed use cases.
// This is the service for relationships, link requests, approval flows, and access checks.
//
// What belongs here:
// - link one patient to one caregiver
// - link many patients to one caregiver
// - request approval for linking
// - approve or reject link requests
// - unlink relationships
// - check whether a caregiver is allowed to act on a patient relationship
//
// Use cases covered:
// - patient can link to one caregiver
// - caregiver can link to many patients
// - caregiver can only manage what the patient allowed them to
// - caregiver can view patient personal profile when permitted
//
// What should NOT belong here:
// - actual networking or API calls
// - Realm-specific persistence logic
// - UI request/approval screens
// - notification delivery
//
// Suggested service methods:
// - requestPatientLink(patientId, caregiverId)
// - approvePatientLink(patientId, caregiverId)
// - rejectPatientLink(patientId, caregiverId)
// - unlinkPatientCaregiver(patientId, caregiverId)
// - getLinkedCaregiver(patientId)
// - getLinkedPatients(caregiverId)
// - canCaregiverAccessPatient(patientId, caregiverId)
//
// Notes:
// - this service owns the relationship rules, not the database mechanics
//
// Dependencies:
// - direct dependencies: PersonalProfileService, PrivacySettingsService
// - commonly used by: caregiver linking UI, access-control checks, manual reminder flows
