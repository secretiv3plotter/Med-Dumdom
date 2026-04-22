import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HelpAndSupport from '../HelpAndSupportScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';

describe('HelpAndSupport screen integration', () => {
  it('filters faq content through the search bar', () => {
    const navigation = createNavigation();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <HelpAndSupport navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Search FAQs'), 'password');

    expect(getByText('How can I change my password?')).toBeTruthy();
    expect(queryByText('How do I contact support?')).toBeNull();
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<HelpAndSupport navigation={navigation} />);

    fireEvent.press(getByLabelText('Alerts'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.NOTIFICATION);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
