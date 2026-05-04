import MedEntry from '../MedEntryModel';
import ApptEntry from '../ApptEntryModel';
import { MedTrackerService } from '../../services/MedTrackerService';
import { ApptTrackerService } from '../../services/ApptTrackerService';

const buildMedEntry = (overrides = {}) =>
  new MedEntry({
    medEntryId: 'med-1',
    medName: 'Metformin',
    unitStrength: '500 mg',
    unit: 'tablet',
    totalDailyAmount: 2,
    dailySched: [
      { scheduleType: 'time', scheduledTime: '08:00', doseSize: 1 },
      { scheduleType: 'time', scheduledTime: '20:00', doseSize: 1 },
    ],
    startDate: new Date('2026-05-01T00:00:00'),
    ...overrides,
  });

const buildApptEntry = (overrides = {}) =>
  new ApptEntry({
    apptEntryId: 'appt-1',
    concern: 'Checkup',
    address: 'City Clinic',
    contactNumber: '09171234567',
    dateSched: '2026-05-03',
    timeSched: '10:00',
    ...overrides,
  });

describe('missed status', () => {
  it('marks active untaken medication as missed when the next scheduled dose becomes due', () => {
    const entry = buildMedEntry();

    expect(entry.getScheduleStatus(0, new Date('2026-05-03T08:00:00'), new Date('2026-05-03T08:00:00'))).toBe('due');
    expect(entry.getScheduleStatus(0, new Date('2026-05-03T08:02:00'), new Date('2026-05-03T08:02:00'))).toBe('due');
    expect(entry.getScheduleStatus(0, new Date('2026-05-03T08:03:00'), new Date('2026-05-03T08:03:00'))).toBe('pending');
    expect(entry.isMissed(new Date('2026-05-03T08:00:00'), new Date('2026-05-03T08:00:00'))).toBe(false);
    expect(entry.isMissed(new Date('2026-05-03T19:59:00'), new Date('2026-05-03T19:59:00'))).toBe(false);
    expect(entry.isDue(new Date('2026-05-03T08:00:00'), new Date('2026-05-03T08:00:00'))).toBe(true);
    expect(entry.isPending(new Date('2026-05-03T08:03:00'), new Date('2026-05-03T08:03:00'))).toBe(true);
    expect(entry.getScheduleStatus(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe('missed');
    expect(entry.getScheduleStatus(1, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe('due');
    expect(entry.isMissed(new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(true);
  });

  it('does not mark a single daily medication schedule as missed without a later dose window', () => {
    const entry = buildMedEntry({
      totalDailyAmount: 1,
      dailySched: [{ scheduleType: 'time', scheduledTime: '08:00', doseSize: 1 }],
    });

    expect(entry.isDue(new Date('2026-05-03T08:00:00'), new Date('2026-05-03T08:00:00'))).toBe(true);
    expect(entry.getScheduleStatus(0, new Date('2026-05-03T08:03:00'), new Date('2026-05-03T08:03:00'))).toBe('pending');
    expect(entry.isMissed(new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(false);
    expect(entry.getScheduleStatus(0, new Date('2026-05-04T00:00:00'), new Date('2026-05-03T08:00:00'))).toBe('missed');
  });

  it('tracks taken and skipped status per medication schedule item', () => {
    const entry = buildMedEntry();

    entry.markScheduleTaken(0, new Date('2026-05-03T08:05:00Z'));
    entry.markScheduleSkipped(1, new Date('2026-05-03T20:05:00Z'));

    expect(entry.getScheduleStatus(0, new Date('2026-05-03T20:10:00'), new Date('2026-05-03T20:10:00'))).toBe('taken');
    expect(entry.dailySched[0].takenAt).toBe('2026-05-03T08:05:00.000Z');
    expect(entry.getScheduleStatus(1, new Date('2026-05-03T20:10:00'), new Date('2026-05-03T20:10:00'))).toBe('skipped');
    expect(entry.isMissed(new Date('2026-05-03T20:10:00'), new Date('2026-05-03T20:10:00'))).toBe(true);
    expect(entry.isTaken).toBe(false);
  });

  it('records the missed time when a missed schedule is later marked skipped', () => {
    const entry = buildMedEntry();
    const missedAt = new Date('2026-05-03T20:00:00');

    entry.markScheduleSkipped(0, new Date('2026-05-03T21:15:00'));

    expect(entry.getScheduleStatus(0, new Date('2026-05-03T21:15:00'), new Date('2026-05-03T21:15:00'))).toBe('skipped');
    expect(entry.dailySched[0].skippedAt).toBe(missedAt.toISOString());
  });

  it('records the skip press time when the schedule is not missed yet', () => {
    const entry = buildMedEntry();
    const skippedAt = new Date('2026-05-03T08:05:00');

    entry.markScheduleSkipped(0, skippedAt);

    expect(entry.dailySched[0].skippedAt).toBe(skippedAt.toISOString());
  });

  it('allows schedule status actions from due time until the day ends', () => {
    const entry = buildMedEntry();

    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T07:59:00'), new Date('2026-05-03T07:59:00'))).toBe(false);
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T08:00:00'), new Date('2026-05-03T08:00:00'))).toBe(true);
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T19:59:00'), new Date('2026-05-03T19:59:00'))).toBe(true);
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(true);
    expect(entry.isScheduleActionAvailable(1, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(true);
  });

  it('keeps due and missed medication schedule statuses in the service', () => {
    const service = new MedTrackerService({ user1: [buildMedEntry()] });

    expect(service.getDueMedEntries('user1', new Date('2026-05-03T08:00:00'))).toHaveLength(1);
    expect(service.getDueMedEntries('user1', new Date('2026-05-03T08:03:00'))).toHaveLength(0);
    expect(service.getMissedMedEntries('user1', new Date('2026-05-03T20:00:00'))).toHaveLength(1);
    expect(service.getDueMedEntries('user1', new Date('2026-05-03T20:00:00'))).toHaveLength(1);
  });

  it('updates one medication schedule item without marking the whole medicine taken', () => {
    const service = new MedTrackerService({ user1: [buildMedEntry()] });

    const updatedEntry = service.markMedScheduleTaken('user1', 'med-1', 0, new Date('2026-05-03T08:05:00Z'));

    expect(updatedEntry.dailySched[0].status).toBe('taken');
    expect(updatedEntry.dailySched[0].takenAt).toBe('2026-05-03T08:05:00.000Z');
    expect(updatedEntry.dailySched[1].status).toBe('pending');
    expect(updatedEntry.isTaken).toBe(false);
    expect(updatedEntry.timeTaken).toBe(null);
  });

  it('allows medication unit strength to be omitted', () => {
    const entry = buildMedEntry({ unitStrength: '' });

    expect(entry.unitStrength).toBe('');
    expect(entry.dosage).toBe('');
  });

  it('updates medication daily amount and schedule count together', () => {
    const service = new MedTrackerService({ user1: [buildMedEntry()] });

    const updatedEntry = service.updateMedEntry('user1', 'med-1', {
      totalDailyAmount: 1,
      dailySched: [{ scheduleType: 'time', scheduledTime: '08:00', doseSize: 1 }],
    });

    expect(updatedEntry.totalDailyAmount).toBe(1);
    expect(updatedEntry.dailySched).toHaveLength(1);
    expect(updatedEntry.getScheduleStatus(0, new Date('2026-05-04T06:59:00'), new Date('2026-05-03T08:00:00'))).toBe('missed');
    expect(updatedEntry.getScheduleStatus(0, new Date('2026-05-04T07:00:00'), new Date('2026-05-04T07:00:00'))).toBe('upcoming');
  });

  it('resets previous-day medication schedule statuses when the next day first schedule starts', () => {
    const entry = buildMedEntry();

    entry.markScheduleTaken(0, new Date('2026-05-03T08:05:00'));
    entry.markScheduleSkipped(1, new Date('2026-05-03T20:05:00'));

    expect(entry.getScheduleStatus(0, new Date('2026-05-04T07:59:00'), new Date('2026-05-04T07:59:00'))).toBe('taken');
    expect(entry.dailySched[1].status).toBe('skipped');

    expect(entry.getScheduleStatus(0, new Date('2026-05-04T08:00:00'), new Date('2026-05-04T08:00:00'))).toBe('due');
    expect(entry.dailySched[0].status).toBe('pending');
    expect(entry.dailySched[0].takenAt).toBe(null);
    expect(entry.dailySched[1].status).toBe('pending');
    expect(entry.dailySched[1].skippedAt).toBe(null);
  });

  it('keeps a single daily schedule missed until one hour before the next schedule', () => {
    const entry = buildMedEntry({
      totalDailyAmount: 1,
      dailySched: [{ scheduleType: 'time', scheduledTime: '08:00', doseSize: 1 }],
    });

    expect(entry.getScheduleStatus(0, new Date('2026-05-04T00:00:00'), new Date('2026-05-03T08:00:00'))).toBe('missed');
    expect(entry.getScheduleStatus(0, new Date('2026-05-04T06:59:00'), new Date('2026-05-03T08:00:00'))).toBe('missed');
    expect(entry.getScheduleStatus(0, new Date('2026-05-04T07:00:00'), new Date('2026-05-04T07:00:00'))).toBe('upcoming');
    expect(entry.getScheduleStatus(0, new Date('2026-05-04T08:00:00'), new Date('2026-05-04T08:00:00'))).toBe('due');
  });

  it('does not reset same-day medication schedule statuses after the first schedule starts', () => {
    const entry = buildMedEntry();

    entry.markScheduleTaken(0, new Date('2026-05-04T08:05:00'));

    expect(entry.getScheduleStatus(0, new Date('2026-05-04T09:00:00'), new Date('2026-05-04T09:00:00'))).toBe('taken');
    expect(entry.dailySched[0].takenAt).toBeTruthy();
  });

  it('allows a newly added past single schedule to be taken or skipped today', () => {
    const entry = buildMedEntry({
      totalDailyAmount: 1,
      dailySched: [
        {
          scheduleType: 'time',
          scheduledTime: '08:00',
          doseSize: 1,
          activatedAt: '2026-05-03T10:00:00',
        },
      ],
    });

    expect(entry.getScheduleStatus(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe('pending');
    expect(entry.isMissed(new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(false);
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(true);
    expect(entry.getScheduleStatus(0, new Date('2026-05-04T08:00:00'), new Date('2026-05-04T08:00:00'))).toBe('due');
  });

  it('allows a newly added past schedule until the day ends', () => {
    const entry = buildMedEntry({
      dailySched: [
        {
          scheduleType: 'time',
          scheduledTime: '08:00',
          doseSize: 1,
          activatedAt: '2026-05-03T10:00:00',
        },
        {
          scheduleType: 'time',
          scheduledTime: '20:00',
          doseSize: 1,
          activatedAt: '2026-05-03T10:00:00',
        },
      ],
    });

    expect(entry.getScheduleStatus(0, new Date('2026-05-03T10:00:00'), new Date('2026-05-03T10:00:00'))).toBe('pending');
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T10:00:00'), new Date('2026-05-03T10:00:00'))).toBe(true);
    expect(entry.getScheduleStatus(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe('missed');
    expect(entry.isScheduleActionAvailable(0, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe(true);
    expect(entry.getScheduleStatus(1, new Date('2026-05-03T20:00:00'), new Date('2026-05-03T20:00:00'))).toBe('due');
  });

  it('marks uncompleted appointments as missed after the scheduled time', () => {
    const entry = buildApptEntry();

    expect(entry.isMissed(new Date('2026-05-03T09:59:00'), new Date('2026-05-03T09:59:00'))).toBe(false);
    expect(entry.isDue(new Date('2026-05-03T10:00:00'), new Date('2026-05-03T10:00:00'))).toBe(true);
    expect(entry.isMissed(new Date('2026-05-03T10:01:00'), new Date('2026-05-03T10:01:00'))).toBe(true);
  });

  it('does not mark completed appointments as missed', () => {
    const entry = buildApptEntry({
      isCompleted: true,
      completedAt: new Date('2026-05-03T10:05:00'),
    });

    expect(entry.isMissed(new Date('2026-05-03T10:10:00'), new Date('2026-05-03T10:10:00'))).toBe(false);
  });

  it('separates due and missed appointment entries in the service', () => {
    const service = new ApptTrackerService({ user1: [buildApptEntry()] });

    expect(service.getDueApptEntries('user1', new Date('2026-05-03T10:00:00'))).toHaveLength(1);
    expect(service.getMissedApptEntries('user1', new Date('2026-05-03T10:01:00'))).toHaveLength(1);
    expect(service.getDueApptEntries('user1', new Date('2026-05-03T10:01:00'))).toHaveLength(0);
  });
});
