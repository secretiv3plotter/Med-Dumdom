import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PatientSpecificDashboard from '../PatientSpecificDashboardScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';
import patientCaregiverLinkService from '../../../../domain/services/PatientCaregiverLinkService';
import privacySettingsService from '../../../../domain/services/PrivacySettingsService';

describe('PatientSpecificDashboard screen integration', () => {
  beforeEach(() => {
    privacySettingsService.caregiverAccessChecker = (patientId, caregiverId) =>
      patientCaregiverLinkService.canCaregiverAccessPatient(patientId, caregiverId);
  });

  it('renders the selected patient information and wires header actions', () => {
    patientCaregiverLinkService.approvePatientLink('patient-1', 'current-caregiver');
    privacySettingsService.updatePrivacySettings('patient-1', {
      medTrackerPermit: true,
      consultTrackerPermit: true,
      manualCaregiverReminderPermit: true,
    });
    const navigation = createNavigation({
      currentParams: { patientId: 'patient-1', patientName: 'James Santos' },
    });
    const { getByText, getByLabelText } = render(
      <PatientSpecificDashboard navigation={navigation} />
    );

    expect(getByText("James Santos'")).toBeTruthy();
    expect(getByText('Med+Dumdum')).toBeTruthy();
    expect(() => getByLabelText('Back')).toThrow();

    fireEvent.press(getByLabelText('Help'));
    fireEvent.press(getByLabelText('Profile'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME });
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.PROFILE, { returnTo: ROUTES.HOME });
  });

  it('navigates from feature cards and the navigation bar with patient params', () => {
    patientCaregiverLinkService.approvePatientLink('patient-2', 'current-caregiver');
    privacySettingsService.updatePrivacySettings('patient-2', {
      medTrackerPermit: true,
      consultTrackerPermit: true,
      manualCaregiverReminderPermit: true,
    });
    const navigation = createNavigation({
      currentParams: { patientId: 'patient-2', patientName: 'Andrea Santos' },
    });
    const { getByText, getByLabelText } = render(
      <PatientSpecificDashboard navigation={navigation} />
    );

    fireEvent.press(getByText('Medication Tracker'));
    fireEvent.press(getByText('Consultations'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.MED_TRACKER,
      expect.objectContaining({ patientName: 'Andrea Santos' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.APPOINTMENT_TRACKER,
      expect.objectContaining({ patientName: 'Andrea Santos' })
    );
  });
});
