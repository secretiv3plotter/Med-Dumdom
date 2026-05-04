// PatientCaregiverLinkService
// Role:
// Own caregiver-patient linking business logic for internet-backed use cases.
// This is the service for relationships, link requests, approval flows, and access checks.
//
// What belongs here:
// - link one patient to one caregiver
// - link many patients to one caregiver
// - request approval for linking
// - approve or reject link requests
// - unlink relationships
// - check whether a caregiver is allowed to act on a patient relationship
//
// Use cases covered:
// - patient can link to one caregiver
// - caregiver can link to many patients
// - caregiver can only manage what the patient allowed them to
// - caregiver can view patient personal profile when permitted
//
// What should NOT belong here:
// - actual networking or API calls
// - Realm-specific persistence logic
// - UI request/approval screens
// - reminder delivery
//
// Suggested service methods:
// - requestPatientLink(patientId, caregiverId)
// - approvePatientLink(patientId, caregiverId)
// - rejectPatientLink(patientId, caregiverId)
// - unlinkPatientCaregiver(patientId, caregiverId)
// - getLinkedCaregiver(patientId)
// - getLinkedPatients(caregiverId)
// - canCaregiverAccessPatient(patientId, caregiverId)
//
// Notes:
// - this service owns the relationship rules, not the database mechanics
//
// Dependencies:
// - direct dependencies: PersonalProfileService, PrivacySettingsService
// - commonly used by: caregiver linking UI, access-control checks, manual reminder flows

import { normalizeEntityId } from './serviceUtils';

const buildLinkKey = (patientId, caregiverId) => `${patientId}::${caregiverId}`;

const cloneRequest = (request) => ({ ...request });

export class PatientCaregiverLinkService {
  constructor(options = {}) {
    this.personalProfileService = options.personalProfileService ?? null;
    this.privacySettingsService = options.privacySettingsService ?? null;
    this.pendingRequests = new Map();
    this.activePatientToCaregiver = new Map();
    this.activeCaregiverToPatients = new Map();
  }

  requestPatientLink(patientId, caregiverId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    const key = buildLinkKey(normalizedPatientId, normalizedCaregiverId);
    const existing = this.pendingRequests.get(key);

    if (existing && existing.status === 'approved') {
      return cloneRequest(existing);
    }

    const request = {
      patientId: normalizedPatientId,
      caregiverId: normalizedCaregiverId,
      status: 'pending',
      requestedAt: new Date(),
      resolvedAt: null,
    };

    this.pendingRequests.set(key, request);
    return cloneRequest(request);
  }

  approvePatientLink(patientId, caregiverId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    const key = buildLinkKey(normalizedPatientId, normalizedCaregiverId);
    const request = this.pendingRequests.get(key) ?? this.requestPatientLink(normalizedPatientId, normalizedCaregiverId);

    request.status = 'approved';
    request.resolvedAt = new Date();
    this.pendingRequests.set(key, request);

    const previousCaregiverId = this.activePatientToCaregiver.get(normalizedPatientId);
    if (previousCaregiverId && previousCaregiverId !== normalizedCaregiverId) {
      this._unlinkPair(normalizedPatientId, previousCaregiverId);
    }

    this.activePatientToCaregiver.set(normalizedPatientId, normalizedCaregiverId);
    let patientSet = this.activeCaregiverToPatients.get(normalizedCaregiverId);
    if (!patientSet) {
      patientSet = new Set();
      this.activeCaregiverToPatients.set(normalizedCaregiverId, patientSet);
    }

    patientSet.add(normalizedPatientId);
    return cloneRequest(request);
  }

  rejectPatientLink(patientId, caregiverId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    const key = buildLinkKey(normalizedPatientId, normalizedCaregiverId);
    const request = this.pendingRequests.get(key) ?? this.requestPatientLink(normalizedPatientId, normalizedCaregiverId);
    request.status = 'rejected';
    request.resolvedAt = new Date();
    this.pendingRequests.set(key, request);
    return cloneRequest(request);
  }

  unlinkPatientCaregiver(patientId, caregiverId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    const unlinked = this._unlinkPair(normalizedPatientId, normalizedCaregiverId);
    return unlinked;
  }

  getLinkedCaregiver(patientId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    return this.activePatientToCaregiver.get(normalizedPatientId) ?? null;
  }

  getLinkedPatients(caregiverId) {
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    const patientSet = this.activeCaregiverToPatients.get(normalizedCaregiverId);
    return patientSet ? [...patientSet] : [];
  }

  getPendingRequestsForCaregiver(caregiverId) {
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    return [...this.pendingRequests.values()]
      .filter((request) => request.caregiverId === normalizedCaregiverId && request.status === 'pending')
      .map(cloneRequest);
  }

  getOutgoingRequestsForPatient(patientId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    return [...this.pendingRequests.values()]
      .filter((request) => request.patientId === normalizedPatientId && request.status === 'pending')
      .map(cloneRequest);
  }

  canCaregiverAccessPatient(patientId, caregiverId) {
    const normalizedPatientId = normalizeEntityId(patientId, 'patientId');
    const normalizedCaregiverId = normalizeEntityId(caregiverId, 'caregiverId');
    return this.activePatientToCaregiver.get(normalizedPatientId) === normalizedCaregiverId;
  }

  _unlinkPair(patientId, caregiverId) {
    const currentCaregiver = this.activePatientToCaregiver.get(patientId);
    if (currentCaregiver !== caregiverId) {
      return false;
    }

    this.activePatientToCaregiver.delete(patientId);
    const patientSet = this.activeCaregiverToPatients.get(caregiverId);
    if (patientSet) {
      patientSet.delete(patientId);
      if (!patientSet.size) {
        this.activeCaregiverToPatients.delete(caregiverId);
      }
    }

    return true;
  }
}

const patientCaregiverLinkService = new PatientCaregiverLinkService();

export default patientCaregiverLinkService;
