// PatientProfile extends PersonalProfile

// patient-only profile fields
// emergencyContact
// emergencyNum
// updateEmergencyContact(newContact)
// updateEmergencyNum(newNum)

//constructor(...) that assigns those fields

import PersonalProfile from './PersonalProfile';

export default class PatientProfile extends PersonalProfile {
  constructor(profileData = {}) {
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
    } = profileData;

    super({
      fullName,
      name,
      profilePicture,
      profilePictureUrl,
      birthDate,
      age,
      address,
    });
    this.emergencyContact = emergencyContact;
    this.emergencyNum = emergencyNum;
  }

  updateEmergencyContact(newContact) {
    this.emergencyContact = newContact;
    return this.emergencyContact;
  }

  updateEmergencyNum(newNum) {
    this.emergencyNum = newNum;
    return this.emergencyNum;
  }
}
