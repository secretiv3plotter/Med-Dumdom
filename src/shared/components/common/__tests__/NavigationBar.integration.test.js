import '../../../test-utils/integrationTestUtils';
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import NavigationBar from '../NavigationBar';

describe('NavigationBar integration', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all navigation buttons and wires presses to onNavigate', () => {
    const onNavigate = jest.fn();
    const { getByLabelText } = render(<NavigationBar onNavigate={onNavigate} />);

    fireEvent.press(getByLabelText('Appointments'));
    fireEvent.press(getByLabelText('Med tracker'));
    fireEvent.press(getByLabelText('Home'));
    fireEvent.press(getByLabelText('Progress report'));
    fireEvent.press(getByLabelText('Alerts'));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'appointment');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'med');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'home');
    expect(onNavigate).toHaveBeenNthCalledWith(4, 'progress');
    expect(onNavigate).toHaveBeenNthCalledWith(5, 'notification');
    expect(Alert.alert).toHaveBeenCalledTimes(5);
  });

  it('reflects the selected tab state from selectedTab', () => {
    const { getByLabelText } = render(
      <NavigationBar selectedTab="notification" showPressAlert={false} />
    );

    expect(getByLabelText('Alerts').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
    expect(getByLabelText('Home').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    );
  });

  it('prevents disabled tabs from firing navigation', () => {
    const onNavigate = jest.fn();
    const { getByLabelText } = render(
      <NavigationBar
        onNavigate={onNavigate}
        appointmentDisabled
        medDisabled
        progressDisabled
        showPressAlert={false}
      />
    );

    fireEvent.press(getByLabelText('Appointments'));
    fireEvent.press(getByLabelText('Med tracker'));
    fireEvent.press(getByLabelText('Progress report'));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
