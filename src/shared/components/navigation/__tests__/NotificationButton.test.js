import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationButton from '../NotificationButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => <Text>{name}</Text>,
  };
}, { virtual: true });

describe('NotificationButton', () => {
  it('renders the button label', () => {
    const { getByText } = render(<NotificationButton />);

    expect(getByText('Alerts')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<NotificationButton onPress={onPress} />);

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the correct accessibility role and label', () => {
    const { getByRole, getByLabelText } = render(<NotificationButton />);

    expect(getByRole('button')).toBeTruthy();
    expect(getByLabelText('Alerts')).toBeTruthy();
  });
});
