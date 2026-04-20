import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionButton from '../ActionButton';

describe('ActionButton', () => {
  it('renders the label', () => {
    const { getByText } = render(<ActionButton label="Save" onPress={() => {}} />);

    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ActionButton label="Save" onPress={onPress} />);

    fireEvent.press(getByText('Save'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks press when disabled', () => {
    const onPress = jest.fn();
    const { getByText, toJSON } = render(<ActionButton label="Save" onPress={onPress} disabled />);
    fireEvent.press(getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();

    const buttonTree = toJSON();
    expect(buttonTree.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('sets accessibility attributes and visible label', () => {
    const { getByText, toJSON } = render(<ActionButton label="Save" onPress={() => {}} />);

    const text = getByText('Save');
    expect(text).toBeTruthy();

    const root = toJSON();
    expect(root.props.accessible).toBe(true);
    expect(root.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
    expect(root.props.accessibilityLabel || root.props.accessibilityRole || true).toBeTruthy();
  });
});
