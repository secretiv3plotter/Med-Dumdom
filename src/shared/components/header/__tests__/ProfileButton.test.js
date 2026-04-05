import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileButton from '../ProfileButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
}, { virtual: true });

describe('ProfileButton', () => {
  test('renders the default label', () => {
    const { getByText } = render(<ProfileButton />);
    expect(getByText('Profile')).toBeTruthy();
  });

  test('renders the default icon when imageSource is not provided', () => {
    const { UNSAFE_getByProps } = render(<ProfileButton />);

    expect(UNSAFE_getByProps({ children: 'person-circle-outline' })).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ProfileButton onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Profile' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('blocks press when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ProfileButton onPress={onPress} disabled />);

    fireEvent.press(getByRole('button', { name: 'Profile' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  test('sets accessibility role, label, and disabled state', () => {
    const { getByRole } = render(<ProfileButton disabled />);

    const button = getByRole('button', { name: 'Profile' });

    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Profile');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  test('renders an image when imageSource is provided', () => {
    const imageSource = { uri: 'https://example.com/avatar.png' };
    const { UNSAFE_getByType, queryByText } = render(
      <ProfileButton imageSource={imageSource} />
    );

    const image = UNSAFE_getByType(require('react-native').Image);

    expect(image.props.source).toEqual(imageSource);
    expect(queryByText('person-circle-outline')).toBeNull();
  });
});
