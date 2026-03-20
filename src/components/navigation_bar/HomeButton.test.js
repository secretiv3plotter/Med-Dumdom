import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HomeButton from './HomeButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => <Text>{name}</Text>,
  };
}, { virtual: true });

describe('HomeButton', () => {
  it('renders the button label', () => {
    const { getByText } = render(<HomeButton />);

    expect(getByText('Home')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<HomeButton onPress={onPress} />);

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the correct accessibility role and label', () => {
    const { getByRole, getByLabelText } = render(<HomeButton />);

    expect(getByRole('button')).toBeTruthy();
    expect(getByLabelText('Home')).toBeTruthy();
  });
});
