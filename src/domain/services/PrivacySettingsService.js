// PrivacySettingsService
// Role:
// Own the business logic for patient privacy permissions.
// This service decides what caregivers are allowed to access or modify.
//
// What belongs here:
// - exposing privacy settings for the current patient
// - toggling privacy permissions that exist in PatientPrivacyModel
// - validating which role can view or edit a resource
// - checking if a caregiver can access medication, appointment, or report data
// - checking if export permissions are allowed
//
// Use cases covered:
// - patient sets what data caregivers can access
// - caregiver can only manage what the patient allowed them to
//
// What should NOT belong here:
// - login or authentication logic
// - Realm persistence details
// - actual UI permission dialogs
// - data export formatting
//
// Model methods this service should wrap:
// - toggleMedTrackerPermit()
// - toggleConsultTrackerPermit()
// - toggleViewReportPermit()
// - toggleModifyMedTracker()
// - toggleModifyApptTracker()
// - toggleManualCaregiverReminderPermit()
// - toggleExportMedReportPermit()
// - toggleExportApptReportPermit()
//
// Suggested service methods:
// - getPrivacySettings(patientId)
// - updatePrivacySettings(patientId, payload)
// - canCaregiverViewMedTracker(patientId, caregiverId)
// - canCaregiverViewApptTracker(patientId, caregiverId)
// - canCaregiverViewReports(patientId, caregiverId)
// - canCaregiverModifyMedTracker(patientId, caregiverId)
// - canCaregiverModifyApptTracker(patientId, caregiverId)
// - canCaregiverSendManualReminder(patientId, caregiverId)
//
// Notes:
// - this service should enforce patient-owned control over caregiver access
// - keep the service aligned with the exact permissions exposed by PatientPrivacyModel
//
// Dependencies:
// - direct dependencies: none
// - commonly used by: PatientCaregiverLinkService, resource access checks in tracker/report services

import PatientPrivacy from '../models/PatientPrivacyModel';

const PRIVACY_FIELDS = new Set([
  'medTrackerPermit',
  'consultTrackerPermit',
  'viewReportPermit',
  'modifyMedTracker',
  'modifyApptTracker',
  'manualCaregiverReminderPermit',
  'exportMedReportPermit',
  'exportApptReportPermit',
]);

const clonePrivacySettings = (settings) =>
  new PatientPrivacy({
    medTrackerPermit: settings.medTrackerPermit,
    consultTrackerPermit: settings.consultTrackerPermit,
    viewReportPermit: settings.viewReportPermit,
    modifyMedTracker: settings.modifyMedTracker,
    modifyApptTracker: settings.modifyApptTracker,
    manualCaregiverReminderPermit: settings.manualCaregiverReminderPermit,
    exportMedReportPermit: settings.exportMedReportPermit,
    exportApptReportPermit: settings.exportApptReportPermit,
  });

const normalizeEntityId = (value, fieldName) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new RangeError(`${fieldName} cannot be empty.`);
    }

    return trimmedValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError(`${fieldName} must be a non-empty string or a finite number.`);
};

const toPrivacyModel = (settings) => {
  if (settings instanceof PatientPrivacy) {
    return clonePrivacySettings(settings);
  }

  if (settings && typeof settings === 'object') {
    return new PatientPrivacy(settings);
  }

  return new PatientPrivacy();
};

const normalizeAccessChecker = (value) =>
  typeof value === 'function' ? value : null;

const validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('payload must be a plain object.');
  }

  const entries = Object.entries(payload);
  entries.forEach(([fieldName, value]) => {
    if (!PRIVACY_FIELDS.has(fieldName)) {
      throw new RangeError(`Unknown privacy setting: ${fieldName}.`);
    }

    if (typeof value !== 'boolean') {
      throw new TypeError(`${fieldName} must be a boolean.`);
    }
  });

  return entries;
};

