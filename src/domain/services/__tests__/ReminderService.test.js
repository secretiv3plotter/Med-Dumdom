import { ReminderService } from '../ReminderService';
import { MedTrackerService } from '../MedTrackerService';
import { ApptTrackerService } from '../ApptTrackerService';
import { NotifSettingsService } from '../NotifSettingsService';

const USER_ID = 'patient-1';

const buildAppt = (overrides = {}) => ({
  apptEntryId: 'appt-1',
  concern: 'Follow-up',
  address: 'Clinic',
  contactNumber: '09170000000',
  dateSched: '2026-04-22',
  timeSched: '10:00',
  note: '',
  isCompleted: false,
  ...overrides,
});

const buildMed = (overrides = {}) => ({
  medEntryId: 'med-1',
  medName: 'Metformin',
  unitStrength: '500 mg',
  unit: 'tablet',
  totalDailyAmount: 1,
  dailySched: [{ scheduleType: 'time', scheduledTime: '10:00', doseSize: 1 }],
  startDate: new Date('2026-04-01'),
  endDate: null,
  instructions: '',
  inventoryCount: 30,
  prescriberContact: 'Dr. A',
  isTaken: false,
  timeTaken: null,
  dateTaken: null,
});

const buildService = ({
  medEntries = [],
  apptEntries = [],
  settings = {},
} = {}) => {
  const medTrackerService = new MedTrackerService({ [USER_ID]: medEntries });
  const apptTrackerService = new ApptTrackerService({ [USER_ID]: apptEntries });
  const notifSettingsService = new NotifSettingsService({ [USER_ID]: settings });

  return new ReminderService({
    medTrackerService,
    apptTrackerService,
    notifSettingsService,
  });
};

describe('ReminderService notification feed rules', () => {
  it('prioritizes reminders at actual due time to the top', () => {
    const service = buildService({
      apptEntries: [
        buildAppt({ apptEntryId: 'appt-due-now', timeSched: '09:30' }),
        buildAppt({ apptEntryId: 'appt-upcoming', timeSched: '10:00' }),
      ],
      settings: { apptReminderTime: 60, apptRemindersEnabled: true },
    });

    const now = new Date('2026-04-22T09:30:00');
    const feed = service.getNotificationFeed(USER_ID, now);

    expect(feed.length).toBeGreaterThanOrEqual(2);
    expect(feed[0].relatedEntryId).toBe('appt-due-now');
  });

  it('keeps snoozed reminders hidden and returns them at due time when snooze exceeds due', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-22T09:20:00'));

    const service = buildService({
      apptEntries: [buildAppt({ apptEntryId: 'appt-snooze-clamp', timeSched: '10:00' })],
      settings: {
        apptReminderTime: 60,
        apptSnoozeDuration: 90,
        apptRemindersEnabled: true,
      },
    });

    const initialFeed = service.getNotificationFeed(USER_ID, new Date('2026-04-22T09:20:00'));
    expect(initialFeed).toHaveLength(1);

    const reminderId = initialFeed[0].reminderId;
    const snoozed = service.snoozeReminder(reminderId);
    expect(snoozed.snoozeDateTime.getTime()).toBe(new Date('2026-04-22T10:00:00').getTime());

    const whileSnoozed = service.getNotificationFeed(USER_ID, new Date('2026-04-22T09:59:00'));
    expect(whileSnoozed).toHaveLength(0);

    const atDueTime = service.getNotificationFeed(USER_ID, new Date('2026-04-22T10:00:00'));
    expect(atDueTime).toHaveLength(1);
    expect(atDueTime[0].reminderId).toBe(reminderId);

    jest.useRealTimers();
  });

  it('marks completed reminders as completed in associated tracker entries', () => {
    const service = buildService({
      medEntries: [buildMed()],
      settings: { medReminderTime: 30, medRemindersEnabled: true },
    });

    const now = new Date('2026-04-22T09:45:00');
    const feed = service.getNotificationFeed(USER_ID, now);
    expect(feed).toHaveLength(1);

    service.markReminderCompleted(feed[0].reminderId);

    const medEntries = service.medTrackerService.listMedEntries(USER_ID);
    expect(medEntries[0].isTaken).toBe(true);

    const refreshedFeed = service.getNotificationFeed(USER_ID, now);
    expect(refreshedFeed).toHaveLength(0);
  });

  it('includes unresolved reminders from older dates', () => {
    const service = buildService({
      apptEntries: [
        buildAppt({ apptEntryId: 'appt-yesterday', dateSched: '2026-04-21', timeSched: '10:00' }),
        buildAppt({ apptEntryId: 'appt-older-unresolved', dateSched: '2026-04-19', timeSched: '08:00' }),
      ],
      settings: { apptReminderTime: 0, apptRemindersEnabled: true },
    });

    const feed = service.getNotificationFeed(USER_ID, new Date('2026-04-22T12:00:00'));
    const relatedIds = feed.map((reminder) => reminder.relatedEntryId);

    expect(relatedIds).toContain('appt-yesterday');
    expect(relatedIds).toContain('appt-older-unresolved');
  });

  it('reflects med and appointment edits in existing reminder cards', () => {
    const service = buildService({
      medEntries: [buildMed({ medEntryId: 'med-edit', medName: 'Old Med', dailySched: [{ scheduleType: 'time', scheduledTime: '10:00', doseSize: 1 }] })],
      apptEntries: [buildAppt({ apptEntryId: 'appt-edit', concern: 'Old Concern', timeSched: '10:00' })],
      settings: {
        medReminderTime: 60,
        apptReminderTime: 60,
        medRemindersEnabled: true,
        apptRemindersEnabled: true,
      },
    });
    const medEntryId = service.medTrackerService.listMedEntries(USER_ID)[0].medEntryId;
    const apptEntryId = service.apptTrackerService.listApptEntries(USER_ID)[0].apptEntryId;

    const initialFeed = service.getNotificationFeed(USER_ID, new Date('2026-04-22T09:05:00'));
    const initialMedReminder = initialFeed.find((item) => item.type === 'medication');
    const initialApptReminder = initialFeed.find((item) => item.relatedEntryId === apptEntryId);
    expect(initialMedReminder).toBeTruthy();
    expect(initialApptReminder).toBeTruthy();

    service.medTrackerService.updateMedEntry(USER_ID, medEntryId, {
      medName: 'Updated Med',
      dailySched: [{ scheduleType: 'time', scheduledTime: '11:15', doseSize: 1 }],
    });
    service.apptTrackerService.updateApptEntry(USER_ID, apptEntryId, {
      concern: 'Updated Concern',
      timeSched: '11:30',
    });

    const updatedFeed = service.getNotificationFeed(USER_ID, new Date('2026-04-22T10:35:00'));
    const updatedMedReminder = updatedFeed.find((item) => item.type === 'medication');
    const updatedApptReminder = updatedFeed.find((item) => item.relatedEntryId === apptEntryId);

    expect(updatedMedReminder?.message).not.toBe(initialMedReminder?.message);
    expect(updatedMedReminder?.message).toContain('Updated Med');
    expect(updatedMedReminder?.message).toContain('11:15');
    expect(updatedApptReminder?.title).toBe('Updated Concern');
    expect(updatedApptReminder?.dueAt?.getTime()).not.toBe(initialApptReminder?.dueAt?.getTime());
    expect(updatedApptReminder?.dueAt?.getTime()).toBe(new Date('2026-04-22T11:30:00').getTime());
  });
});
