import { FIREBASE_INSTALL_MESSAGE } from '../localdb/firebase/firebaseClient';

const loadFirestoreApi = async () => {
  try {
    const firestore = await import('firebase/firestore');
    return {
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      setDoc: firestore.setDoc,
    };
  } catch (error) {
    const nextError = new Error(FIREBASE_INSTALL_MESSAGE);
    nextError.cause = error;
    throw nextError;
  }
};

export default class FirebaseUserSettingsSyncService {
  constructor({
    firestoreDb,
    userRepository = null,
    settingsRepository = null,
    firestoreApi = null,
  } = {}) {
    this.firestoreDb = firestoreDb;
    this.userRepository = userRepository;
    this.settingsRepository = settingsRepository;
    this.firestoreApi = firestoreApi;
  }

  async getFirestoreApi() {
    if (!this.firestoreDb) {
      throw new Error('Firestore database is required before syncing user data.');
    }

    if (!this.firestoreApi) {
      this.firestoreApi = await loadFirestoreApi();
    }

    return this.firestoreApi;
  }

  async syncAll(userId) {
    const user = this.userRepository ? await this.syncUser(userId) : null;
    const settings = this.settingsRepository ? await this.syncSettings(userId) : null;
    return { user, settings };
  }

  async syncUser(userId) {
    const { doc, getDoc, setDoc } = await this.getFirestoreApi();
    const documentRef = doc(this.firestoreDb, 'users', String(userId), 'profile', 'current');
    let pushed = 0;
    let pulled = 0;

    const changes = this.userRepository.listPendingUserSyncChanges(userId);
    for (const change of changes) {
      try {
        const payload = {
          ...change,
          remoteUpdatedAt: new Date().toISOString(),
        };
        await setDoc(documentRef, payload, { merge: true });
        this.userRepository.markUserSynced(userId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.userRepository.markUserSyncError(userId, error);
      }
    }

    const snapshot = await getDoc(documentRef);
    if (snapshot.exists()) {
      this.userRepository.upsertRemoteUser(userId, snapshot.data());
      pulled += 1;
    }

    return { pushed, pulled };
  }

  async syncSettings(userId) {
    const { doc, getDoc, setDoc } = await this.getFirestoreApi();
    const documentRef = doc(this.firestoreDb, 'users', String(userId), 'settings', 'accessibility');
    let pushed = 0;
    let pulled = 0;

    const changes = this.settingsRepository.listPendingSettingsSyncChanges(userId);
    for (const change of changes) {
      try {
        const payload = {
          ...change,
          remoteUpdatedAt: new Date().toISOString(),
        };
        await setDoc(documentRef, payload, { merge: true });
        this.settingsRepository.markSettingsSynced(userId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.settingsRepository.markSettingsSyncError(userId, error);
      }
    }

    const snapshot = await getDoc(documentRef);
    if (snapshot.exists()) {
      this.settingsRepository.upsertRemoteSettings(userId, snapshot.data());
      pulled += 1;
    }

    return { pushed, pulled };
  }
}
