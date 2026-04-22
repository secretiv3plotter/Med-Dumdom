import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinktoPatientMainPage from '../LinkToPatientMainPageScreen';
import {
  createNavigation,
  getLastByPlaceholderText,
} from '../../../../shared/test-utils/integrationTestUtils';
import patientCaregiverLinkService from '../../../../domain/services/PatientCaregiverLinkService';

describe('LinktoPatientMainPage integration', () => {
  it('filters patients and sends a patient link request', () => {
    const navigation = createNavigation();
    const screen = render(<LinktoPatientMainPage navigation={navigation} />);

    fireEvent.changeText(getLastByPlaceholderText(screen, 'Find a patient'), 'Jane');
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();

    fireEvent.press(screen.getAllByRole('button')[1]);
    expect(screen.getByText('Request sent')).toBeTruthy();
    expect(
      patientCaregiverLinkService.getPendingRequestsForCaregiver('current-caregiver').length
    ).toBeGreaterThan(0);
  });

  it('uses the back button handler', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LinktoPatientMainPage navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
