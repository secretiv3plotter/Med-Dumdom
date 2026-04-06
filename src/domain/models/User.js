// Write User as the base user model that only contains data and behavior shared by both Patient and Caregiver.

// In User.js, put:

// shared attributes:

// userId
// role
// phoneNum
// email
// password (just prototype data)
// a constructor(...) that assigns those fields

// simple methods that belong to the user itself, like:

// updatePhoneNum(phoneNum)
// updateEmail(email)
// getRole()
// isPatient()
// isCaregiver()

// Do not put these in User as these are services that will be implemented in the future:

// login()
// logout()
// register()
// changePassword()
// softDeleteAccount()

import PersonalProfile from './PersonalProfile';

export default class User {
  constructor({
    userId = '',
    role = '',
    phoneNum = '',
    email = '',
    password = '',
    personalProfile = new PersonalProfile(),
  } = {}) {
    this.userId = userId;
    this.role = role;
    this.phoneNum = phoneNum;
    this.email = email;
    this.password = password;
    this.personalProfile =
      personalProfile instanceof PersonalProfile
        ? personalProfile
        : new PersonalProfile(personalProfile);
  }

  updatePhoneNum(phoneNum) {
    this.phoneNum = phoneNum;
    return this.phoneNum;
  }

  updateEmail(email) {
    this.email = email;
    return this.email;
  }

  getRole() {
    return this.role;
  }

  getPersonalProfile() {
    return this.personalProfile;
  }

  isPatient() {
    return this.role === 'patient';
  }

  isCaregiver() {
    return this.role === 'caregiver';
  }
}
