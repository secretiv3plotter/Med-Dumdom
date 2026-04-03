import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PatientSpecificDashboard from './PatientSpecificDashboard';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('PatientSpecificDashboard screen integration', () => {
  it('renders the selected patient information and wires header actions', () => {
    const navigation = createNavigation({
      currentParams: { patientName: 'James Santos' },
    });
    const { getByText, getByLabelText } = render(
      <PatientSpecificDashboard navigation={navigation} />
    );

    expect(getByText("James Santos'")).toBeTruthy();
    expect(getByText('Med+Dumdum')).toBeTruthy();

    fireEvent.press(getByLabelText('Help'));
    fireEvent.press(getByLabelText('Profile'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HELP_AND_SUPPORT);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.PROFILE);
  });

  it('navigates from feature cards and the navigation bar with patient params', () => {
    const navigation = createNavigation({
      currentParams: { patientName: 'Andrea Santos' },
    });
    const { getByText, getByLabelText } = render(
      <PatientSpecificDashboard navigation={navigation} />
    );

    fireEvent.press(getByText('Progress Report'));
    fireEvent.press(getByText('Medication Tracker'));
    fireEvent.press(getByText('Consultations'));
    fireEvent.press(getByLabelText('Alerts'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.PROGRESS_REPORT,
      expect.objectContaining({ patientName: 'Andrea Santos' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.MED_TRACKER,
      expect.objectContaining({ patientName: 'Andrea Santos' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      ROUTES.APPOINTMENT_TRACKER,
      expect.objectContaining({ patientName: 'Andrea Santos' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.NOTIFICATION);
  });
});
