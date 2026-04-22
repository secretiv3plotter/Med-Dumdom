import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PrivacySettings from '../PrivacySettingsScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('PrivacySettings integration', () => {
  it('renders the privacy permission groups and labels', () => {
    const navigation = createNavigation();
    const screen = render(<PrivacySettings navigation={navigation} />);

    expect(screen.getByText('Tracker access')).toBeTruthy();
    expect(screen.getByText('Reports and sharing')).toBeTruthy();
    expect(screen.getByText('Reminder access')).toBeTruthy();
    expect(screen.getByText('View medication tracker')).toBeTruthy();
    expect(screen.getByText('Modify appointment tracker')).toBeTruthy();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<PrivacySettings navigation={navigation} />);

    fireEvent.press(getByLabelText('Med tracker'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MED_TRACKER);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
