export const MEDICINE_EDITOR_STEPS = {
  DETAILS: 'details',
  SCHEDULE_TYPE: 'scheduleType',
  SCHEDULE: 'schedule',
};

export const MEDICINE_SCHEDULE_TYPES = {
  DAILY: 'daily',
  EVERY_FEW_HOURS: 'everyFewHours',
  SPECIFIC_WEEKDAYS: 'specificWeekdays',
  EVERY_FEW_DAYS: 'everyFewDays',
  WEEKLY_MONTHLY: 'weeklyMonthly',
  AS_NEEDED: 'asNeeded',
};

export const MEDICINE_SCHEDULE_TYPE_OPTIONS = [
  { value: MEDICINE_SCHEDULE_TYPES.DAILY, label: 'Daily' },
  { value: MEDICINE_SCHEDULE_TYPES.EVERY_FEW_HOURS, label: 'Every few hours' },
  { value: MEDICINE_SCHEDULE_TYPES.SPECIFIC_WEEKDAYS, label: 'Specific weekdays' },
  { value: MEDICINE_SCHEDULE_TYPES.EVERY_FEW_DAYS, label: 'Every few days' },
  { value: MEDICINE_SCHEDULE_TYPES.WEEKLY_MONTHLY, label: 'Weekly/monthly' },
  { value: MEDICINE_SCHEDULE_TYPES.AS_NEEDED, label: 'As needed' },
];
