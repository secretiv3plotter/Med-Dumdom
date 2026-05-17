// PersonalProfileService
// Role:
// Own the business logic for a patient's personal profile.
// This service should sit between the UI and the PersonalProfileModel.

import PersonalProfile from '../models/PersonalProfileModel';
import PatientProfile from '../models/PatientProfileModel';
import { normalizeEntityId } from './serviceUtils';

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

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  // Parse safe string splits (safari/iOS compatible)
  const parts = String(value).split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  const parsedDate = new Date(value);
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

class PersonalProfileService {
  constructor(initialProfilesByUserId = null) {
    this.profilesByUserId = new Map();
    this.deletedProfileIds = new Set();

    // 1. First, load existing persisted data on Web if present
    this._loadFromStorage();

    // 2. Overlay initial values passed via constructor
    if (initialProfilesByUserId instanceof Map) {
      initialProfilesByUserId.forEach((profileData, userId) => {
        this.profilesByUserId.set(normalizeEntityId(userId, 'userId'), toProfileModel(profileData));
      });
      this._saveToStorage();
      return;
    }

    if (initialProfilesByUserId && typeof initialProfilesByUserId === 'object') {
      Object.entries(initialProfilesByUserId).forEach(([userId, profileData]) => {
        this.profilesByUserId.set(normalizeEntityId(userId, 'userId'), toProfileModel(profileData));
      });
      this._saveToStorage();
    }
  }

  _loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const stored = localStorage.getItem('_med_dumdom_profiles_');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([userId, profileData]) => {
          if (profileData && profileData.birthDate) {
            profileData.birthDate = new Date(profileData.birthDate);
          }
          this.profilesByUserId.set(userId, toProfileModel(profileData));
        });
      }
      
      const storedDeleted = localStorage.getItem('_med_dumdom_deleted_profiles_');
      if (storedDeleted) {
        const parsedDeleted = JSON.parse(storedDeleted);
        parsedDeleted.forEach(id => this.deletedProfileIds.add(id));
      }
    } catch (err) {
      console.error("Failed to load profiles from localStorage:", err);
    }
  }

  _saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const obj = {};
      this.profilesByUserId.forEach((profile, userId) => {
        obj[userId] = {
          fullName: profile.fullName,
          profilePicture: profile.profilePicture,
          birthDate: profile.birthDate ? profile.birthDate.toISOString() : null,
          address: profile.address,
        };
      });
      localStorage.setItem('_med_dumdom_profiles_', JSON.stringify(obj));
      
      const deletedArr = Array.from(this.deletedProfileIds);
      localStorage.setItem('_med_dumdom_deleted_profiles_', JSON.stringify(deletedArr));
    } catch (err) {
      console.error("Failed to save profiles to localStorage:", err);
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
    this._saveToStorage();
    return cloneProfile(profile);
  }

  deleteProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    this.deletedProfileIds.add(profileId);
    this._saveToStorage();
    return true;
  }

  restoreProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    this.deletedProfileIds.delete(profileId);
    this._saveToStorage();
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

    const res = profile.updateName(trimmedName);
    this._saveToStorage();
    return res;
  }

  updateProfilePicture(userId, newPictureUrl) {
    if (newPictureUrl !== undefined && newPictureUrl !== null && typeof newPictureUrl !== 'string') {
      throw new TypeError('newPictureUrl must be a string, null, or undefined.');
    }

    const normalizedPicture = normalizeOptionalString(newPictureUrl, 'newPictureUrl');
    const profile = this._getWritableProfile(userId);
    const res = profile.updateProfilePicture(normalizedPicture);
    this._saveToStorage();
    return res;
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
    const res = profile.updateBirthDate(birthDate);
    this._saveToStorage();
    return res;
  }

  updateProfileAddress(userId, newAddress) {
    if (newAddress !== undefined && newAddress !== null && typeof newAddress !== 'string') {
      throw new TypeError('newAddress must be a string, null, or undefined.');
    }

    const normalizedAddress = normalizeOptionalString(newAddress, 'newAddress');
    const profile = this._getWritableProfile(userId);
    const res = profile.updateAddress(normalizedAddress);
    this._saveToStorage();
    return res;
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
    if (viewerRole !== 'patient' || viewerId === undefined || viewerId === null || ownerId === undefined || ownerId === null) {
      return false;
    }

    const normalizedViewerId = normalizeEntityId(viewerId, 'viewerId');
    const normalizedOwnerId = normalizeEntityId(ownerId, 'ownerId');

    return normalizedViewerId === normalizedOwnerId;
  }

  _getStoredProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    const storedProfile = this.profilesByUserId.get(profileId);

    if (storedProfile) {
      return storedProfile;
    }

    const defaultProfile = new PersonalProfile();
    this.profilesByUserId.set(profileId, defaultProfile);
    this._saveToStorage();
    return defaultProfile;
  }

  _getWritableProfile(userId) {
    const profileId = normalizeEntityId(userId, 'userId');
    if (this.deletedProfileIds.has(profileId)) {
      throw new Error('Profile has been deleted');
    }

    return this._getStoredProfile(profileId);
  }
}

const personalProfileService = new PersonalProfileService();

export { PersonalProfileService };
export default personalProfileService;