export class PrivacySettingsService {
  constructor(initialSettingsByPatientId = null, options = {}) {
    this.settingsByPatientId = new Map();
    this.caregiverAccessChecker =
      normalizeAccessChecker(options.canCaregiverAccessPatient) ?? (() => false);

    if (initialSettingsByPatientId instanceof Map) {
      initialSettingsByPatientId.forEach((settings, patientId) => {
        this.settingsByPatientId.set(normalizeEntityId(patientId, 'patientId'), toPrivacyModel(settings));
      });
      return;
    }

    if (initialSettingsByPatientId && typeof initialSettingsByPatientId === 'object') {
      Object.entries(initialSettingsByPatientId).forEach(([patientId, settings]) => {
        this.settingsByPatientId.set(normalizeEntityId(patientId, 'patientId'), toPrivacyModel(settings));
      });
    }
  }

  getPrivacySettings(patientId) {
    return clonePrivacySettings(this._getStoredSettings(patientId));
  }

  updatePrivacySettings(patientId, payload) {
    const settings = this._getStoredSettings(patientId);
    const entries = validatePayload(payload);

    entries.forEach(([fieldName, value]) => {
      if (settings[fieldName] === value) {
        return;
      }

      switch (fieldName) {
        case 'medTrackerPermit':
          settings.toggleMedTrackerPermit();
          break;
        case 'consultTrackerPermit':
          settings.toggleConsultTrackerPermit();
          break;
        case 'viewReportPermit':
          settings.toggleViewReportPermit();
          break;
        case 'modifyMedTracker':
          settings.toggleModifyMedTracker();
          break;
        case 'modifyApptTracker':
          settings.toggleModifyApptTracker();
          break;
        case 'manualCaregiverReminderPermit':
          settings.toggleManualCaregiverReminderPermit();
          break;
        case 'exportMedReportPermit':
          settings.toggleExportMedReportPermit();
          break;
        case 'exportApptReportPermit':
          settings.toggleExportApptReportPermit();
          break;
        default:
          break;
      }
    });

    return clonePrivacySettings(settings);
  }

  canCaregiverViewMedTracker(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    return this._getStoredSettings(patientId).medTrackerPermit;
  }

  canCaregiverViewApptTracker(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    return this._getStoredSettings(patientId).consultTrackerPermit;
  }

  canCaregiverViewReports(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    return this._getStoredSettings(patientId).viewReportPermit;
  }

  canCaregiverModifyMedTracker(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    const settings = this._getStoredSettings(patientId);
    return settings.medTrackerPermit && settings.modifyMedTracker;
  }

  canCaregiverModifyApptTracker(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    const settings = this._getStoredSettings(patientId);
    return settings.consultTrackerPermit && settings.modifyApptTracker;
  }

  canCaregiverSendManualReminder(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    return this._getStoredSettings(patientId).manualCaregiverReminderPermit;
  }

  canCaregiverExportMedReport(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    const settings = this._getStoredSettings(patientId);
    return settings.viewReportPermit && settings.exportMedReportPermit;
  }

  canCaregiverExportApptReport(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);
    if (!this._canCaregiverAccessPatient(patientId, caregiverId)) {
      return false;
    }

    const settings = this._getStoredSettings(patientId);
    return settings.viewReportPermit && settings.exportApptReportPermit;
  }

  canCaregiverAccessPatient(patientId, caregiverId) {
    this._assertCaregiverAccessInputs(patientId, caregiverId);

    try {
      return Boolean(this.caregiverAccessChecker(patientId, caregiverId));
    } catch {
      return false;
    }
  }

  _canCaregiverAccessPatient(patientId, caregiverId) {
    return this.canCaregiverAccessPatient(patientId, caregiverId);
  }

  _getStoredSettings(patientId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const storedSettings = this.settingsByPatientId.get(normalizedPatientId);

    if (storedSettings) {
      return storedSettings;
    }

    const defaultSettings = new PatientPrivacy();
    this.settingsByPatientId.set(normalizedPatientId, defaultSettings);
    return defaultSettings;
  }

  _assertCaregiverAccessInputs(patientId, caregiverId) {
    normalizeEntityId(patientId, 'patientId');
    normalizeEntityId(caregiverId, 'caregiverId');
  }
}

const privacySettingsService = new PrivacySettingsService();

export default privacySettingsService;
