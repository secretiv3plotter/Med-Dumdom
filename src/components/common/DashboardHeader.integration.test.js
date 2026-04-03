import '../../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import DashboardHeader from './DashboardHeader';

describe('DashboardHeader integration', () => {
  it('renders the greeting with the composed profile and help controls', () => {
    const { getByText, getByLabelText } = render(<DashboardHeader firstName="Jane" />);

    expect(getByText('Hi, Jane')).toBeTruthy();
    expect(getByLabelText('Profile')).toBeTruthy();
    expect(getByLabelText('Help')).toBeTruthy();
  });

  it('wires profile and help button presses to the parent handlers', () => {
    const onProfilePress = jest.fn();
    const onHelpPress = jest.fn();
    const { getByLabelText } = render(
      <DashboardHeader
        firstName="Jane"
        onProfilePress={onProfilePress}
        onHelpPress={onHelpPress}
      />
    );

    fireEvent.press(getByLabelText('Profile'));
    fireEvent.press(getByLabelText('Help'));

    expect(onProfilePress).toHaveBeenCalledTimes(1);
    expect(onHelpPress).toHaveBeenCalledTimes(1);
  });

  it('respects disabled states for the child buttons', () => {
    const onProfilePress = jest.fn();
    const onHelpPress = jest.fn();
    const { getByLabelText } = render(
      <DashboardHeader
        firstName="Jane"
        onProfilePress={onProfilePress}
        onHelpPress={onHelpPress}
        profileDisabled
        helpDisabled
      />
    );

    fireEvent.press(getByLabelText('Profile'));
    fireEvent.press(getByLabelText('Help'));

    expect(onProfilePress).not.toHaveBeenCalled();
    expect(onHelpPress).not.toHaveBeenCalled();
  });
});
