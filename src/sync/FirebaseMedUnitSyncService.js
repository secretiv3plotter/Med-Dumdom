import { FIREBASE_INSTALL_MESSAGE } from '../localdb/firebase/firebaseClient';

const loadFirestoreApi = async () => {
  try {
    const firestore = await import('firebase/firestore');
    return {
      collection: firestore.collection,
      deleteDoc: firestore.deleteDoc,
      doc: firestore.doc,
      getDocs: firestore.getDocs,
      setDoc: firestore.setDoc,
    };
  } catch (error) {
    const nextError = new Error(FIREBASE_INSTALL_MESSAGE);
    nextError.cause = error;
    throw nextError;
  }
};

export default class FirebaseMedUnitSyncService {
  constructor({ localRepository, firestoreDb, firestoreApi = null } = {}) {
    if (!localRepository) {
      throw new Error('localRepository is required for medicine unit sync.');
    }

    this.localRepository = localRepository;
    this.firestoreDb = firestoreDb;
    this.firestoreApi = firestoreApi;
  }

  async getFirestoreApi() {
    if (!this.firestoreDb) {
      throw new Error('Firestore database is required before syncing medicine units.');
    }

    if (!this.firestoreApi) {
      this.firestoreApi = await loadFirestoreApi();
    }

    return this.firestoreApi;
  }

  async getUnitsCollection(userId) {
    const { collection } = await this.getFirestoreApi();
    return collection(this.firestoreDb, 'users', String(userId), 'medicineUnits');
  }

  async syncAll(userId) {
    const pushed = await this.pushPendingChanges(userId);
    const pulled = await this.pullRemoteChanges(userId);
    return { pushed, pulled };
  }

  async pushPendingChanges(userId) {
    const { deleteDoc, doc, setDoc } = await this.getFirestoreApi();
    const unitsCollection = await this.getUnitsCollection(userId);
    const changes = this.localRepository.listPendingMedUnitSyncChanges();
    let pushed = 0;

    for (const change of changes) {
      try {
        const documentRef = doc(unitsCollection, change.unitId);

        if (change.syncOperation === 'create' && change.isDeleted) {
          this.localRepository.hardDeleteMedUnit(change.unitId);
          pushed += 1;
          continue;
        }

        if (change.syncOperation === 'delete' || change.isDeleted) {
          await deleteDoc(documentRef);
          this.localRepository.hardDeleteMedUnit(change.unitId);
          pushed += 1;
          continue;
        }

        const payload = {
          ...change,
          remoteUpdatedAt: new Date().toISOString(),
        };
        await setDoc(documentRef, payload, { merge: true });
        this.localRepository.markMedUnitSynced(change.unitId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.localRepository.markMedUnitSyncError(change.unitId, error);
      }
    }

    return pushed;
  }

  async pullRemoteChanges(userId) {
    const { getDocs } = await this.getFirestoreApi();
    const unitsCollection = await this.getUnitsCollection(userId);
    const snapshot = await getDocs(unitsCollection);
    let pulled = 0;

    snapshot.forEach((documentSnapshot) => {
      const remoteData = documentSnapshot.data();
      this.localRepository.upsertRemoteMedUnit({
        ...remoteData,
        unitId: remoteData.unitId || documentSnapshot.id,
      });
      pulled += 1;
    });

    return pulled;
  }
}
