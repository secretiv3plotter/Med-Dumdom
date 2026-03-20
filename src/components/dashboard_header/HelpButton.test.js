import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HelpButton from './HelpButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
}, { virtual: true });

describe('HelpButton', () => {
  test('renders the default label', () => {
    const { getByText } = render(<HelpButton />);
    expect(getByText('Help')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<HelpButton onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Help' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('blocks press when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<HelpButton onPress={onPress} disabled />);

    fireEvent.press(getByRole('button', { name: 'Help' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  test('sets accessibility role, label, and disabled state', () => {
    const { getByRole } = render(<HelpButton disabled />);

    const button = getByRole('button', { name: 'Help' });

    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Help');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});
