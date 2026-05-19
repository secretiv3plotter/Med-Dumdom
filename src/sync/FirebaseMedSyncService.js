import { FIREBASE_INSTALL_MESSAGE } from '../localdb/firebase/firebaseClient';

const MEDICINES_COLLECTION = 'medicines';

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

const serializeScheduleEntry = (entry = {}) => ({
  doseSize: Number(entry.doseSize || 0),
  scheduledTime: entry.scheduledTime || null,
  intervalMinutes: entry.intervalMinutes ? Number(entry.intervalMinutes) : null,
  intervalUnit: entry.intervalUnit || '',
  intervalCount: entry.intervalCount ? Number(entry.intervalCount) : null,
  dayOfWeek: entry.dayOfWeek || '',
  monthOfYear: entry.monthOfYear || '',
  dayOfMonth: entry.dayOfMonth ? Number(entry.dayOfMonth) : null,
  instructions: entry.instructions || '',
  status: entry.status || 'pending',
  takenAt: toIsoStringOrNull(entry.takenAt),
  skippedAt: toIsoStringOrNull(entry.skippedAt),
  activatedAt: toIsoStringOrNull(entry.activatedAt),
});

export const serializeMedEntryForFirestore = (entry = {}) => {
  const remoteUpdatedAt = new Date();

  return {
    medEntryId: entry.medEntryId,
    patientUserId: entry.patientUserId,
    medName: entry.medName || '',
    unitStrength: entry.unitStrength || '',
    unit: entry.unit || '',
    totalDailyAmount: Number(entry.totalDailyAmount || 0),
    dailySched: Array.from(entry.dailySched || []).map(serializeScheduleEntry),
    startDate: toIsoStringOrNull(entry.startDate),
    endDate: toIsoStringOrNull(entry.endDate),
    instructions: entry.instructions || '',
    prescriberContact: entry.prescriberContact || '',
    totalPrescribedDoses: entry.totalPrescribedDoses ?? null,
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

export default class FirebaseMedSyncService {
  constructor({ localRepository, firestoreDb, firestoreApi = null } = {}) {
    if (!localRepository) {
      throw new Error('localRepository is required for medicine sync.');
    }

    this.localRepository = localRepository;
    this.firestoreDb = firestoreDb;
    this.firestoreApi = firestoreApi;
  }

  async getFirestoreApi() {
    if (!this.firestoreDb) {
      throw new Error('Firestore database is required before syncing medicines.');
    }

    if (!this.firestoreApi) {
      this.firestoreApi = await loadFirestoreApi();
    }

    return this.firestoreApi;
  }

  async getUserMedicinesCollection(userId) {
    const { collection } = await this.getFirestoreApi();
    return collection(this.firestoreDb, 'users', String(userId), MEDICINES_COLLECTION);
  }

  async syncAll(userId, localUserId = userId) {
    const pushed = await this.pushPendingChanges(userId, localUserId);
    const pulled = await this.pullRemoteChanges(userId, localUserId);
    const historyPushed = await this.pushPendingHistoryChanges(userId, localUserId);
    const historyPulled = await this.pullRemoteHistoryChanges(userId, localUserId);
    return { pushed, pulled, historyPushed, historyPulled };
  }

  async pushPendingChanges(userId, localUserId = userId) {
    const { deleteDoc, doc, setDoc } = await this.getFirestoreApi();
    const medicinesCollection = await this.getUserMedicinesCollection(userId);
    const changes = this.localRepository.listPendingMedSyncChanges(localUserId);
    let pushed = 0;

    for (const change of changes) {
      try {
        const documentRef = doc(medicinesCollection, change.medEntryId);

        if (change.syncOperation === 'create' && change.isDeleted) {
          this.localRepository.hardDeleteMedEntry(localUserId, change.medEntryId);
          pushed += 1;
          continue;
        }

        if (change.syncOperation === 'delete' || change.isDeleted) {
          await deleteDoc(documentRef);
          this.localRepository.hardDeleteMedEntry(localUserId, change.medEntryId);
          pushed += 1;
          continue;
        }

        const payload = serializeMedEntryForFirestore(change);
        await setDoc(documentRef, payload, { merge: true });
        this.localRepository.markMedEntrySynced(localUserId, change.medEntryId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.localRepository.markMedEntrySyncError(localUserId, change.medEntryId, error);
      }
    }

    return pushed;
  }

  async pullRemoteChanges(userId, localUserId = userId) {
    const { getDocs } = await this.getFirestoreApi();
    const medicinesCollection = await this.getUserMedicinesCollection(userId);
    const snapshot = await getDocs(medicinesCollection);
    let pulled = 0;

    snapshot.forEach((documentSnapshot) => {
      const remoteData = documentSnapshot.data();
      this.localRepository.upsertRemoteMedEntry(localUserId, {
        ...remoteData,
        medEntryId: remoteData.medEntryId || documentSnapshot.id,
      });
      pulled += 1;
    });

    return pulled;
  }

  async getUserMedicineHistoryCollection(userId) {
    const { collection } = await this.getFirestoreApi();
    return collection(this.firestoreDb, 'users', String(userId), 'medicineHistory');
  }

  async pushPendingHistoryChanges(userId, localUserId = userId) {
    if (typeof this.localRepository.listPendingMedHistorySyncChanges !== 'function') {
      return 0;
    }

    const { deleteDoc, doc, setDoc } = await this.getFirestoreApi();
    const historyCollection = await this.getUserMedicineHistoryCollection(userId);
    const changes = this.localRepository.listPendingMedHistorySyncChanges(localUserId);
    let pushed = 0;

    for (const change of changes) {
      try {
        const documentRef = doc(historyCollection, change.historyId);

        if (change.syncOperation === 'create' && change.isDeleted) {
          this.localRepository.hardDeleteMedHistory(localUserId, change.historyId);
          pushed += 1;
          continue;
        }

        if (change.syncOperation === 'delete' || change.isDeleted) {
          await deleteDoc(documentRef);
          this.localRepository.hardDeleteMedHistory(localUserId, change.historyId);
          pushed += 1;
          continue;
        }

        const payload = {
          ...change,
          remoteUpdatedAt: new Date().toISOString(),
        };
        await setDoc(documentRef, payload, { merge: true });
        this.localRepository.markMedHistorySynced(localUserId, change.historyId, payload.remoteUpdatedAt);
        pushed += 1;
      } catch (error) {
        this.localRepository.markMedHistorySyncError(localUserId, change.historyId, error);
      }
    }

    return pushed;
  }

  async pullRemoteHistoryChanges(userId, localUserId = userId) {
    if (typeof this.localRepository.upsertRemoteMedHistory !== 'function') {
      return 0;
    }

    const { getDocs } = await this.getFirestoreApi();
    const historyCollection = await this.getUserMedicineHistoryCollection(userId);
    const snapshot = await getDocs(historyCollection);
    let pulled = 0;

    snapshot.forEach((documentSnapshot) => {
      const remoteData = documentSnapshot.data();
      this.localRepository.upsertRemoteMedHistory(localUserId, {
        ...remoteData,
        historyId: remoteData.historyId || documentSnapshot.id,
      });
      pulled += 1;
    });

    return pulled;
  }
}
