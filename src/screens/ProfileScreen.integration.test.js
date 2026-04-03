import '../testUtils/integrationTestUtils';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('ProfileScreen integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('routes to edit profile, settings, and the navigation bar target', () => {
    const navigation = createNavigation();
    const { getByText, getByLabelText } = render(<ProfileScreen navigation={navigation} />);

    fireEvent.press(getByText('Edit Profile'));
    fireEvent.press(getByText('Settings'));
    fireEvent.press(getByLabelText('Med tracker'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.EDIT_PROFILE);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.SETTINGS);
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MED_TRACKER);
  });

  it('shows and auto-hides the saved dialog when a changes token is provided', () => {
    const navigation = createNavigation({
      currentParams: { changesSavedToken: 101 },
    });
    const { getByText, queryAllByText } = render(<ProfileScreen navigation={navigation} />);

    expect(getByText('Changes saved')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(queryAllByText('Changes saved').length).toBe(0);
  });
});
