import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CrudButton, { AddButton, EditButton, DeleteButton } from './CrudButton';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
}, { virtual: true });

describe('CrudButton', () => {
  test('renders the label', () => {
    const { getByText } = render(<CrudButton label="Save" />);
    expect(getByText('Save')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<CrudButton label="Save" onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('blocks press when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <CrudButton label="Save" onPress={onPress} disabled />
    );

    fireEvent.press(getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  test('sets accessibility role, label, and disabled state', () => {
    const { getByRole } = render(<CrudButton label="Save" disabled />);

    const button = getByRole('button', { name: 'Save' });

    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Save');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});

describe('CrudButton wrappers', () => {
  test('AddButton uses default Add label', () => {
    const { getByRole, getByText } = render(<AddButton />);
    expect(getByText('Add')).toBeTruthy();
    expect(getByRole('button', { name: 'Add' })).toBeTruthy();
  });

  test('EditButton uses default Edit label', () => {
    const { getByRole, getByText } = render(<EditButton />);
    expect(getByText('Edit')).toBeTruthy();
    expect(getByRole('button', { name: 'Edit' })).toBeTruthy();
  });

  test('DeleteButton uses default Delete label', () => {
    const { getByRole, getByText } = render(<DeleteButton />);
    expect(getByText('Delete')).toBeTruthy();
    expect(getByRole('button', { name: 'Delete' })).toBeTruthy();
  });
});
