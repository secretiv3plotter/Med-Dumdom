import { realmEncryptionKey } from './encryptionKey';

const PatientUserSchema = {
  name: 'PatientUser',
  primaryKey: 'userId',
  properties: {
    userId: 'string',
    role: { type: 'string', default: 'patient' },
    phoneNum: 'string?',
    email: { type: 'string', indexed: true },
    password: 'string?',
    passwordHash: 'string?',
    fullName: 'string?',
    birthDate: 'date?',
    address: 'string?',
    profilePicture: 'string?',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const AccessibilityPreferenceSchema = {
  name: 'AccessibilityPreference',
  primaryKey: 'userId',
  properties: {
    userId: 'string',
    textSizeLevel: { type: 'double', default: 1.0 },
    highContrastEnabled: { type: 'bool', default: false },
    hapticEnabled: { type: 'bool', default: true },
    colorBlindModeEnabled: { type: 'bool', default: false },
    darkModeEnabled: { type: 'bool', default: false },
    createdAt: 'date',
    updatedAt: 'date',
  },
};

const MedUnitSchema = {
  name: 'MedUnit',
  primaryKey: 'unitId',
  properties: {
    unitId: 'string',
    name: 'string',
    isCustom: 'bool',
  },
};

const MedDailyScheduleSchema = {
  name: 'MedDailySchedule',
  embedded: true,
  properties: {
    scheduleIndex: 'int',
    doseSize: 'int',
    scheduledTime: 'string?',
    intervalMinutes: 'int?',
    intervalUnit: 'string?',
    intervalCount: 'int?',
    dayOfWeek: 'string?',
    monthOfYear: 'string?',
    dayOfMonth: 'int?',
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
    totalPrescribedDoses: 'int?',
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
    intervalMinutes: 'int?',
    intervalUnit: 'string?',
    intervalCount: 'int?',
    dayOfWeek: 'string?',
    monthOfYear: 'string?',
    dayOfMonth: 'int?',
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
  AccessibilityPreferenceSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedUnitSchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
  ApptEntrySchema,
  ApptTrackerHistorySchema,
];

export const REALM_SCHEMA_VERSION = 17;

export const realmConfig = {
  schema: realmSchemas,
  schemaVersion: REALM_SCHEMA_VERSION,
  encryptionKey: realmEncryptionKey,
};

export {
  PatientUserSchema,
  AccessibilityPreferenceSchema,
  MedDailyScheduleSchema,
  MedEntrySchema,
  MedUnitSchema,
  MedDailyScheduleHistorySchema,
  MedTrackerDailyHistorySchema,
  ApptEntrySchema,
  ApptTrackerHistorySchema,
};
