import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BackButton from '../BackButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => <Text>{name}</Text>,
  };
}, { virtual: true });

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeAll(() => {
  global.requestAnimationFrame = (cb) => {
    cb();
    return 0;
  };
  global.cancelAnimationFrame = () => {};
});

describe('BackButton', () => {
  it('renders the label', () => {
    const { getByText } = render(<BackButton />);

    expect(getByText('Back')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<BackButton onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Back' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility role and label', () => {
    const { getByRole } = render(<BackButton label="Go back" />);

    expect(getByRole('button', { name: 'Go back' })).toBeTruthy();
  });
});
