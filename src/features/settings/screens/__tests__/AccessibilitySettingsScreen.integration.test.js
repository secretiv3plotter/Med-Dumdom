import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AccessibilitySettings from '../AccessibilitySettingsScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('AccessibilitySettings integration', () => {
  it('renders and allows interaction with the text-size controls', () => {
    const navigation = createNavigation();
    const { getByText } = render(<AccessibilitySettings navigation={navigation} />);

    expect(getByText('Small')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Large')).toBeTruthy();

    fireEvent.press(getByText('Large'));
    fireEvent.press(getByText('Small'));

    expect(getByText('Large')).toBeTruthy();
    expect(getByText('Small')).toBeTruthy();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<AccessibilitySettings navigation={navigation} />);

    fireEvent.press(getByLabelText('Appointments'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.APPOINTMENT_TRACKER);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
