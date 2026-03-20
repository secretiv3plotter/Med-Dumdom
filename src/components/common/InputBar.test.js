import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputBar from './InputBar';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
}, { virtual: true });

describe('InputBar', () => {
  test('renders label, placeholder, and value', () => {
    const { getByText, getByLabelText, getByDisplayValue } = render(
      <InputBar label="Email" placeholder="Enter email" value="user@gmail.com" />
    );

    expect(getByText('Email')).toBeTruthy();
    expect(getByLabelText('Email')).toBeTruthy();
    expect(getByDisplayValue('user@gmail.com')).toBeTruthy();
    expect(getByLabelText('Email').props.placeholder).toBe('Enter email');
  });

  test('calls onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = render(
      <InputBar label="Name" value="" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByLabelText('Name'), 'Jane');

    expect(onChangeText).toHaveBeenCalledWith('Jane');
  });

  test('toggles password visibility', () => {
    const { getByLabelText } = render(
      <InputBar label="Password" accessibilityLabel="Password" value="secret" secureTextEntry />
    );

    const input = getByLabelText('Password');

    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText('Show password'));
    expect(getByLabelText('Hide password').props.accessibilityState).toEqual({ selected: true });
    expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
  });

  test('shows explicit error message', () => {
    const { getByText, getByLabelText } = render(
      <InputBar label="Email" errorMessage="Required field." />
    );

    expect(getByText('Required field.')).toBeTruthy();
    expect(getByLabelText('Email').props.accessibilityState).toEqual({
      disabled: false,
      invalid: true,
    });
  });

  test('reflects non-editable state in props and accessibility state', () => {
    const { getByLabelText } = render(
      <InputBar label="Email" value="user@gmail.com" editable={false} />
    );

    const input = getByLabelText('Email');

    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toEqual({
      disabled: true,
      invalid: false,
    });
  });

  test('calls onFocus and onBlur handlers', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByLabelText } = render(
      <InputBar label="Email" onFocus={onFocus} onBlur={onBlur} />
    );

    const input = getByLabelText('Email');

    fireEvent(input, 'focus');
    fireEvent(input, 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('shows lowercase email error for uppercase characters', () => {
    const { getByText } = render(
      <InputBar
        label="Email"
        placeholder="Enter email"
        value="User@gmail.com"
        keyboardType="email-address"
      />
    );

    expect(getByText('Email must be lowercase.')).toBeTruthy();
  });

  test('shows email typo suggestion for corrected domains', () => {
    const { getByText } = render(
      <InputBar
        label="Email"
        placeholder="Enter email"
        value="user@gmial.com"
        keyboardType="email-address"
      />
    );

    expect(getByText('Did you mean user@gmail.com?')).toBeTruthy();
  });

  test('shows email format error for non-gmail domains by default', () => {
    const { getByText } = render(
      <InputBar
        label="Email"
        placeholder="Enter email"
        value="user@yahoo.com"
        keyboardType="email-address"
      />
    );

    expect(getByText('Enter a valid email address.')).toBeTruthy();
  });

  test('shows password mismatch error when new password matches current password', () => {
    const { getByText } = render(
      <>
        <InputBar
          label="Current Password"
          accessibilityLabel="Current Password"
          placeholder="Current Password"
          value="Secret123"
          secureTextEntry
        />
        <InputBar
          label="New Password"
          accessibilityLabel="New Password"
          placeholder="New Password"
          value="secret123"
          secureTextEntry
        />
      </>
    );

    expect(
      getByText('New password must be different from current password.')
    ).toBeTruthy();
  });
});
