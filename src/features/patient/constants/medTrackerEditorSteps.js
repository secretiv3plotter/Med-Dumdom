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
  REGULAR_MONTHLY: 'regular_monthly',
  AS_NEEDED: 'asNeeded',
};

export const MEDICINE_SCHEDULE_TYPE_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.DAILY, label: 'Daily', caption: "I'll take this medicine everyday." },
  { value: MEDICINE_SCHEDULE_TYPES.WEEKLY, label: 'Weekly', caption: "I'll take this medicine on specific days of the week." },
  { value: MEDICINE_SCHEDULE_TYPES.MONTHLY, label: 'Monthly', caption: "I'll take this medicine on specific days of the month." },
  { value: 'regular_intervals', label: 'Regular Intervals', caption: "I'll take this medicine at fixed intervals.", isParent: true },
  { value: MEDICINE_SCHEDULE_TYPES.AS_NEEDED, label: 'As needed', caption: "I'll take this medicine when I feel symptoms." },
];

export const MEDICINE_SUB_INTERVAL_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_HOURLY, label: 'Hourly', caption: 'Repeats at regular hourly intervals.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_DAILY, label: 'Daily', caption: 'Repeats at regular daily intervals.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_WEEKLY, label: 'Weekly', caption: 'Repeats at regular weekly intervals.' },
  { value: MEDICINE_SCHEDULE_TYPES.REGULAR_MONTHLY, label: 'Monthly', caption: 'Repeats at regular monthly intervals.' },
];
