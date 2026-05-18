import FirebaseApptSyncService from './FirebaseApptSyncService';
import FirebaseMedUnitSyncService from './FirebaseMedUnitSyncService';
import FirebaseMedSyncService from './FirebaseMedSyncService';
import FirebaseUserSettingsSyncService from './FirebaseUserSettingsSyncService';

export default class FirebaseSyncService {
  constructor({
    firestoreDb,
    medRepository = null,
    apptRepository = null,
    medUnitRepository = null,
    userRepository = null,
    settingsRepository = null,
    firestoreApi = null,
  } = {}) {
    this.medSyncService = medRepository
      ? new FirebaseMedSyncService({
          localRepository: medRepository,
          firestoreDb,
          firestoreApi,
        })
      : null;
    this.apptSyncService = apptRepository
      ? new FirebaseApptSyncService({
          localRepository: apptRepository,
          firestoreDb,
          firestoreApi,
      })
      : null;
    this.medUnitSyncService = medUnitRepository
      ? new FirebaseMedUnitSyncService({
          localRepository: medUnitRepository,
          firestoreDb,
          firestoreApi,
        })
      : null;
    this.userSettingsSyncService = userRepository || settingsRepository
      ? new FirebaseUserSettingsSyncService({
          firestoreDb,
          userRepository,
          settingsRepository,
          firestoreApi,
        })
      : null;
  }

  async syncAll(userId) {
    const results = {};

    if (this.medSyncService) {
      results.medicines = await this.medSyncService.syncAll(userId);
    }

    if (this.apptSyncService) {
      results.appointments = await this.apptSyncService.syncAll(userId);
    }

    if (this.medUnitSyncService) {
      results.medicineUnits = await this.medUnitSyncService.syncAll(userId);
    }

    if (this.userSettingsSyncService) {
      results.userSettings = await this.userSettingsSyncService.syncAll(userId);
    }

    return results;
  }
}
