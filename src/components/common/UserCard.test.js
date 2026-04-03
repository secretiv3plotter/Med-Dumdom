import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserCard from './UserCard';

describe('UserCard', () => {
  it('renders main user info', () => {
    const { getByText } = render(
      <UserCard name="Jane Doe" subtitle="Caregiver" details="Active" />
    );

    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('Caregiver')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
  });

  it('handles missing optional data', () => {
    const { getByText, queryByText } = render(
      <UserCard name="John Smith" />
    );

    expect(getByText('John Smith')).toBeTruthy();
    expect(queryByText('Caregiver')).toBeNull();
    expect(queryByText('Active')).toBeNull();
  });

  it('calls action press handlers when provided', () => {
    const onPrimaryAction = jest.fn();
    const onSecondaryAction = jest.fn();

    const { getByRole } = render(
      <UserCard
        name="Jane Doe"
        primaryActionLabel="View"
        secondaryActionLabel="Message"
        onPrimaryAction={onPrimaryAction}
        onSecondaryAction={onSecondaryAction}
      />
    );

    fireEvent.press(getByRole('button', { name: 'Message' }));
    fireEvent.press(getByRole('button', { name: 'View' }));

    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
