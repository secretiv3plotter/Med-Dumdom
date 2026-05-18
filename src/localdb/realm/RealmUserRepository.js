import PersonalProfile from '../../domain/models/PersonalProfileModel';
import User from '../../domain/models/UserModel';

const DEFAULT_PATIENT_EMAIL = 'current-user@local.invalid';

const normalizeUserId = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new RangeError('userId cannot be empty.');
  }

  return normalizedUserId;
};

const normalizeOptionalString = (value) =>
  value === undefined || value === null ? '' : String(value).trim();

const toNullableDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toPersonalProfileModel = (user) =>
  new PersonalProfile({
    fullName: user.fullName || '',
    profilePicture: user.profilePicture || '',
    birthDate: user.birthDate || null,
    address: user.address || '',
  });

const toUserModel = (user) =>
  new User({
    userId: user.userId,
    role: user.role || 'patient',
    phoneNum: user.phoneNum || '',
    email: user.email || '',
    password: user.password || '',
    personalProfile: toPersonalProfileModel(user),
  });

export default class RealmUserRepository {
  constructor(realm) {
    this.realm = realm;
  }

  write(callback) {
    if (this.realm.isInTransaction) {
      return callback();
    }

    return this.realm.write(callback);
  }

  ensurePatientUser(userId, userData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const existingUser = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
    if (existingUser) {
      return existingUser;
    }

    const now = new Date();
    return this.realm.create('PatientUser', {
      userId: normalizedUserId,
      role: userData.role || 'patient',
      phoneNum: normalizeOptionalString(userData.phoneNum),
      email: normalizeOptionalString(userData.email) || DEFAULT_PATIENT_EMAIL,
      password: normalizeOptionalString(userData.password),
      passwordHash: userData.passwordHash || null,
      fullName: normalizeOptionalString(userData.fullName),
      birthDate: toNullableDate(userData.birthDate),
      address: normalizeOptionalString(userData.address),
      profilePicture: normalizeOptionalString(userData.profilePicture),
      createdAt: now,
      updatedAt: now,
    });
  }

  getUser(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => toUserModel(this.ensurePatientUser(normalizedUserId)));
  }

  saveUser(userId, userData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const existingUser = this.ensurePatientUser(normalizedUserId, userData);
      const now = new Date();
      const nextUser = this.realm.create(
        'PatientUser',
        {
          userId: normalizedUserId,
          role: userData.role || existingUser.role || 'patient',
          phoneNum: userData.phoneNum !== undefined ? normalizeOptionalString(userData.phoneNum) : existingUser.phoneNum || '',
          email: userData.email !== undefined ? normalizeOptionalString(userData.email) : existingUser.email || DEFAULT_PATIENT_EMAIL,
          password: userData.password !== undefined ? normalizeOptionalString(userData.password) : existingUser.password || '',
          passwordHash: userData.passwordHash !== undefined ? userData.passwordHash : existingUser.passwordHash || null,
          fullName: userData.fullName !== undefined ? normalizeOptionalString(userData.fullName) : existingUser.fullName || '',
          birthDate: userData.birthDate !== undefined ? toNullableDate(userData.birthDate) : existingUser.birthDate || null,
          address: userData.address !== undefined ? normalizeOptionalString(userData.address) : existingUser.address || '',
          profilePicture: userData.profilePicture !== undefined ? normalizeOptionalString(userData.profilePicture) : existingUser.profilePicture || '',
          createdAt: existingUser.createdAt || now,
          updatedAt: now,
        },
        'modified',
      );

      return toUserModel(nextUser);
    });
  }

  getProfile(userId) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => toPersonalProfileModel(this.ensurePatientUser(normalizedUserId)));
  }

  saveProfile(userId, profileData = {}) {
    return this.saveUser(userId, {
      fullName: profileData.fullName ?? profileData.name ?? '',
      profilePicture: profileData.profilePicture ?? profileData.profilePictureUrl ?? '',
      birthDate: profileData.birthDate ?? null,
      address: profileData.address ?? '',
    }).getPersonalProfile();
  }

  updateProfileName(userId, fullName) {
    return this.saveProfile(userId, { ...this.getProfile(userId), fullName }).fullName;
  }

  updateProfilePicture(userId, profilePicture) {
    return this.saveProfile(userId, { ...this.getProfile(userId), profilePicture }).profilePicture;
  }

  updateProfileBirthDate(userId, birthDate) {
    return this.saveProfile(userId, { ...this.getProfile(userId), birthDate }).birthDate;
  }

  updateProfileAddress(userId, address) {
    return this.saveProfile(userId, { ...this.getProfile(userId), address }).address;
  }
}
