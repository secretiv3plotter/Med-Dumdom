// Patient
// In PatientModel.js, put:

// extends User
// a constructor(...) that assigns those fields

import User from './UserModel';
import PatientProfile from './PatientProfileModel';

export default class Patient extends User {
  constructor({
    userId = '',
    phoneNum = '',
    email = '',
    password = '',
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
  }
}
