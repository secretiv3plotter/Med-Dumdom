import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ClickableCard from './ClickableCard';

describe('ClickableCard', () => {
  it('renders content', () => {
    const { getByText } = render(
      <ClickableCard title="Title" subtitle="Subtitle" details="Details" />
    );

    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Subtitle')).toBeTruthy();
    expect(getByText('Details')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <ClickableCard title="Press me" onPress={onPress} />
    );

    fireEvent.press(getByRole('button', { name: 'Press me' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility role and label', () => {
    const { getByRole } = render(
      <ClickableCard title="Card" accessibilityLabel="Custom label" />
    );

    expect(getByRole('button', { name: 'Custom label' })).toBeTruthy();
  });
});
