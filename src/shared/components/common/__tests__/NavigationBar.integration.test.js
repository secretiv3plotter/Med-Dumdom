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

    fireEvent.press(getByLabelText('Med tracker'));
    fireEvent.press(getByLabelText('Home'));
    fireEvent.press(getByLabelText('Appointments'));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'med');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'home');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'appointment');
    expect(Alert.alert).toHaveBeenCalledTimes(3);
  });

  it('reflects the selected tab state from selectedTab', () => {
    const { getByLabelText } = render(
      <NavigationBar selectedTab="med" showPressAlert={false} />
    );

    expect(getByLabelText('Med tracker').props.accessibilityState).toEqual(
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
        showPressAlert={false}
      />
    );

    fireEvent.press(getByLabelText('Appointments'));
    fireEvent.press(getByLabelText('Med tracker'));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
