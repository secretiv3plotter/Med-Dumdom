//1 User owns 1 PersonalProfile class
// In PersonalProfile.js, put:

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

export default class PersonalProfile {
  constructor(profileData = {}) {
    const {
      fullName = '',
      name = fullName,
      profilePicture = '',
      profilePictureUrl = profilePicture,
      birthDate = null,
      age = 0,
      address = '',
    } = profileData;

    const resolvedFullName = fullName || name;
    const resolvedProfilePicture = profilePicture || profilePictureUrl;

    this.fullName = resolvedFullName;
    this.name = resolvedFullName;
    this.profilePicture = resolvedProfilePicture;
    this.profilePictureUrl = resolvedProfilePicture;
    this.birthDate = birthDate ? new Date(birthDate) : null;
    this.age = this.birthDate ? this.calculateAge(this.birthDate) : age;
    this.address = address;
  }

  updateName(newName) {
    this.fullName = newName;
    this.name = newName;
    return this.fullName;
  }

  updateProfilePicture(newPictureUrl) {
    this.profilePicture = newPictureUrl;
    this.profilePictureUrl = newPictureUrl;
    return this.profilePicture;
  }

  updateBirthDate(newBirthDate) {
    this.birthDate = newBirthDate ? new Date(newBirthDate) : null;
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
    this.address = newAddress;
    return this.address;
  }
}
