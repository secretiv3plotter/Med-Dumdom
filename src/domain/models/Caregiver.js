// Write Caregiver and Patient as the two child models of User. 
// They should only contain the attributes and behaviors that are specific to that role.

// Caregiver
// In Caregiver.js, put:

// extends User
// caregiver-specific attributes, like:
// list of patientIds

// a constructor(...) that assigns those fields

// no methods for now because all caregiver-specific behaviors will be implemented in services

import User from './User';

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
    this.patientIds = Array.isArray(patientIds) ? [...patientIds] : [];
  }
}
