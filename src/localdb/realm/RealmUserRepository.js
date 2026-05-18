import PersonalProfile from '../../domain/models/PersonalProfileModel';
import User from '../../domain/models/UserModel';

const DEFAULT_PATIENT_EMAIL = 'current-user@local.invalid';
const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
};

const SYNC_OPERATION = {
  CREATE: 'create',
  UPDATE: 'update',
};

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

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoOrNull = (value) => {
  const date = toNullableDate(value);
  return date ? date.toISOString() : null;
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

const toPlainUser = (user) => ({
  userId: user.userId,
  role: user.role || 'patient',
  phoneNum: user.phoneNum || '',
  email: user.email || '',
  password: user.password || '',
  passwordHash: user.passwordHash || null,
  fullName: user.fullName || '',
  birthDate: toIsoOrNull(user.birthDate),
  address: user.address || '',
  profilePicture: user.profilePicture || '',
  syncStatus: user.syncStatus || SYNC_STATUS.SYNCED,
  syncOperation: user.syncOperation || '',
  syncError: user.syncError || '',
  lastSyncedAt: toIsoOrNull(user.lastSyncedAt),
  localUpdatedAt: toIsoOrNull(user.localUpdatedAt),
  remoteUpdatedAt: toIsoOrNull(user.remoteUpdatedAt),
  syncVersion: Number(user.syncVersion || 0),
  syncDeviceId: user.syncDeviceId || '',
  createdAt: toIsoOrNull(user.createdAt),
  updatedAt: toIsoOrNull(user.updatedAt),
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

  ensurePatientUser(userId, userData = {}, syncOptions = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const existingUser = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
    if (existingUser) {
      return existingUser;
    }

    const now = new Date();
    const markPending = syncOptions.markPending === true;
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
      syncStatus: syncOptions.syncStatus || (markPending ? SYNC_STATUS.PENDING : SYNC_STATUS.SYNCED),
      syncOperation: syncOptions.syncOperation ?? (markPending ? SYNC_OPERATION.CREATE : ''),
      syncError: syncOptions.syncError || '',
      lastSyncedAt: toNullableDate(syncOptions.lastSyncedAt),
      localUpdatedAt: toNullableDate(syncOptions.localUpdatedAt) || now,
      remoteUpdatedAt: toNullableDate(syncOptions.remoteUpdatedAt),
      syncVersion: Number(syncOptions.syncVersion || 0) + (markPending ? 1 : 0),
      syncDeviceId: syncOptions.syncDeviceId || '',
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
      const operation = existingUser.syncOperation === SYNC_OPERATION.CREATE ? SYNC_OPERATION.CREATE : SYNC_OPERATION.UPDATE;
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
          syncStatus: SYNC_STATUS.PENDING,
          syncOperation: operation,
          syncError: '',
          lastSyncedAt: toNullableDate(existingUser.lastSyncedAt),
          localUpdatedAt: now,
          remoteUpdatedAt: toNullableDate(existingUser.remoteUpdatedAt),
          syncVersion: Number(existingUser.syncVersion || 0) + 1,
          syncDeviceId: existingUser.syncDeviceId || '',
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

  listPendingUserSyncChanges(userId) {
    const normalizedUserId = normalizeUserId(userId);
    const user = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
    if (!user || (user.syncStatus !== SYNC_STATUS.PENDING && user.syncStatus !== SYNC_STATUS.ERROR)) {
      return [];
    }

    return [toPlainUser(user)];
  }

  markUserSynced(userId, remoteUpdatedAt = new Date()) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const user = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
      if (!user) return false;

      const syncedAt = new Date();
      user.syncStatus = SYNC_STATUS.SYNCED;
      user.syncOperation = '';
      user.syncError = '';
      user.lastSyncedAt = syncedAt;
      user.remoteUpdatedAt = toNullableDate(remoteUpdatedAt) || syncedAt;
      return true;
    });
  }

  markUserSyncError(userId, error) {
    const normalizedUserId = normalizeUserId(userId);
    return this.write(() => {
      const user = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
      if (!user) return false;

      user.syncStatus = SYNC_STATUS.ERROR;
      user.syncError = error instanceof Error ? error.message : String(error || 'Sync failed.');
      return true;
    });
  }

  upsertRemoteUser(userId, remoteData = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const remoteUpdatedAt = toNullableDate(remoteData.remoteUpdatedAt || remoteData.updatedAt || remoteData.lastSyncedAt) || new Date();

    return this.write(() => {
      const existingUser = this.realm.objectForPrimaryKey('PatientUser', normalizedUserId);
      const localUpdatedAt = toNullableDate(existingUser?.localUpdatedAt || existingUser?.updatedAt);
      const hasUnpushedLocalChange =
        existingUser &&
        (existingUser.syncStatus === SYNC_STATUS.PENDING || existingUser.syncStatus === SYNC_STATUS.ERROR) &&
        localUpdatedAt &&
        localUpdatedAt.getTime() >= remoteUpdatedAt.getTime();

      if (hasUnpushedLocalChange) {
        return toPlainUser(existingUser);
      }

      const now = new Date();
      const savedUser = this.realm.create('PatientUser', {
        userId: normalizedUserId,
        role: remoteData.role || existingUser?.role || 'patient',
        phoneNum: normalizeOptionalString(remoteData.phoneNum ?? existingUser?.phoneNum),
        email: normalizeOptionalString(remoteData.email ?? existingUser?.email) || DEFAULT_PATIENT_EMAIL,
        password: normalizeOptionalString(remoteData.password ?? existingUser?.password),
        passwordHash: remoteData.passwordHash ?? existingUser?.passwordHash ?? null,
        fullName: normalizeOptionalString(remoteData.fullName ?? existingUser?.fullName),
        birthDate: toNullableDate(remoteData.birthDate),
        address: normalizeOptionalString(remoteData.address ?? existingUser?.address),
        profilePicture: normalizeOptionalString(remoteData.profilePicture ?? existingUser?.profilePicture),
        syncStatus: SYNC_STATUS.SYNCED,
        syncOperation: '',
        syncError: '',
        lastSyncedAt: now,
        localUpdatedAt: remoteUpdatedAt,
        remoteUpdatedAt,
        syncVersion: Number(remoteData.syncVersion || existingUser?.syncVersion || 0),
        syncDeviceId: remoteData.syncDeviceId || existingUser?.syncDeviceId || '',
        createdAt: toNullableDate(remoteData.createdAt) || existingUser?.createdAt || now,
        updatedAt: toNullableDate(remoteData.updatedAt) || now,
      }, 'modified');

      return toPlainUser(savedUser);
    });
  }
}
