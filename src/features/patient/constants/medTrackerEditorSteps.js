export const MEDICINE_EDITOR_STEPS = {
  DETAILS: 'details',
  SCHEDULE_TYPE: 'scheduleType',
  SCHEDULE: 'schedule',
};

export const MEDICINE_SCHEDULE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  REGULAR_DAILY: 'regular_daily',
  REGULAR_HOURLY: 'regular_hourly',
  REGULAR_WEEKLY: 'regular_weekly',
  REGULAR_EVERY_WEEKS: 'regular_every_weeks',
  REGULAR_MONTHLY: 'regular_monthly',
  AS_NEEDED: 'asNeeded',
};

export const MEDICINE_SCHEDULE_TYPE_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.DAILY, label: 'Daily', caption: 'Take this medicine every day.' },
  { value: MEDICINE_SCHEDULE_TYPES.WEEKLY, label: 'Weekly', caption: 'Take this medicine on selected days of the week.' },
  { value: MEDICINE_SCHEDULE_TYPES.MONTHLY, label: 'Monthly', caption: 'Take this medicine on selected days of the month.' },
  { value: 'regular_intervals', label: 'Regular Intervals', caption: 'Take this medicine after the same amount of time passes.', isParent: true },
  { value: MEDICINE_SCHEDULE_TYPES.AS_NEEDED, label: 'As needed', caption: 'Take this medicine only when symptoms happen.' },
];

export const MEDICINE_SUB_INTERVAL_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY, label: 'Hourly', caption: 'Repeat after a set number of hours.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY, label: 'Every few days', caption: 'Repeat after a set number of days.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_EVERY_WEEKS, label: 'Weekly', caption: 'Repeat after a set number of weeks.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY, label: 'Monthly', caption: 'Repeat after a set number of months.' },
];
