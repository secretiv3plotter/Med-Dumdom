import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MedTracker from '../MedTrackerScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

const pickDate = (getByLabelText, fieldLabel, date) => {
  fireEvent.press(getByLabelText(fieldLabel));
  fireEvent(getByLabelText('date picker'), 'onChange', { type: 'set' }, new Date(`${date}T00:00:00`));
};

const pickTime = (getByLabelText, fieldLabel, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date('2026-04-20T00:00:00');
  value.setHours(hours, minutes, 0, 0);
  fireEvent.press(getByLabelText(fieldLabel));
  fireEvent(getByLabelText('time picker'), 'onChange', { type: 'set' }, value);
};

describe('MedTracker integration', () => {
  it('opens the medicine details editor and saves updated values', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, getByLabelText } = render(
      <MedTracker navigation={navigation} />
    );

    fireEvent.press(getByText('Metformin'));
    expect(getByText('Medicine Details')).toBeTruthy();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByLabelText('Name of the medicine'), 'Metformin XR');
    fireEvent.press(getByText('Save Medicine'));

    expect(getByText('Metformin XR')).toBeTruthy();
  });

  it('adds a new medicine through the popup form', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, getByLabelText } = render(
      <MedTracker navigation={navigation} />
    );

    fireEvent.press(getByText('Add'));
    fireEvent.changeText(getByLabelText('Name of the medicine'), 'Aspirin');
    fireEvent.changeText(getByLabelText('Unit strength (e.g. 500 mg)'), '100 mg');
    fireEvent.press(getByText('Tablet'));
    fireEvent.changeText(getByLabelText('Total daily amount'), '1');
    pickDate(getByLabelText, 'Start date', '2026-04-20');
    fireEvent.changeText(getByLabelText('Dose size'), '1');
    pickTime(getByLabelText, 'Scheduled time', '07:00');
    fireEvent.press(getByText('Add schedule item'));
    const addButtons = getAllByText('Add Medicine');
    fireEvent.press(addButtons[addButtons.length - 1]);

    expect(getByText('Aspirin')).toBeTruthy();
  });

  it('routes through the navigation bar', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<MedTracker navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));
    fireEvent.press(getByLabelText('Home'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
