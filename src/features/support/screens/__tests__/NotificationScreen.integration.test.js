import '../../../../shared/test-utils/integrationTestUtils';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotificationScreen from '../NotificationScreen';
import { ROUTES } from '../../../../app/navigation/routes';
import { createNavigation } from '../../../../shared/test-utils/integrationTestUtils';
import reminderService from '../../../../domain/services/ReminderService';

describe('NotificationScreen integration', () => {
  const latestReminder = {
    reminderId: 'sample-reminder-1',
    type: 'medication',
    title: 'Latest medication reminder',
    message: 'Take your medicine.',
    dueAt: new Date('2026-04-22T10:00:00'),
    createdAt: new Date('2026-04-22T09:00:00'),
    sourceEntry: { isTaken: false },
    status: 'pending',
  };

  const olderReminder = {
    reminderId: 'sample-reminder-2',
    type: 'appointment',
    title: 'Older appointment reminder',
    message: 'Visit your doctor.',
    dueAt: new Date('2026-04-22T09:00:00'),
    createdAt: new Date('2026-04-22T08:00:00'),
    sourceEntry: { isCompleted: false },
    status: 'pending',
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-22T10:10:00'));
    jest.spyOn(reminderService, 'getNotificationFeed').mockReturnValue([olderReminder, latestReminder]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the notification feed content', () => {
    const navigation = createNavigation();
    const { getByText, getByLabelText, queryByLabelText, toJSON } = render(<NotificationScreen navigation={navigation} />);

    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Latest medication reminder')).toBeTruthy();
    expect(getByText('Older appointment reminder')).toBeTruthy();
    expect(getByText('10m ago')).toBeTruthy();
    expect(getByText('1h ago')).toBeTruthy();
    expect(getByText('Not taken')).toBeTruthy();
    expect(getByText('Not completed')).toBeTruthy();
    expect(getByLabelText('Latest medication reminder')).toBeTruthy();
    expect(queryByLabelText('Complete')).toBeNull();
    expect(queryByLabelText('Snooze')).toBeNull();
    expect(queryByLabelText('Dismiss')).toBeNull();

    const serializedTree = JSON.stringify(toJSON());
    expect(serializedTree.indexOf('Latest medication reminder')).toBeLessThan(
      serializedTree.indexOf('Older appointment reminder')
    );
  });

  it('routes through the navigation bar and back button', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<NotificationScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('Home'));
    fireEvent.press(getByLabelText('Back'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.HOME);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('opens the correct tracker when a reminder is selected', () => {
    const navigation = createNavigation();
    const { getByLabelText } = render(<NotificationScreen navigation={navigation} />);

    fireEvent.press(getByLabelText('Latest medication reminder'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.MED_TRACKER);
  });

  it('opens appointment tracker for appointment reminders', () => {
    const navigation = createNavigation();
    reminderService.getNotificationFeed.mockReturnValue([
      {
        reminderId: 'sample-reminder-2',
        type: 'appointment',
        title: 'Appointment reminder',
        message: 'Visit your doctor.',
        dueAt: new Date('2026-04-22T11:00:00'),
        createdAt: new Date('2026-04-22T10:30:00'),
      },
    ]);

    const { getByLabelText } = render(<NotificationScreen navigation={navigation} />);
    fireEvent.press(getByLabelText('Appointment reminder'));

    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.APPOINTMENT_TRACKER);
  });
});
