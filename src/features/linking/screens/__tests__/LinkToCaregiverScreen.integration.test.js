import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinkToCaregiver from '../LinkToCaregiverScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';
import patientCaregiverLinkService from '../../../../domain/services/PatientCaregiverLinkService';

describe('LinkToCaregiver integration', () => {
  it('filters caregivers and sends a request', () => {
    const navigation = createNavigation();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <LinkToCaregiver navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'Jane');
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(queryByText('John Doe')).toBeNull();

    fireEvent.press(getByText('Jane Doe'));
    expect(getByText('Request sent')).toBeTruthy();
    expect(patientCaregiverLinkService.getOutgoingRequestsForPatient('current-patient').length).toBeGreaterThan(0);
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LinkToCaregiver navigation={navigation} />);

    fireEvent.press(getByLabelText('Alerts'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.NOTIFICATION);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
