import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProgressReportButton from './ProgressReportButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => <Text>{name}</Text>,
  };
}, { virtual: true });

describe('ProgressReportButton', () => {
  it('renders the button label', () => {
    const { getByText } = render(<ProgressReportButton />);

    expect(getByText('Report')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ProgressReportButton onPress={onPress} />);

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the correct accessibility role and label', () => {
    const { getByRole, getByLabelText } = render(<ProgressReportButton />);

    expect(getByRole('button')).toBeTruthy();
    expect(getByLabelText('Progress report')).toBeTruthy();
  });
});
