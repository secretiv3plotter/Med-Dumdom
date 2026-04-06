import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationSettings from '../NotificationSettingsScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('NotificationSettings integration', () => {
  it('updates reminder timing when the on-time chip is pressed', () => {
    const navigation = createNavigation();
    const { getByLabelText, getByText } = render(
      <NotificationSettings navigation={navigation} />
    );

    expect(getByText('0h 5m before schedule')).toBeTruthy();

    fireEvent.press(getByLabelText('Set medicine reminder to on time'));

    expect(getByText('On time (0m before schedule)')).toBeTruthy();
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
