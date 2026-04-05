import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LinktoPatientMainPage from '../LinkToPatientMainPageScreen';
import {
  createNavigation,
  getLastByPlaceholderText,
} from '../../../../shared/test-utils/integrationTestUtils';

describe('LinktoPatientMainPage integration', () => {
  it('filters patients and sends a patient access request', () => {
    const navigation = createNavigation();
    const screen = render(<LinktoPatientMainPage navigation={navigation} />);

    fireEvent.changeText(getLastByPlaceholderText(screen, 'Find a patient'), 'Jane');
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.queryByText('John Doe')).toBeNull();

    fireEvent.press(screen.getAllByRole('button')[1]);
    expect(screen.getByText('Send Access Request')).toBeTruthy();

    fireEvent.press(screen.getByText('Send Request'));
    expect(screen.getByText('Request sent')).toBeTruthy();
  });

  it('uses the back button handler', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<LinktoPatientMainPage navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
