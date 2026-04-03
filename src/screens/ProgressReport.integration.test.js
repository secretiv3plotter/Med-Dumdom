import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProgressReport from './ProgressReport';
import { ROUTES } from '../constants/routes';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('ProgressReport integration', () => {
  it('opens and closes a report preview popup', () => {
    const navigation = createNavigation();
    const { getAllByText, getByText, queryAllByText } = render(
      <ProgressReport navigation={navigation} />
    );

    fireEvent.press(getAllByText('Weekly Medication Adherence')[0]);

    expect(getAllByText('Week of Mar 10 - Mar 16, 2026').length).toBe(2);
    expect(getByText('Close')).toBeTruthy();

    fireEvent.press(getByText('Close'));

    expect(queryAllByText('Week of Mar 10 - Mar 16, 2026').length).toBe(1);
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<ProgressReport navigation={navigation} />);

    fireEvent.press(getByLabelText('Appointments'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.APPOINTMENT_TRACKER);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
