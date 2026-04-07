// PersonalProfileService
// Role:
// Own the business logic for a patient's or caregiver's personal profile.
// This service should sit between the UI and the PersonalProfileModel.
//
// What belongs here:
// - loading a profile for display
// - updating profile fields from user actions
// - coordinating validation rules that are broader than the model itself
// - orchestrating soft delete or restore behavior later through storage/repository logic
//
// Use cases covered:
// - patient manages personal profile: view, add, edit, delete
// - caregiver views patient personal profile when permitted
//
// What should NOT belong here:
// - Realm queries and persistence details
// - screen rendering or form state
// - authentication/session logic
// - hard deletion rules
//
// Model methods this service should wrap:
// - updateName(newName)
// - updateProfilePicture(newPictureUrl)
// - updateBirthDate(newBirthDate)
// - calculateAge(birthDate)
// - updateAddress(newAddress)
//
// Suggested service methods:
// - getProfile(userId)
// - updateProfileName(userId, newName)
// - updateProfilePicture(userId, newPictureUrl)
// - updateProfileBirthDate(userId, newBirthDate)
// - updateProfileAddress(userId, newAddress)
// - canViewerAccessProfile(viewerRole, viewerId, ownerId)
//
// Notes:
// - keep the service focused on business rules, not storage
// - soft delete can be exposed here later, but it is not a model concern
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: PrivacySettingsService, PatientCaregiverLinkService
