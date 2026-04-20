// Write Caregiver and Patient as the two child models of User. 
// They should only contain the attributes and behaviors that are specific to that role.

// Caregiver
// In CaregiverModel.js, put:

// extends User
// caregiver-specific attributes, like:
// list of patientIds

// a constructor(...) that assigns those fields

// no methods for now because all caregiver-specific behaviors will be implemented in services

import User from './UserModel';

const normalizePatientIds = (patientIds) => {
  if (!Array.isArray(patientIds)) {
    throw new TypeError('patientIds must be an array.');
  }

  return patientIds.map((patientId) => {
    if (typeof patientId !== 'string' && typeof patientId !== 'number') {
      throw new TypeError('Each patientId must be a string or finite number.');
    }

    const normalizedPatientId = String(patientId).trim();
    if (!normalizedPatientId) {
      throw new RangeError('Each patientId cannot be empty.');
    }

    return normalizedPatientId;
  });
};

export default class Caregiver extends User {
  constructor({
    userId = '',
    phoneNum = '',
    email = '',
    password = '',
    patientIds = [],
    personalProfile,
  } = {}) {
    super({
      userId,
      role: 'caregiver',
      phoneNum,
      email,
      password,
      personalProfile,
    });
    this.patientIds = normalizePatientIds(patientIds);
  }
}
