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
    doseSize: 'int',
    scheduledTime: 'string?',
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
    doseSize: 'int',
    scheduledTime: 'string?',
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

const ApptEntrySchema = {
  name: 'ApptEntry',
  primaryKey: 'apptEntryId',
  properties: {
    apptEntryId: 'string',
    patientUserId: { type: 'string', indexed: true },
    concern: 'string',
    address: 'string',
    doctorName: 'string?',
    contactNumber: 'string?',
    dateSched: { type: 'string', indexed: true },
    timeSched: 'string',
    note: 'string?',
    isCompleted: { type: 'bool', default: false },
    isSkipped: { type: 'bool', default: false },
    completedAt: 'date?',
    skippedAt: 'date?',
    isDeleted: { type: 'bool', default: false },
    deletedAt: 'date?',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const ApptTrackerHistorySchema = {
  name: 'ApptTrackerHistory',
  primaryKey: 'historyId',
  properties: {
    historyId: 'string',
    patientUserId: { type: 'string', indexed: true },
    apptEntryId: { type: 'string', indexed: true },
    concern: 'string',
    address: 'string',
    doctorName: 'string?',
    contactNumber: 'string?',
    dateSched: { type: 'string', indexed: true },
    timeSched: 'string',
    note: 'string?',
    finalStatus: 'string',
    completedAt: 'date?',
    skippedAt: 'date?',
    missedAt: 'date?',
    deletedAt: 'date?',
    isDeleted: { type: 'bool', default: false },
    recordDeletedAt: 'date?',
    createdAt: 'date',
  },
};

export const realmSchemas = [
  PatientUserSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
  ApptEntrySchema,
  ApptTrackerHistorySchema,
];

export const REALM_SCHEMA_VERSION = 8;

export const realmConfig = {
  schema: realmSchemas,
  schemaVersion: REALM_SCHEMA_VERSION,
  encryptionKey: realmEncryptionKey,
};

export {
  PatientUserSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
  ApptEntrySchema,
  ApptTrackerHistorySchema,
};
