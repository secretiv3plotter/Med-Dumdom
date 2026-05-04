import {
  MED_TRACKER_REALM_SCHEMA_VERSION,
  MedEntrySchema,
  MedTrackerDailyHistorySchema,
  PatientUserSchema,
  ApptEntrySchema,
  ApptTrackerHistorySchema,
  medTrackerRealmConfig,
  medTrackerRealmSchemas,
} from '../medTrackerSchemas';

describe('med tracker Realm schemas', () => {
  it('exports the current schema set and version', () => {
    expect(MED_TRACKER_REALM_SCHEMA_VERSION).toBe(5);
    expect(medTrackerRealmConfig.schema).toBe(medTrackerRealmSchemas);
    expect(medTrackerRealmSchemas.map((schema) => schema.name)).toEqual([
      'PatientUser',
      'MedDailySchedule',
      'MedEntry',
      'MedDailyScheduleHistory',
      'MedTrackerDailyHistory',
      'ApptEntry',
      'ApptTrackerHistory',
    ]);
  });

  it('stores patient users, current medicine entries, and daily history snapshots', () => {
    expect(PatientUserSchema.primaryKey).toBe('userId');

    expect(MedEntrySchema.primaryKey).toBe('medEntryId');
    expect(MedEntrySchema.properties.patientUserId).toMatchObject({ type: 'string', indexed: true });
    expect(MedEntrySchema.properties.dailySched).toBe('MedDailySchedule[]');
    expect(MedEntrySchema.properties.inventoryCount).toBeUndefined();
    expect(MedEntrySchema.properties.isDeleted).toMatchObject({ type: 'bool', default: false });
    expect(MedEntrySchema.properties.deletedAt).toBe('date?');

    expect(MedTrackerDailyHistorySchema.primaryKey).toBe('historyId');
    expect(MedTrackerDailyHistorySchema.properties.patientUserId).toMatchObject({ type: 'string', indexed: true });
    expect(MedTrackerDailyHistorySchema.properties.medEntryId).toMatchObject({ type: 'string', indexed: true });
    expect(MedTrackerDailyHistorySchema.properties.dailySchedFinalStatuses).toBe('MedDailyScheduleHistory[]');
    expect(MedTrackerDailyHistorySchema.properties.inventoryCount).toBeUndefined();
    expect(MedTrackerDailyHistorySchema.properties.isDeleted).toMatchObject({ type: 'bool', default: false });
    expect(MedTrackerDailyHistorySchema.properties.deletedAt).toBe('date?');
  });

  it('stores current appointment entries and appointment history snapshots', () => {
    expect(ApptEntrySchema.primaryKey).toBe('apptEntryId');
    expect(ApptEntrySchema.properties.patientUserId).toMatchObject({ type: 'string', indexed: true });
    expect(ApptEntrySchema.properties.doctorName).toBe('string?');
    expect(ApptEntrySchema.properties.contactNumber).toBe('string?');
    expect(ApptEntrySchema.properties.isSkipped).toMatchObject({ type: 'bool', default: false });
    expect(ApptEntrySchema.properties.isDeleted).toMatchObject({ type: 'bool', default: false });

    expect(ApptTrackerHistorySchema.primaryKey).toBe('historyId');
    expect(ApptTrackerHistorySchema.properties.patientUserId).toMatchObject({ type: 'string', indexed: true });
    expect(ApptTrackerHistorySchema.properties.apptEntryId).toMatchObject({ type: 'string', indexed: true });
    expect(ApptTrackerHistorySchema.properties.finalStatus).toBe('string');
    expect(ApptTrackerHistorySchema.properties.recordDeletedAt).toBe('date?');
  });
});
