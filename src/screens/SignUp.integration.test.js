import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SignUp from './SignUp';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('SignUp screen integration', () => {
  it('navigates patients to the home route when the form is completed', () => {
    const navigation = createNavigation();
    const { getByText, getByLabelText } = render(<SignUp navigation={navigation} />);

    fireEvent.press(getByText('Patient'));
    fireEvent.changeText(getByLabelText('Email'), 'patient@gmail.com');
    fireEvent.changeText(getByLabelText('Password'), 'Secret123');
    fireEvent.press(getByText('Sign Up'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
  });

  it('navigates caregivers to the caregiver home route when the form is completed', () => {
    const navigation = createNavigation();
    const { getByText, getByLabelText } = render(<SignUp navigation={navigation} />);

    fireEvent.press(getByText('Caregiver'));
    fireEvent.changeText(getByLabelText('Email'), 'caregiver@gmail.com');
    fireEvent.changeText(getByLabelText('Password'), 'Secret123');
    fireEvent.press(getByText('Sign Up'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.CAREGIVER_HOME);
  });

  it('navigates to log in from the prompt link', () => {
    const navigation = createNavigation();
    const { getByText } = render(<SignUp navigation={navigation} />);

    fireEvent.press(getByText('Log In'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.LOG_IN);
  });
});
