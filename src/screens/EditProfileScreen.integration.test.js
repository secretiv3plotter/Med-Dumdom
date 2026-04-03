import '../testUtils/integrationTestUtils';
import React from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import EditProfileScreen from './EditProfileScreen';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('EditProfileScreen integration', () => {
  beforeEach(() => {
    jest.spyOn(Keyboard, 'addListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens the confirmation dialog from the save action', () => {
    const navigation = createNavigation();
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <EditProfileScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter full name'), 'Janet Doe');
    fireEvent.press(getAllByText('Save Changes')[0].parent);

    expect(getByText('Are you Sure?')).toBeTruthy();
    expect(getByText('You are about to save changes.')).toBeTruthy();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<EditProfileScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('Home'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
