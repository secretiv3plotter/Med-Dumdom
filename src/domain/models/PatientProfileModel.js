// PatientProfile extends PersonalProfileModel

// patient-only profile fields
// emergencyContact
// emergencyNum
// updateEmergencyContact(newContact)
// updateEmergencyNum(newNum)

//constructor(...) that assigns those fields

import PersonalProfile from './PersonalProfileModel';

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

export default class PatientProfile extends PersonalProfile {
  constructor(profileData = {}) {
    const safeProfileData = profileData && typeof profileData === 'object' ? profileData : {};
    const {
      fullName = '',
      name = fullName,
      profilePicture = '',
      profilePictureUrl = profilePicture,
      birthDate = null,
      age = 0,
      address = '',
      emergencyContact = '',
      emergencyNum = '',
    } = safeProfileData;

    super({
      fullName,
      name,
      profilePicture,
      profilePictureUrl,
      birthDate,
      age,
      address,
    });
    this.emergencyContact = normalizeOptionalString(emergencyContact, 'emergencyContact');
    this.emergencyNum = normalizeOptionalString(emergencyNum, 'emergencyNum');
  }

  updateEmergencyContact(newContact) {
    this.emergencyContact = normalizeOptionalString(newContact, 'emergencyContact');
    return this.emergencyContact;
  }

  updateEmergencyNum(newNum) {
    this.emergencyNum = normalizeOptionalString(newNum, 'emergencyNum');
    return this.emergencyNum;
  }
}
