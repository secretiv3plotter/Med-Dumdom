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

import PersonalProfile from '../models/PersonalProfileModel';
import PatientProfile from '../models/PatientProfileModel';
import { normalizeEntityId } from './serviceUtils';

const normalizeRole = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

const normalizeBirthDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError('birthDate must be a valid date.');
  }

  return parsedDate;
};

const cloneProfile = (profile) => {
  if (profile instanceof PatientProfile) {
    return new PatientProfile({ ...profile });
  }

  if (profile instanceof PersonalProfile) {
    return new PersonalProfile({ ...profile });
  }

  if (profile && typeof profile === 'object') {
    const profileData = { ...profile };
    if ('emergencyContact' in profileData || 'emergencyNum' in profileData) {
      return new PatientProfile(profileData);
    }

    return new PersonalProfile(profileData);
  }

  return new PersonalProfile();
};

const toProfileModel = (profileData) => {
  if (profileData instanceof PatientProfile || profileData instanceof PersonalProfile) {
    return cloneProfile(profileData);
  }

  if (profileData && typeof profileData === 'object') {
    if ('emergencyContact' in profileData || 'emergencyNum' in profileData) {
      return new PatientProfile(profileData);
    }

    return new PersonalProfile(profileData);
  }

  return new PersonalProfile();
};

const normalizeAccessChecker = (value) => (typeof value === 'function' ? value : null);

class PersonalProfileService {
  constructor(initialProfilesByUserId = null, options = {}) {
    this.profilesByUserId = new Map();
    this.deletedProfileIds = new Set();
    this.caregiverAccessChecker = normalizeAccessChecker(options.canCaregiverAccessPatient);

    if (initialProfilesByUserId instanceof Map) {
      initialProfilesByUserId.forEach((profileData, userId) => {
        this.profilesByUserId.set(normalizeEntityId(userId, 'userId'), toProfileModel(profileData));
      });
      return;
    }

    if (initialProfilesByUserId && typeof initialProfilesByUserId === 'object') {
      Object.entries(initialProfilesByUserId).forEach(([userId, profileData]) => {
        this.profilesByUserId.set(normalizeEntityId(userId, 'userId'), toProfileModel(profileData));
      });
    }
  }

  getProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    if (this.deletedProfileIds.has(profileId)) {
      return null;
    }

    return cloneProfile(this._getStoredProfile(profileId));
  }

  saveProfile(userId, profileData) {
    const profileId = normalizeEntityId(userId, 'userId');
    const profile = toProfileModel(profileData);
    this.profilesByUserId.set(profileId, profile);
    this.deletedProfileIds.delete(profileId);
    return cloneProfile(profile);
  }

  deleteProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    this.deletedProfileIds.add(profileId);
    return true;
  }

  restoreProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    this.deletedProfileIds.delete(profileId);
    return cloneProfile(this._getStoredProfile(profileId));
  }

  updateProfileName(userId, newName) {
    const profile = this._getWritableProfile(userId);
    const trimmedName = normalizeOptionalString(newName, 'newName');

    if (trimmedName.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (trimmedName.length > 100) {
      throw new Error('Name must not exceed 100 characters');
    }

    return profile.updateName(trimmedName);
  }

  updateProfilePicture(userId, newPictureUrl) {
    if (newPictureUrl !== undefined && newPictureUrl !== null && typeof newPictureUrl !== 'string') {
      throw new TypeError('newPictureUrl must be a string, null, or undefined.');
    }

    const normalizedPicture = normalizeOptionalString(newPictureUrl, 'newPictureUrl');
    const profile = this._getWritableProfile(userId);
    return profile.updateProfilePicture(normalizedPicture);
  }

  updateProfileBirthDate(userId, newBirthDate) {
    const birthDate = normalizeBirthDate(newBirthDate);
    const today = new Date();

    if (!birthDate) {
      throw new Error('newBirthDate is required');
    }

    if (birthDate > today) {
      throw new Error('Birth date cannot be in the future');
    }

    const age = this.calculateAge(birthDate);
    if (age > 150) {
      throw new Error('Birth date is not within a reasonable range');
    }

    const profile = this._getWritableProfile(userId);
    return profile.updateBirthDate(birthDate);
  }

  updateProfileAddress(userId, newAddress) {
    if (newAddress !== undefined && newAddress !== null && typeof newAddress !== 'string') {
      throw new TypeError('newAddress must be a string, null, or undefined.');
    }

    const normalizedAddress = normalizeOptionalString(newAddress, 'newAddress');
    const profile = this._getWritableProfile(userId);
    return profile.updateAddress(normalizedAddress);
  }

  calculateAge(birthDate) {
    const normalizedBirthDate = normalizeBirthDate(birthDate);
    if (!normalizedBirthDate) {
      throw new Error('birthDate is required');
    }

    const helperProfile = new PersonalProfile({ birthDate: normalizedBirthDate });
    return helperProfile.calculateAge(normalizedBirthDate);
  }

  canViewerAccessProfile(viewerRole, viewerId, ownerId) {
    if (!viewerRole || viewerId === undefined || viewerId === null || ownerId === undefined || ownerId === null) {
      return false;
    }

    const normalizedViewerRole = normalizeRole(viewerRole);
    if (!normalizedViewerRole) {
      return false;
    }

    const normalizedViewerId = normalizeEntityId(viewerId, 'viewerId');
    const normalizedOwnerId = normalizeEntityId(ownerId, 'ownerId');

    if (normalizedViewerId === normalizedOwnerId) {
      return true;
    }

    if (normalizedViewerRole === 'admin') {
      return true;
    }

    if (normalizedViewerRole === 'caregiver') {
      return this._hasActiveCaregiverRelationship(normalizedViewerId, normalizedOwnerId);
    }

    return false;
  }

  _getStoredProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    const storedProfile = this.profilesByUserId.get(profileId);

    if (storedProfile) {
      return storedProfile;
    }

    const defaultProfile = new PersonalProfile();
    this.profilesByUserId.set(profileId, defaultProfile);
    return defaultProfile;
  }

  _getWritableProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    if (this.deletedProfileIds.has(profileId)) {
      throw new Error('Profile has been deleted');
    }

    return this._getStoredProfile(profileId);
  }

  _hasActiveCaregiverRelationship(caregiverId, patientId) {
    if (!this.caregiverAccessChecker) {
      return false;
    }

    try {
      return Boolean(this.caregiverAccessChecker(patientId, caregiverId));
    } catch {
      return false;
    }
  }
}

const personalProfileService = new PersonalProfileService();

export { PersonalProfileService };
export default personalProfileService;
