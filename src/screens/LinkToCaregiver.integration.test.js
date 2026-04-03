import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinkToCaregiver from './LinkToCaregiver';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('LinkToCaregiver integration', () => {
  it('filters caregivers and moves through the send/cancel request flow', () => {
    const navigation = createNavigation();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <LinkToCaregiver navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'Jane');
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(queryByText('John Doe')).toBeNull();

    fireEvent.press(getByText('Jane Doe'));
    expect(getByText('Send Access Request')).toBeTruthy();
    fireEvent.press(getByText('Send Request'));
    expect(getByText('Request sent')).toBeTruthy();

    fireEvent.press(getByText('Jane Doe'));
    expect(getByText('Cancel Access Request')).toBeTruthy();
    fireEvent.press(getByText('Cancel Request'));
    expect(getByText('Request cancelled')).toBeTruthy();
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
