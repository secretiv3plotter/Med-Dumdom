import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DurationPicker from '../DurationPicker';

function createUnit(overrides = {}) {
  return {
    key: 'hours',
    label: 'Hours',
    value: 2,
    min: 0,
    max: 24,
    onChange: jest.fn(),
    ...overrides,
  };
}

describe('DurationPicker', () => {
  it('renders the current value', () => {
    const unit = createUnit({ value: 5 });
    const { getByDisplayValue } = render(
      <DurationPicker units={[unit]} />
    );

    expect(getByDisplayValue('5')).toBeTruthy();
  });

  it('updates value via buttons', () => {
    const unit = createUnit({ value: 1 });
    const { getByRole } = render(
      <DurationPicker units={[unit]} />
    );

    fireEvent.press(getByRole('button', { name: 'Increase Hours' }));
    fireEvent.press(getByRole('button', { name: 'Decrease Hours' }));

    expect(unit.onChange).toHaveBeenCalledWith(2);
    expect(unit.onChange).toHaveBeenCalledWith(0);
  });

  it('calls change handler with input value', () => {
    const unit = createUnit({ value: 3 });
    const { getByLabelText } = render(
      <DurationPicker units={[unit]} />
    );

    fireEvent.changeText(getByLabelText('Hours value'), '12');

    expect(unit.onChange).toHaveBeenCalledWith(12);
  });
});
