// Write User as the base UserModel that only contains data and behavior shared by both Patient and Caregiver.

// In UserModel.js, put:

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

const normalizeRole = (value) => {
  const role = normalizeOptionalString(value, 'role');
  if (!role) {
    return '';
  }

  if (!['patient', 'caregiver'].includes(role)) {
    throw new RangeError('role must be either patient or caregiver.');
  }

  return role;
};

export default class User {
  constructor({
    userId = '',
    role = '',
    phoneNum = '',
    email = '',
    password = '',
    personalProfile = new PersonalProfile(),
  } = {}) {
    this.userId = normalizeOptionalString(userId, 'userId');
    this.role = normalizeRole(role);
    this.phoneNum = normalizeOptionalString(phoneNum, 'phoneNum');
    this.email = normalizeOptionalString(email, 'email');
    this.password = normalizeOptionalString(password, 'password');
    this.personalProfile =
      personalProfile instanceof PersonalProfile
        ? personalProfile
        : new PersonalProfile(personalProfile && typeof personalProfile === 'object' ? personalProfile : {});
  }

  updatePhoneNum(phoneNum) {
    this.phoneNum = normalizeOptionalString(phoneNum, 'phoneNum');
    return this.phoneNum;
  }

  updateEmail(email) {
    this.email = normalizeOptionalString(email, 'email');
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
