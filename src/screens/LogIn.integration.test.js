import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LogIn from './LogIn';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('LogIn screen integration', () => {
  it('submits a complete form to the home route', () => {
    const navigation = createNavigation();
    const { getByText, getByLabelText } = render(<LogIn navigation={navigation} />);

    fireEvent.changeText(getByLabelText('Email'), 'patient@gmail.com');
    fireEvent.changeText(getByLabelText('Password'), 'Secret123');
    fireEvent.press(getByText('Log In'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
  });

  it('uses the back button handler when available', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LogIn navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to sign up from the prompt link', () => {
    const navigation = createNavigation();
    const { getByText } = render(<LogIn navigation={navigation} />);

    fireEvent.press(getByText('Sign Up'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.SIGN_UP);
  });
});
