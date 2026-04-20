import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MedTracker from '../MedTrackerScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

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
    fireEvent.press(getAllByText('Save')[0]);

    expect(getAllByText('Metformin XR').length).toBeGreaterThan(0);
  });

  it('adds a new medicine through the popup form', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, getByLabelText } = render(
      <MedTracker navigation={navigation} />
    );

    fireEvent.press(getByText('Add'));
    fireEvent.changeText(getByLabelText('Name of the medicine'), 'Aspirin');
    fireEvent.changeText(getByLabelText('Dosage'), '100 mg');
    fireEvent.changeText(getByLabelText('Amount'), '10 tablets');
    fireEvent.changeText(getByLabelText('Daily schedule'), '7:00 AM');
    const addButtons = getAllByText('Add Medicine');
    fireEvent.press(addButtons[addButtons.length - 1]);

    expect(getByText('Aspirin')).toBeTruthy();
  });

  it('routes through the navigation bar', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<MedTracker navigation={navigation} />);

    fireEvent.press(getByLabelText('Home'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
  });
});
