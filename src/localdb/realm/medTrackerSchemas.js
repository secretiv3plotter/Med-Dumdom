import { realmEncryptionKey } from './encryptionKey';

const PatientUserSchema = {
  name: 'PatientUser',
  primaryKey: 'userId',
  properties: {
    userId: 'string',
    email: { type: 'string', indexed: true },
    passwordHash: 'string?',
    fullName: 'string?',
    birthDate: 'date?',
    address: 'string?',
    profilePicture: 'string?',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const MedDailyScheduleSchema = {
  name: 'MedDailySchedule',
  embedded: true,
  properties: {
    scheduleIndex: 'int',
    scheduleType: 'string',
    doseSize: 'int',
    scheduledTime: 'string?',
    mealContext: 'string?',
    associatedMeal: 'string?',
    mealTime: 'string?',
    instructions: 'string?',
    status: 'string',
    takenAt: 'date?',
    skippedAt: 'date?',
    activatedAt: 'date?',
  },
};

const MedEntrySchema = {
  name: 'MedEntry',
  primaryKey: 'medEntryId',
  properties: {
    medEntryId: 'string',
    patientUserId: { type: 'string', indexed: true },
    medName: 'string',
    unitStrength: 'string',
    unit: 'string',
    totalDailyAmount: 'int',
    dailySched: 'MedDailySchedule[]',
    startDate: 'date',
    endDate: 'date?',
    instructions: 'string?',
    prescriberContact: 'string?',
    isDeleted: { type: 'bool', default: false },
    deletedAt: 'date?',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const MedDailyScheduleHistorySchema = {
  name: 'MedDailyScheduleHistory',
  embedded: true,
  properties: {
    scheduleIndex: 'int',
    scheduleType: 'string',
    doseSize: 'int',
    scheduledTime: 'string?',
    mealContext: 'string?',
    associatedMeal: 'string?',
    mealTime: 'string?',
    instructions: 'string?',
    finalStatus: 'string',
    takenAt: 'date?',
    skippedAt: 'date?',
    activatedAt: 'date?',
    resolvedAt: 'date?',
  },
};

const MedTrackerDailyHistorySchema = {
  name: 'MedTrackerDailyHistory',
  primaryKey: 'historyId',
  properties: {
    historyId: 'string',
    patientUserId: { type: 'string', indexed: true },
    medEntryId: { type: 'string', indexed: true },
    historyDate: { type: 'string', indexed: true },
    medName: 'string',
    unitStrength: 'string',
    unit: 'string',
    totalDailyAmount: 'int',
    startDate: 'date',
    endDate: 'date?',
    instructions: 'string?',
    prescriberContact: 'string?',
    dailySchedFinalStatuses: 'MedDailyScheduleHistory[]',
    completedAllSchedules: { type: 'bool', default: false },
    isDeleted: { type: 'bool', default: false },
    deletedAt: 'date?',
    createdAt: 'date',
  },
};

export const medTrackerRealmSchemas = [
  PatientUserSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
];

export const MED_TRACKER_REALM_SCHEMA_VERSION = 4;

export const medTrackerRealmConfig = {
  schema: medTrackerRealmSchemas,
  schemaVersion: MED_TRACKER_REALM_SCHEMA_VERSION,
  encryptionKey: realmEncryptionKey,
};

export {
  PatientUserSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
};
