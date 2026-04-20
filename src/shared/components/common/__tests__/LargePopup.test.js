import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Modal, Text, Pressable } from 'react-native';
import LargePopup from '../LargePopup';

describe('LargePopup', () => {
  test('renders only when visible', async () => {
    const hidden = render(
      <LargePopup visible={false}>
        <Text>Popup content</Text>
      </LargePopup>
    );

    await waitFor(() => {
      expect(hidden.queryByText('Popup content')).toBeNull();
    });

    const visible = render(
      <LargePopup visible>
        <Text>Popup content</Text>
      </LargePopup>
    );

    expect(visible.getByText('Popup content')).toBeTruthy();
  });

  test('shows title and content', () => {
    const { getByText } = render(
      <LargePopup visible header={<Text>Popup title</Text>}>
        <Text>Popup content</Text>
      </LargePopup>
    );

    expect(getByText('Popup title')).toBeTruthy();
    expect(getByText('Popup content')).toBeTruthy();
  });

  test('close handler works', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <LargePopup visible onClose={onClose}>
        <Pressable onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </LargePopup>
    );

    fireEvent.press(getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('confirm handler works', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <LargePopup visible>
        <Pressable onPress={onConfirm}>
          <Text>Confirm</Text>
        </Pressable>
      </LargePopup>
    );

    fireEvent.press(getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('cancel handler works', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <LargePopup visible>
        <Pressable onPress={onCancel}>
          <Text>Cancel</Text>
        </Pressable>
      </LargePopup>
    );

    fireEvent.press(getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when the modal requests to close', () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = render(
      <LargePopup visible onClose={onClose}>
        <Text>Popup content</Text>
      </LargePopup>
    );

    const modal = UNSAFE_getByType(Modal);
    modal.props.onRequestClose();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
