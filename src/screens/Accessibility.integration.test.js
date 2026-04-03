import '../testUtils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Accessibility from './Accessibility';
import { createNavigation } from '../testUtils/integrationTestUtils';

describe('Accessibility screen integration', () => {
  it('renders the accessibility content', () => {
    const navigation = createNavigation();
    const { getByText } = render(<Accessibility navigation={navigation} />);

    expect(getByText('Accessibility')).toBeTruthy();
    expect(getByText('Accessibility controls and preferences appear here.')).toBeTruthy();
  });

  it('uses the back button handler from navigation', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<Accessibility navigation={navigation} />);

    fireEvent.press(getByLabelText('Back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
