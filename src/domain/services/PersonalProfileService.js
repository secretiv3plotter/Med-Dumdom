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

class PersonalProfileService {
  constructor(personalProfileModel) {
    this.personalProfileModel = personalProfileModel;
  }

  getProfile(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.personalProfileModel.getProfileByUserId(userId);
  }

  updateProfileName(userId, newName) {
    if (!userId || !newName) {
      throw new Error('userId and newName are required');
    }
    
    const trimmedName = newName.trim();
    
    if (trimmedName.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    if (trimmedName.length > 100) {
      throw new Error('Name must not exceed 100 characters');
    }
    
    const profile = this.personalProfileModel.getProfileByUserId(userId);
    return profile.updateName(trimmedName);
  }

  updateProfilePicture(userId, newPictureUrl) {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    if (newPictureUrl && !this._isValidUrl(newPictureUrl)) {
      throw new Error('Invalid picture URL format');
    }
    
    const profile = this.personalProfileModel.getProfileByUserId(userId);
    return profile.updateProfilePicture(newPictureUrl);
  }

  updateProfileBirthDate(userId, newBirthDate) {
    if (!userId || !newBirthDate) {
      throw new Error('userId and newBirthDate are required');
    }
    
    const birthDate = new Date(newBirthDate);
    const today = new Date();
    
    if (birthDate > today) {
      throw new Error('Birth date cannot be in the future');
    }
    
    const age = this.calculateAge(birthDate);
    if (age > 150) {
      throw new Error('Birth date is not within a reasonable range');
    }
    if (age < 0) {
      throw new Error('Invalid birth date');
    }

    const profile = this.personalProfileModel.getProfileByUserId(userId);
    return profile.updateBirthDate(birthDate);
  }

  updateProfileAddress(userId, newAddress) {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    if (newAddress) {
      if (!this._isValidAddress(newAddress)) {
        throw new Error('Address must contain at least street and city');
      }
    }
    
    const profile = this.personalProfileModel.getProfileByUserId(userId);
    return profile.updateAddress(newAddress);
  }

  calculateAge(birthDate) {
    if (!birthDate) {
      throw new Error('birthDate is required');
    }
    
    const date = new Date(birthDate);
    const today = new Date();
    
    if (date > today) {
      throw new Error('Birth date cannot be in the future');
    }
    
    return this._calculateAgeFromDate(date);
  }

  canViewerAccessProfile(viewerRole, viewerId, ownerId) {
    if (!viewerRole || !viewerId || !ownerId) {
      return false;
    }
    
    if (viewerId === ownerId) {
      return true;
    }
    
    if (viewerRole === 'admin') {
      return true;
    }
    
    if (viewerRole === 'caregiver') {
      // TODO: Verify caregiver relationship through PatientCaregiverLinkService
      return this._hasActiveCaregiverRelationship(viewerId, ownerId);
    }
    
    return false;
  }

  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  _isValidAddress(address) {
    return address && 
           typeof address === 'object' &&
           address.street &&
           address.city;
  }

  _calculateAgeFromDate(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  _hasActiveCaregiverRelationship(caregiverId, patientId) {
    // TODO: Implement when PatientCaregiverLinkService is integrated
    return false;
  }
}

module.exports = PersonalProfileService;
