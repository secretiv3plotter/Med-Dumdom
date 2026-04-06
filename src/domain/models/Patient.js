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

export default class Patient extends User {
  constructor({
    userId = '',
    role = 'patient',
    phoneNum = '',
    email = '',
    password = '',
    caregiverId = '',
  } = {}) {
    super({ userId, role, phoneNum, email, password });
    this.caregiverId = caregiverId;
  }

  hasCaregiver() {
    return Boolean(this.caregiverId);
  }

  getCaregiverId() {
    return this.caregiverId;
  }
}
