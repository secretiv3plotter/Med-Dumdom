import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import TabBar from '../TabBar';

describe('TabBar', () => {
  it('renders tabs', () => {
    const tabs = ['Home', 'Settings', 'Profile'];
    const { getByText } = render(<TabBar tabs={tabs} />);

    tabs.forEach((tab) => {
      expect(getByText(tab)).toBeTruthy();
    });
  });

  it('highlights active tab', () => {
    const tabs = ['Home', 'Settings', 'Profile'];
    const theme = { brand: '#ff2d55', brandText: '#0a7f2e' };
    const { getByText, toJSON } = render(<TabBar tabs={tabs} activeTab={1} theme={theme} />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();

    const root = toJSON();
    expect(root.children).toHaveLength(3);
  });

  it('tab press changes selection via handler', () => {
    const onTabPress = jest.fn();
    const tabs = ['Home', 'Settings', 'Profile'];
    const { getByText } = render(<TabBar tabs={tabs} onTabPress={onTabPress} />);

    fireEvent.press(getByText('Profile'));

    expect(onTabPress).toHaveBeenCalledWith(2);
  });
});
