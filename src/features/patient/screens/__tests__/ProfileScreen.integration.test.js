import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { Keyboard } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('ProfileScreen integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('routes to settings and the navigation bar target', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<ProfileScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('Settings'));
    fireEvent.press(getByLabelText('Med tracker'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.SETTINGS);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MED_TRACKER);
  });

  it('switches into edit mode, opens the confirmation dialog, and auto-hides the saved dialog after saving', () => {
    const navigation = createNavigation();
    const { getByLabelText, getByPlaceholderText, getByText, queryAllByText } = render(
      <ProfileScreen navigation={navigation} />
    );

    fireEvent.press(getByLabelText('Edit'));
    fireEvent.changeText(getByPlaceholderText('Enter full name'), 'Janet Doe');
    fireEvent.press(getByLabelText('Save Changes'));

    expect(getByText('Are you Sure?')).toBeTruthy();
    expect(getByText('You are about to save changes.')).toBeTruthy();

    fireEvent.press(getByLabelText('Confirm Save'));
    expect(getByText('Changes saved')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(queryAllByText('Changes saved').length).toBe(0);
  });
});
