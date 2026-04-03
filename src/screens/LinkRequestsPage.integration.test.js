import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinkRequestsPage from './LinkRequestsPage';
import { createNavigation, getLastByPlaceholderText } from '../testUtils/integrationTestUtils';

describe('LinkRequestsPage integration', () => {
  it('filters requests and accepts a selected request', () => {
    const navigation = createNavigation();
    const screen = render(<LinkRequestsPage navigation={navigation} />);

    fireEvent.changeText(getLastByPlaceholderText(screen, 'Find a patient'), 'Jane');
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();

    fireEvent.press(screen.getAllByRole('button')[1]);
    expect(screen.getByText('Review Link Request')).toBeTruthy();

    fireEvent.press(screen.getByText('Accept'));
    expect(screen.getByText('Request accepted')).toBeTruthy();
  });

  it('uses the back button handler', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LinkRequestsPage navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
