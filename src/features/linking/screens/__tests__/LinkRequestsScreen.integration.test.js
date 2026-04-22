import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinkRequestsPage from '../LinkRequestsScreen';
import {
  createNavigation,
  getLastByPlaceholderText,
} from '../../../../shared/test-utils/integrationTestUtils';
import patientCaregiverLinkService from '../../../../domain/services/PatientCaregiverLinkService';

describe('LinkRequestsPage integration', () => {
  it('filters requests and approves a pending request', () => {
    patientCaregiverLinkService.requestPatientLink('patient-1', 'current-caregiver');
    const navigation = createNavigation();
    const screen = render(<LinkRequestsPage navigation={navigation} />);

    fireEvent.changeText(getLastByPlaceholderText(screen, 'Find a patient'), 'Jane');
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();

    fireEvent.press(screen.getByText('Approve'));
    expect(screen.getByText('Link approved')).toBeTruthy();
  });

  it('uses the back button handler', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LinkRequestsPage navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
