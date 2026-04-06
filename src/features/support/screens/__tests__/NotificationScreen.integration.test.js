import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationScreen from '../NotificationScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('NotificationScreen integration', () => {
  it('renders the notification feed content', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText } = render(<NotificationScreen navigation={navigation} />);

    expect(getByText('Notifications')).toBeTruthy();
    expect(getAllByText('Medication Reminder').length).toBeGreaterThan(0);
    expect(getByText("It's almost time to take your 8:00 AM medication dose.")).toBeTruthy();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<NotificationScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('Home'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
