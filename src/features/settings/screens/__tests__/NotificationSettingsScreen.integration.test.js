import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationSettings from '../NotificationSettingsScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('NotificationSettings integration', () => {
  it('updates reminder lead time and saves the settings', () => {
    const navigation = createNavigation();
    const { getByPlaceholderText, getByText } = render(
      <NotificationSettings navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('5'), '10');
    fireEvent.press(getByText('Save Changes'));

    expect(getByText('Notification settings saved')).toBeTruthy();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<NotificationSettings navigation={navigation} />);

    fireEvent.press(getByLabelText('Progress report'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.PROGRESS_REPORT);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
