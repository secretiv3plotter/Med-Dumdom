import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AppointmentTrackerButton from '../AppointmentTrackerButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => <Text>{name}</Text>,
  };
}, { virtual: true });

describe('AppointmentTrackerButton', () => {
  it('renders the button label', () => {
    const { getByText } = render(<AppointmentTrackerButton />);

    expect(getByText('Appts')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<AppointmentTrackerButton onPress={onPress} />);

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the correct accessibility role and label', () => {
    const { getByRole, getByLabelText } = render(<AppointmentTrackerButton />);

    expect(getByRole('button')).toBeTruthy();
    expect(getByLabelText('Appointments')).toBeTruthy();
  });
});
