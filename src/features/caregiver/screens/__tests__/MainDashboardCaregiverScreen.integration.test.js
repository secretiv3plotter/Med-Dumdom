import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MainDashboardCaregiver from '../MainDashboardCaregiverScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import {
  createNavigation,
  getLastByPlaceholderText,
} from '../../../../shared/test-utils/integrationTestUtils';
import patientCaregiverLinkService from '../../../../domain/services/PatientCaregiverLinkService';

describe('MainDashboardCaregiver screen integration', () => {
  it('routes header and action-card interactions through navigation', () => {
    const navigation = createNavigation();
    const { getByLabelText, getByText } = render(
      <MainDashboardCaregiver navigation={navigation} />
    );

    fireEvent.press(getByLabelText('Help'));
    fireEvent.press(getByLabelText('Profile'));
    fireEvent.press(getByText('Add a patient'));
    fireEvent.press(getByText('Review patient requests'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HELP_AND_SUPPORT);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.PROFILE);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.LINK_TO_PATIENT_MAIN);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.LINK_REQUESTS);
  });

  it('filters the patient list and opens a patient dashboard with params', () => {
    patientCaregiverLinkService.approvePatientLink('patient-3', 'current-caregiver');
    const navigation = createNavigation();
    const screen = render(<MainDashboardCaregiver navigation={navigation} />);

    fireEvent.changeText(getLastByPlaceholderText(screen, 'Find a patient'), 'Andrea');

    expect(screen.getByText('Andrea Santos')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();

    fireEvent.press(screen.getByText('Andrea Santos'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.PATIENT_SPECIFIC_DASHBOARD,
      expect.objectContaining({ patientName: 'Andrea Santos', patientId: 'patient-3' })
    );
  });
});
