import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ApptTracker from './ApptTracker';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('ApptTracker integration', () => {
  it('opens appointment details, edits them, and saves the update', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, getByLabelText } = render(
      <ApptTracker navigation={navigation} />
    );

    fireEvent.press(getByText('Primary Care Follow-up'));
    expect(getByText('Appointment Details')).toBeTruthy();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByLabelText('Concern'), 'Updated Follow-up');
    fireEvent.press(getAllByText('Save')[0]);

    expect(getAllByText('Updated Follow-up').length).toBeGreaterThan(0);
  });

  it('adds a new appointment through the popup form', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, getByLabelText } = render(
      <ApptTracker navigation={navigation} />
    );

    fireEvent.press(getByText('Add'));
    fireEvent.changeText(getByLabelText('Concern'), 'Vaccination');
    fireEvent.changeText(getByLabelText('Address'), 'City Clinic');
    fireEvent.changeText(getByLabelText('Contact number'), '09171234567');
    fireEvent.changeText(getByLabelText('Date scheduled (YYYY-MM-DD)'), '2026-04-10');
    fireEvent.changeText(getByLabelText('Time scheduled (HH:MM)'), '09:30');
    const addButtons = getAllByText('Add Appointment');
    fireEvent.press(addButtons[addButtons.length - 1]);

    expect(getByText('Vaccination')).toBeTruthy();
  });

  it('routes through the navigation bar', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<ApptTracker navigation={navigation} />);

    fireEvent.press(getByLabelText('Alerts'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.NOTIFICATION);
  });
});
