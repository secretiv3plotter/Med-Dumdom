import { ReminderService } from '../ReminderService';

describe('ReminderService', () => {
  it('creates due reminders from tracker services and avoids duplicates', () => {
    const medTrackerService = {
      listMedEntries: jest.fn(() => [
        {
          medEntryId: 'med-1',
          medName: 'Vitamin C',
          isDue: () => true,
        },
      ]),
    };
    const apptTrackerService = {
      listApptEntries: jest.fn(() => [
        {
          apptEntryId: 'appt-1',
          concern: 'Checkup',
          dateSched: '2026-04-21',
          timeSched: '09:00',
          isDue: () => true,
        },
      ]),
    };

    const service = new ReminderService({
      medTrackerService,
      apptTrackerService,
      notifSettingsService: {
        getSettings: () => ({
          medRemindersEnabled: true,
          apptRemindersEnabled: true,
        }),
      },
    });

    const now = new Date('2026-04-21T10:00:00Z');
    const firstDueReminders = service.getDueReminders('patient-1', now);
    const secondDueReminders = service.getDueReminders('patient-1', now);

    expect(firstDueReminders).toHaveLength(2);
    expect(firstDueReminders.some((reminder) => reminder.isMedicationReminder())).toBe(true);
    expect(firstDueReminders.some((reminder) => reminder.isAppointmentReminder())).toBe(true);
    expect(secondDueReminders).toHaveLength(2);
  });

  it('snoozes, dismisses, and completes reminders', () => {
    const service = new ReminderService();

    const manualReminder = service.createManualReminder('caregiver-1', 'patient-1', {
      type: 'medication',
      relatedEntryId: 'manual-rem-1',
      title: 'Manual Check',
      message: 'Please confirm your medication.',
    });

    const dueBeforeSnooze = service.getDueReminders('patient-1', new Date('2026-04-21T10:00:00Z'));
    expect(dueBeforeSnooze).toHaveLength(1);

    const snoozedReminder = service.snoozeReminder(
      manualReminder.reminderId,
      new Date('2026-04-21T12:00:00Z')
    );
    expect(snoozedReminder.status).toBe('pending');

    const dueWhileSnoozed = service.getDueReminders('patient-1', new Date('2026-04-21T10:30:00Z'));
    expect(dueWhileSnoozed).toHaveLength(0);

    const dismissedReminder = service.dismissReminder(manualReminder.reminderId);
    expect(dismissedReminder.status).toBe('dismissed');

    const feedAfterDismiss = service.getNotificationFeed('patient-1');
    expect(feedAfterDismiss).toHaveLength(1);
    expect(feedAfterDismiss[0].status).toBe('dismissed');

    const anotherReminder = service.createManualReminder('caregiver-1', 'patient-1', {
      type: 'appointment',
      relatedEntryId: 'manual-rem-2',
      title: 'Follow-up Reminder',
      message: 'Please review your schedule.',
    });
    const completedReminder = service.markReminderCompleted(anotherReminder.reminderId);
    expect(completedReminder.status).toBe('completed');
  });

  it('enforces manual reminder permissions when dependency services are present', () => {
    const blockedByLinkService = new ReminderService({
      patientCaregiverLinkService: {
        canCaregiverAccessPatient: () => false,
      },
    });

    expect(() =>
      blockedByLinkService.createManualReminder('caregiver-1', 'patient-1', {
        title: 'Blocked',
        message: 'Blocked by link service.',
      })
    ).toThrow('Caregiver is not linked to this patient.');

    const blockedByPrivacyService = new ReminderService({
      patientCaregiverLinkService: {
        canCaregiverAccessPatient: () => true,
      },
      privacySettingsService: {
        canCaregiverSendManualReminder: () => false,
      },
    });

    expect(() =>
      blockedByPrivacyService.createManualReminder('caregiver-1', 'patient-1', {
        title: 'Blocked',
        message: 'Blocked by privacy service.',
      })
    ).toThrow('Manual caregiver reminders are not permitted for this patient.');
  });
});
