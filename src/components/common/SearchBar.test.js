import React from 'react';
import { StyleSheet, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Mock Ionicons so tests run without @expo/vector-icons installed
jest.mock(
  '@expo/vector-icons',
  () => {
    const React = require('react');
    const { View: RNView } = require('react-native');
    return {
      Ionicons: (props) => React.createElement(RNView, { ...props, testID: 'search-icon' }),
    };
  },
  { virtual: true }
);

import SearchBar from './SearchBar';
import { colors } from '../../constants/Themes';

const getContainer = (views) =>
  views.find((view) => {
    const flatStyle = StyleSheet.flatten(view.props.style);
    return flatStyle && Object.prototype.hasOwnProperty.call(flatStyle, 'borderColor');
  });

describe('SearchBar', () => {
  it('renders placeholder and value', () => {
    const { getByPlaceholderText } = render(<SearchBar placeholder="Find" value="Hello" />);
    const input = getByPlaceholderText('Find');

    expect(input).toBeTruthy();
    expect(input.props.value).toBe('Hello');
  });

  it('calls onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(<SearchBar onChangeText={onChangeText} />);
    const input = getByPlaceholderText('Search');

    fireEvent.changeText(input, 'query');

    expect(onChangeText).toHaveBeenCalledWith('query');
  });

  it('renders search icon', () => {
    const { getByTestId } = render(<SearchBar />);
    expect(getByTestId('search-icon')).toBeTruthy();
  });

  it('updates focus and blur styles', () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SearchBar />);
    const input = getByPlaceholderText('Search');

    const getBorderColor = () => {
      const container = getContainer(UNSAFE_getAllByType(View));
      return StyleSheet.flatten(container.props.style).borderColor;
    };

    expect(getBorderColor()).toBe(colors.border);

    fireEvent(input, 'focus');
    expect(getBorderColor()).toBe(colors.focusRing);

    fireEvent(input, 'blur');
    expect(getBorderColor()).toBe(colors.border);
  });
});
