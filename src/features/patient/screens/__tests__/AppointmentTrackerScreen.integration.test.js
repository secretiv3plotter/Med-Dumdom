import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ApptTracker from '../AppointmentTrackerScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

const pickDate = (getByLabelText, fieldLabel, date) => {
  fireEvent.press(getByLabelText(fieldLabel));
  fireEvent(getByLabelText('date picker'), 'onChange', { type: 'set' }, new Date(`${date}T00:00:00`));
};

const pickTime = (getByLabelText, fieldLabel, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date('2026-04-10T00:00:00');
  value.setHours(hours, minutes, 0, 0);
  fireEvent.press(getByLabelText(fieldLabel));
  fireEvent(getByLabelText('time picker'), 'onChange', { type: 'set' }, value);
};

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
    pickDate(getByLabelText, 'Date scheduled', '2026-04-10');
    pickTime(getByLabelText, 'Time scheduled', '09:30');
    const addButtons = getAllByText('Add Appointment');
    fireEvent.press(addButtons[addButtons.length - 1]);

    expect(getByText('Vaccination')).toBeTruthy();
  });

  it('routes through the navigation bar', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<ApptTracker navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));
    fireEvent.press(getByLabelText('Home'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
