// Write Caregiver and Patient as the two child models of User. 
// They should only contain the attributes and behaviors that are specific to that role.

// Patient
// In Patient.js, put:

// extends User
// patient-specific attributes, like:
// caregiverId

// a constructor(...) that assigns those fields

// methods that belong to the patient itself, such as:
// hasCaregiver()
// getCaregiverId()

// Do not put in Patient:

// link-request approval workflow
// Those belong in services.

import User from './User';
import PatientProfile from './PatientProfile';

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

export default class Patient extends User {
  constructor({
    userId = '',
    phoneNum = '',
    email = '',
    password = '',
    caregiverId = '',
    personalProfile = new PatientProfile(),
  } = {}) {
    super({
      userId,
      role: 'patient',
      phoneNum,
      email,
      password,
      personalProfile:
        personalProfile instanceof PatientProfile
          ? personalProfile
          : new PatientProfile(personalProfile && typeof personalProfile === 'object' ? personalProfile : {}),
    });
    this.caregiverId = normalizeOptionalString(caregiverId, 'caregiverId');
  }

  hasCaregiver() {
    return Boolean(this.caregiverId);
  }

  getCaregiverId() {
    return this.caregiverId;
  }
}
