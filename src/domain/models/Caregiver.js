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
    role = 'caregiver',
    phoneNum = '',
    email = '',
    password = '',
    patientIds = [],
  } = {}) {
    super({ userId, role, phoneNum, email, password });
    this.patientIds = patientIds;
  }
}
