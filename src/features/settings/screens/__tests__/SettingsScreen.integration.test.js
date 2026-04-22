import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('SettingsScreen integration', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('changes the password through the composed form controls', () => {
    const navigation = createNavigation();
    const { getByLabelText, getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.changeText(getByLabelText('Current password'), 'Secret123');
    fireEvent.changeText(getByLabelText('New password'), 'Secret456');
    fireEvent.press(getByText('Change Password'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Password updated',
      'Your password has been changed.'
    );
    expect(getByLabelText('Current password').props.value).toBe('');
    expect(getByLabelText('New password').props.value).toBe('');
  });

  it('opens and confirms the soft-delete dialog', () => {
    const navigation = createNavigation();
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText('Delete Account'));
    expect(getByText('Deactivate account?')).toBeTruthy();

    fireEvent.press(getByText('Yes'));

    expect(getByText('Inactive')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Account deactivated',
      'Your account status is now inactive.'
    );
  });

  it('routes to the nested service-backed screens', () => {
    const navigation = createNavigation();
    const { getByText } = render(<SettingsScreen navigation={navigation} />);

    fireEvent.press(getByText('Notifications'));
    fireEvent.press(getByText('Privacy Settings'));
    fireEvent.press(getByText('Accessibility'));
    fireEvent.press(getByText('Help and Support'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.NOTIFICATION_SETTINGS);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.PRIVACY_SETTINGS);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.ACCESSIBILITY_SETTINGS);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HELP_AND_SUPPORT);
  });
});
