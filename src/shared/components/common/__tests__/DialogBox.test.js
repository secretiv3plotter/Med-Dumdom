import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DialogBox from '../DialogBox';

const DialogBoxWrapper = ({ visible, ...props }) => (visible ? <DialogBox {...props} /> : null);

describe('DialogBox', () => {
  it('renders title and message', () => {
    const { getByText } = render(<DialogBox title="Confirm Delete" message="This cannot be undone." />);

    expect(getByText('Confirm Delete')).toBeTruthy();
    expect(getByText('This cannot be undone.')).toBeTruthy();
  });

  it('shows when visible', () => {
    const { getByText } = render(<DialogBoxWrapper visible title="Visible Dialog" message="Shown" />);

    expect(getByText('Visible Dialog')).toBeTruthy();
  });

  it('hides when not visible', () => {
    const { queryByText } = render(<DialogBoxWrapper visible={false} title="Hidden Dialog" message="Hidden" />);

    expect(queryByText('Hidden Dialog')).toBeNull();
    expect(queryByText('Hidden')).toBeNull();
  });

  it('fires confirm and cancel handlers', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const actions = [
      { label: 'Cancel', variant: 'outline', onPress: onCancel },
      { label: 'Confirm', variant: 'solid', onPress: onConfirm },
    ];

    const { getAllByText } = render(
      <DialogBox title="Confirm" message="Proceed?" actions={actions} />
    );

    const cancelButtons = getAllByText('Cancel');
    const confirmButtons = getAllByText('Confirm');

    fireEvent.press(cancelButtons[cancelButtons.length - 1]);
    fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
