//1 User owns 1 PersonalProfile class
// In PersonalProfileModel.js, put:

// attributes for personal details
// a constructor
// simple methods that update or read those details

// PersonalProfile should contain:

// full name
// profilePicture (url/file path)
// birthDate
// age
// address

// PersonalProfile methods:

// updateName(newName)
// updateProfilePicture(newPictureUrl)
// updateBirthDate(newBirthDate)
// calculateAge()
// updateAddress(newAddress)

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const normalizeAge = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const numericAge = Number(value);
  if (!Number.isInteger(numericAge) || numericAge < 0) {
    throw new RangeError('age must be a non-negative integer.');
  }

  return numericAge;
};

export default class PersonalProfile {
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
    } = safeProfileData;

    const resolvedFullName = normalizeOptionalString(fullName || name, 'fullName');
    const resolvedProfilePicture = normalizeOptionalString(profilePicture || profilePictureUrl, 'profilePicture');

    this.fullName = resolvedFullName;
    this.name = resolvedFullName;
    this.profilePicture = resolvedProfilePicture;
    this.profilePictureUrl = resolvedProfilePicture;
    this.birthDate = normalizeDate(birthDate, 'birthDate');
    this.age = this.birthDate ? this.calculateAge(this.birthDate) : normalizeAge(age);
    this.address = normalizeOptionalString(address, 'address');
  }

  updateName(newName) {
    this.fullName = normalizeOptionalString(newName, 'fullName');
    this.name = this.fullName;
    return this.fullName;
  }

  updateProfilePicture(newPictureUrl) {
    this.profilePicture = normalizeOptionalString(newPictureUrl, 'profilePicture');
    this.profilePictureUrl = this.profilePicture;
    return this.profilePicture;
  }

  updateBirthDate(newBirthDate) {
    this.birthDate = normalizeDate(newBirthDate, 'birthDate');
    this.age = this.birthDate ? this.calculateAge(this.birthDate) : 0;
    return this.birthDate;
  }

  calculateAge(birthDate = this.birthDate) {
    if (!birthDate) {
      return 0;
    }

    const parsedBirthDate = birthDate instanceof Date ? birthDate : new Date(birthDate);

    if (Number.isNaN(parsedBirthDate.getTime())) {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - parsedBirthDate.getFullYear();
    const monthDifference = today.getMonth() - parsedBirthDate.getMonth();
    const birthdayHasNotPassed =
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < parsedBirthDate.getDate());

    if (birthdayHasNotPassed) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  updateAddress(newAddress) {
    this.address = normalizeOptionalString(newAddress, 'address');
    return this.address;
  }
}
