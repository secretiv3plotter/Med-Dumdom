import { FIREBASE_INSTALL_MESSAGE } from '../localdb/firebase/firebaseClient';

const APPOINTMENTS_COLLECTION = 'appointments';

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoStringOrNull = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

export const serializeApptEntryForFirestore = (entry = {}) => {
  const remoteUpdatedAt = new Date();

  return {
    apptEntryId: entry.apptEntryId,
    patientUserId: entry.patientUserId,
    concern: entry.concern || '',
    address: entry.address || '',
    doctorName: entry.doctorName || '',
    contactNumber: entry.contactNumber || '',
    dateSched: entry.dateSched || '',
    timeSched: entry.timeSched || '',
    note: entry.note || '',
    isCompleted: Boolean(entry.isCompleted),
    isSkipped: Boolean(entry.isSkipped),
    completedAt: toIsoStringOrNull(entry.completedAt),
    skippedAt: toIsoStringOrNull(entry.skippedAt),
    isDeleted: Boolean(entry.isDeleted),
    deletedAt: toIsoStringOrNull(entry.deletedAt),
    syncVersion: Number(entry.syncVersion || 0),
    syncDeviceId: entry.syncDeviceId || '',
    createdAt: toIsoStringOrNull(entry.createdAt),
    updatedAt: toIsoStringOrNull(entry.updatedAt),
    remoteUpdatedAt: remoteUpdatedAt.toISOString(),
  };
};

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

export default class FirebaseApptSyncService {
  constructor({ localRepository, firestoreDb, firestoreApi = null } = {}) {
    if (!localRepository) {
      throw new Error('localRepository is required for appointment sync.');
    }

    this.localRepository = localRepository;
    this.firestoreDb = firestoreDb;
    this.firestoreApi = firestoreApi;
  }

  async getFirestoreApi() {
    if (!this.firestoreDb) {
      throw new Error('Firestore database is required before syncing appointments.');
    }

    if (!this.firestoreApi) {
      this.firestoreApi = await loadFirestoreApi();
    }

    return this.firestoreApi;
  }

  async getUserAppointmentsCollection(userId) {
    const { collection } = await this.getFirestoreApi();
    return collection(this.firestoreDb, 'users', String(userId), APPOINTMENTS_COLLECTION);
  }

  async syncAll(userId) {
    const pushed = await this.pushPendingChanges(userId);
    const pulled = await this.pullRemoteChanges(userId);
    const historyPushed = await this.pushPendingHistoryChanges(userId);
    const historyPulled = await this.pullRemoteHistoryChanges(userId);
    return { pushed, pulled, historyPushed, historyPulled };
  }

  async pushPendingChanges(userId) {
    const { deleteDoc, doc, setDoc } = await this.getFirestoreApi();
    const appointmentsCollection = await this.getUserAppointmentsCollection(userId);
    const changes = this.localRepository.listPendingApptSyncChanges(userId);
    let pushed = 0;

    for (const change of changes) {
      try {
        const documentRef = doc(appointmentsCollection, change.apptEntryId);

        if (change.syncOperation === 'create' && change.isDeleted) {
          this.localRepository.hardDeleteApptEntry(userId, change.apptEntryId);
          pushed += 1;
          continue;
        }

        if (change.syncOperation === 'delete' || change.isDeleted) {
          await deleteDoc(documentRef);
          this.localRepository.hardDeleteApptEntry(userId, change.apptEntryId);
          pushed += 1;
          continue;
        }

        const payload = serializeApptEntryForFirestore(change);
        await setDoc(documentRef, payload, { merge: true });
        this.localRepository.markApptEntrySynced(userId, change.apptEntryId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.localRepository.markApptEntrySyncError(userId, change.apptEntryId, error);
      }
    }

    return pushed;
  }

  async pullRemoteChanges(userId) {
    const { getDocs } = await this.getFirestoreApi();
    const appointmentsCollection = await this.getUserAppointmentsCollection(userId);
    const snapshot = await getDocs(appointmentsCollection);
    let pulled = 0;

    snapshot.forEach((documentSnapshot) => {
      const remoteData = documentSnapshot.data();
      this.localRepository.upsertRemoteApptEntry(userId, {
        ...remoteData,
        apptEntryId: remoteData.apptEntryId || documentSnapshot.id,
      });
      pulled += 1;
    });

    return pulled;
  }

  async getUserAppointmentHistoryCollection(userId) {
    const { collection } = await this.getFirestoreApi();
    return collection(this.firestoreDb, 'users', String(userId), 'appointmentHistory');
  }

  async pushPendingHistoryChanges(userId) {
    if (typeof this.localRepository.listPendingApptHistorySyncChanges !== 'function') {
      return 0;
    }

    const { deleteDoc, doc, setDoc } = await this.getFirestoreApi();
    const historyCollection = await this.getUserAppointmentHistoryCollection(userId);
    const changes = this.localRepository.listPendingApptHistorySyncChanges(userId);
    let pushed = 0;

    for (const change of changes) {
      try {
        const documentRef = doc(historyCollection, change.historyId);

        if (change.syncOperation === 'create' && change.isDeleted) {
          this.localRepository.hardDeleteApptHistory(userId, change.historyId);
          pushed += 1;
          continue;
        }

        if (change.syncOperation === 'delete' || change.isDeleted) {
          await deleteDoc(documentRef);
          this.localRepository.hardDeleteApptHistory(userId, change.historyId);
          pushed += 1;
          continue;
        }

        const payload = {
          ...change,
          remoteUpdatedAt: new Date().toISOString(),
        };
        await setDoc(documentRef, payload, { merge: true });
        this.localRepository.markApptHistorySynced(userId, change.historyId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.localRepository.markApptHistorySyncError(userId, change.historyId, error);
      }
    }

    return pushed;
  }

  async pullRemoteHistoryChanges(userId) {
    if (typeof this.localRepository.upsertRemoteApptHistory !== 'function') {
      return 0;
    }

    const { getDocs } = await this.getFirestoreApi();
    const historyCollection = await this.getUserAppointmentHistoryCollection(userId);
    const snapshot = await getDocs(historyCollection);
    let pulled = 0;

    snapshot.forEach((documentSnapshot) => {
      const remoteData = documentSnapshot.data();
      this.localRepository.upsertRemoteApptHistory(userId, {
        ...remoteData,
        historyId: remoteData.historyId || documentSnapshot.id,
      });
      pulled += 1;
    });

    return pulled;
  }
}
