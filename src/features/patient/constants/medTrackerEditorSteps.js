export const MEDICINE_EDITOR_STEPS = {
  DETAILS: 'details',
  SCHEDULE_TYPE: 'scheduleType',
  SCHEDULE: 'schedule',
};

export const MEDICINE_SCHEDULE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const MEDICINE_SCHEDULE_TYPE_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.DAILY, label: 'Daily', caption: 'Take this medicine every day.' },
  { value: MEDICINE_SCHEDULE_TYPES.WEEKLY, label: 'Weekly', caption: 'Take this medicine on selected days of the week.' },
  { value: MEDICINE_SCHEDULE_TYPES.MONTHLY, label: 'Monthly', caption: 'Take this medicine on selected days of the month.' },
];

export const MEDICINE_SUB_INTERVAL_OPTIONS = [];
