import RealmMedTrackerRepository from './RealmMedTrackerRepository';

export const SHOULD_SEED_MED_TRACKER_DATA = false;
export const SHOULD_CLEAR_SEED_MED_DATA = false;

const CURRENT_USER_ID = 'current-user';
const SEED_MED_PREFIX = 'seed-medtracker-';

const createSchedule = (overrides = {}) => ({
  scheduleType: 'time',
  doseSize: 1,
  scheduledTime: '08:00',
  status: 'pending',
  takenAt: null,
  skippedAt: null,
  activatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const createMedSnapshot = ({
  medEntryId,
  medName,
  unitStrength,
  unit,
  totalDailyAmount,
  dailySched,
  startDate = new Date('2026-05-01T00:00:00'),
  endDate = null,
  instructions = 'Seeded data for med tracker testing.',
  prescriberContact = 'Dr. Seed',
}) => ({
  medEntryId,
  medName,
  unitStrength,
  unit,
  totalDailyAmount,
  dailySched,
  startDate,
  endDate,
  instructions,
  prescriberContact,
});

const seedMedicines = [
  {
    medEntryId: `${SEED_MED_PREFIX}daily-tablet`,
    medName: 'Seed Daily Tablet',
    unitStrength: '10 mg',
    unit: 'tablet',
    totalDailyAmount: 2,
    dailySched: [
      createSchedule({ scheduledTime: '08:00', status: 'pending' }),
      createSchedule({ scheduledTime: '20:00', status: 'pending' }),
    ],
    startDate: new Date('2026-05-01T00:00:00'),
    endDate: null,
    instructions: 'Morning and evening seed medicine.',
    prescriberContact: 'Dr. Santos',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}short-course`,
    medName: 'Seed Short Course',
    unitStrength: '5 ml',
    unit: 'ml',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'after',
        associatedMeal: 'breakfast',
        mealTime: '08:30',
        status: 'pending',
      }),
    ],
    startDate: new Date('2026-05-01T00:00:00'),
    endDate: new Date('2026-05-10T00:00:00'),
    instructions: 'Seeded finite-duration medicine.',
    prescriberContact: 'Dr. Reyes',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}single-night`,
    medName: 'Seed Single Night Dose',
    unitStrength: '25 mg',
    unit: 'capsule',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({ scheduledTime: '22:00', status: 'pending' }),
    ],
    startDate: new Date('2026-04-01T00:00:00'),
    endDate: null,
    instructions: 'Single schedule seed medicine for one-dose-a-day cases.',
    prescriberContact: 'Dr. Lim',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}three-times`,
    medName: 'Seed Three Times Daily',
    unitStrength: '250 mg',
    unit: 'tablet',
    totalDailyAmount: 3,
    dailySched: [
      createSchedule({ scheduledTime: '06:00', status: 'pending' }),
      createSchedule({ scheduledTime: '14:00', status: 'pending' }),
      createSchedule({ scheduledTime: '22:00', status: 'pending' }),
    ],
    startDate: new Date('2025-12-15T00:00:00'),
    endDate: null,
    instructions: 'Three schedule seed medicine for mixed daily outcomes.',
    prescriberContact: 'Dr. Tan',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}meal-combo`,
    medName: 'Seed Meal Combo',
    unitStrength: '1 unit',
    unit: 'units',
    totalDailyAmount: 2,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'before',
        associatedMeal: 'breakfast',
        mealTime: '07:30',
        status: 'pending',
      }),
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'after',
        associatedMeal: 'dinner',
        mealTime: '19:30',
        status: 'pending',
      }),
    ],
    startDate: new Date('2026-03-01T00:00:00'),
    endDate: new Date('2026-06-30T00:00:00'),
    instructions: 'Meal-based seed medicine for before/after meal cases.',
    prescriberContact: 'Dr. Cruz',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}uneven-dose`,
    medName: 'Seed Uneven Dose',
    unitStrength: '100 mg',
    unit: 'tablet',
    totalDailyAmount: 3,
    dailySched: [
      createSchedule({ doseSize: 2, scheduledTime: '07:00', status: 'pending' }),
      createSchedule({ doseSize: 1, scheduledTime: '19:00', status: 'pending' }),
    ],
    startDate: new Date('2026-02-01T00:00:00'),
    endDate: null,
    instructions: 'Tests uneven dose sizes that still sum to the daily total.',
    prescriberContact: '',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}four-times-drops`,
    medName: 'Seed Four Times Drops',
    unitStrength: '2 drops',
    unit: 'drops',
    totalDailyAmount: 4,
    dailySched: [
      createSchedule({ scheduledTime: '06:00', status: 'pending' }),
      createSchedule({ scheduledTime: '12:00', status: 'pending' }),
      createSchedule({ scheduledTime: '18:00', status: 'pending' }),
      createSchedule({ scheduledTime: '23:00', status: 'pending' }),
    ],
    startDate: new Date('2026-01-01T00:00:00'),
    endDate: new Date('2026-12-31T00:00:00'),
    instructions: 'Four-times-a-day custom unit seed medicine.',
    prescriberContact: 'Dr. Navarro',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}snack-dose`,
    medName: 'Seed Snack Dose',
    unitStrength: '1 sachet',
    unit: 'sachet',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'during',
        associatedMeal: 'snack',
        mealTime: '15:30',
        status: 'pending',
      }),
    ],
    startDate: new Date('2026-05-04T00:00:00'),
    endDate: null,
    instructions: '',
    prescriberContact: '',
  },
  {
    medEntryId: `${SEED_MED_PREFIX}future-start`,
    medName: 'Seed Future Start',
    unitStrength: '50 mg',
    unit: 'tablet',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({ scheduledTime: '09:00', status: 'pending', activatedAt: '2026-06-01T00:00:00.000Z' }),
    ],
    startDate: new Date('2026-06-01T00:00:00'),
    endDate: null,
    instructions: 'Future-start medicine for upcoming inactive-date cases.',
    prescriberContact: 'Dr. Future',
  },
];

const dailyTabletSnapshot = (date, eveningStatus = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}daily-tablet`,
    medName: 'Seed Daily Tablet',
    unitStrength: '10 mg',
    unit: 'tablet',
    totalDailyAmount: 2,
    dailySched: [
      createSchedule({ scheduledTime: '08:00', status: 'taken', takenAt: `${date}T08:04:00.000Z` }),
      createSchedule(
        eveningStatus === 'taken'
          ? { scheduledTime: '20:00', status: 'taken', takenAt: `${date}T20:06:00.000Z` }
          : { scheduledTime: '20:00', status: 'skipped', skippedAt: `${date}T20:12:00.000Z` }
      ),
    ],
  });

const shortCourseSnapshot = (date, status = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}short-course`,
    medName: 'Seed Short Course',
    unitStrength: '5 ml',
    unit: 'ml',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'after',
        associatedMeal: 'breakfast',
        mealTime: '08:30',
        status,
        takenAt: status === 'taken' ? `${date}T08:40:00.000Z` : null,
        skippedAt: status === 'skipped' ? `${date}T08:45:00.000Z` : null,
      }),
    ],
    endDate: new Date('2026-05-10T00:00:00'),
  });

const singleNightSnapshot = (date, status = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}single-night`,
    medName: 'Seed Single Night Dose',
    unitStrength: '25 mg',
    unit: 'capsule',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({
        scheduledTime: '22:00',
        status,
        takenAt: status === 'taken' ? `${date}T22:10:00.000Z` : null,
        skippedAt: status === 'skipped' ? `${date}T23:50:00.000Z` : null,
      }),
    ],
    startDate: new Date('2026-04-01T00:00:00'),
    instructions: 'Single schedule seed medicine for one-dose-a-day cases.',
    prescriberContact: 'Dr. Lim',
  });

const threeTimesSnapshot = (date, pattern = 'all-taken') => {
  const statusesByPattern = {
    'all-taken': ['taken', 'taken', 'taken'],
    'middle-missed': ['taken', 'skipped', 'taken'],
    'all-missed': ['skipped', 'skipped', 'skipped'],
    'last-missed': ['taken', 'taken', 'skipped'],
  };
  const statuses = statusesByPattern[pattern] || statusesByPattern['all-taken'];
  const times = ['06:00', '14:00', '22:00'];

  return createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}three-times`,
    medName: 'Seed Three Times Daily',
    unitStrength: '250 mg',
    unit: 'tablet',
    totalDailyAmount: 3,
    dailySched: times.map((time, index) =>
      createSchedule({
        scheduledTime: time,
        status: statuses[index],
        takenAt: statuses[index] === 'taken' ? `${date}T${time}:00.000Z` : null,
        skippedAt: statuses[index] === 'skipped' ? `${date}T${time}:00.000Z` : null,
      })
    ),
    startDate: new Date('2025-12-15T00:00:00'),
    instructions: 'Three schedule seed medicine for mixed daily outcomes.',
    prescriberContact: 'Dr. Tan',
  });
};

const mealComboSnapshot = (date, dinnerStatus = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}meal-combo`,
    medName: 'Seed Meal Combo',
    unitStrength: '1 unit',
    unit: 'units',
    totalDailyAmount: 2,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'before',
        associatedMeal: 'breakfast',
        mealTime: '07:30',
        status: 'taken',
        takenAt: `${date}T07:20:00.000Z`,
      }),
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'after',
        associatedMeal: 'dinner',
        mealTime: '19:30',
        status: dinnerStatus,
        takenAt: dinnerStatus === 'taken' ? `${date}T19:45:00.000Z` : null,
        skippedAt: dinnerStatus === 'skipped' ? `${date}T20:00:00.000Z` : null,
      }),
    ],
    startDate: new Date('2026-03-01T00:00:00'),
    endDate: new Date('2026-06-30T00:00:00'),
    instructions: 'Meal-based seed medicine for before/after meal cases.',
    prescriberContact: 'Dr. Cruz',
  });

const unevenDoseSnapshot = (date, eveningStatus = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}uneven-dose`,
    medName: 'Seed Uneven Dose',
    unitStrength: '100 mg',
    unit: 'tablet',
    totalDailyAmount: 3,
    dailySched: [
      createSchedule({ doseSize: 2, scheduledTime: '07:00', status: 'taken', takenAt: `${date}T07:05:00.000Z` }),
      createSchedule(
        eveningStatus === 'taken'
          ? { doseSize: 1, scheduledTime: '19:00', status: 'taken', takenAt: `${date}T19:05:00.000Z` }
          : { doseSize: 1, scheduledTime: '19:00', status: 'skipped', skippedAt: `${date}T19:30:00.000Z` }
      ),
    ],
    startDate: new Date('2026-02-01T00:00:00'),
    instructions: 'Tests uneven dose sizes that still sum to the daily total.',
    prescriberContact: '',
  });

const fourTimesDropsSnapshot = (date, pattern = 'all-taken') => {
  const statusesByPattern = {
    'all-taken': ['taken', 'taken', 'taken', 'taken'],
    'first-missed': ['skipped', 'taken', 'taken', 'taken'],
    'alternating': ['taken', 'skipped', 'taken', 'skipped'],
    'all-missed': ['skipped', 'skipped', 'skipped', 'skipped'],
  };
  const statuses = statusesByPattern[pattern] || statusesByPattern['all-taken'];
  const times = ['06:00', '12:00', '18:00', '23:00'];

  return createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}four-times-drops`,
    medName: 'Seed Four Times Drops',
    unitStrength: '2 drops',
    unit: 'drops',
    totalDailyAmount: 4,
    dailySched: times.map((time, index) =>
      createSchedule({
        scheduledTime: time,
        status: statuses[index],
        takenAt: statuses[index] === 'taken' ? `${date}T${time}:00.000Z` : null,
        skippedAt: statuses[index] === 'skipped' ? `${date}T${time}:00.000Z` : null,
      })
    ),
    startDate: new Date('2026-01-01T00:00:00'),
    endDate: new Date('2026-12-31T00:00:00'),
    instructions: 'Four-times-a-day custom unit seed medicine.',
    prescriberContact: 'Dr. Navarro',
  });
};

const snackDoseSnapshot = (date, status = 'taken') =>
  createMedSnapshot({
    medEntryId: `${SEED_MED_PREFIX}snack-dose`,
    medName: 'Seed Snack Dose',
    unitStrength: '1 sachet',
    unit: 'sachet',
    totalDailyAmount: 1,
    dailySched: [
      createSchedule({
        scheduleType: 'meal',
        doseSize: 1,
        scheduledTime: undefined,
        mealContext: 'during',
        associatedMeal: 'snack',
        mealTime: '15:30',
        status,
        takenAt: status === 'taken' ? `${date}T15:35:00.000Z` : null,
        skippedAt: status === 'skipped' ? `${date}T16:00:00.000Z` : null,
      }),
    ],
    startDate: new Date('2026-05-04T00:00:00'),
    instructions: '',
    prescriberContact: '',
  });

const historySnapshots = [
  dailyTabletSnapshot('2026-05-01', 'taken'),
  dailyTabletSnapshot('2026-05-02', 'skipped'),
  dailyTabletSnapshot('2026-05-03', 'taken'),
  dailyTabletSnapshot('2026-05-04', 'skipped'),
  dailyTabletSnapshot('2026-05-08', 'taken'),
  dailyTabletSnapshot('2026-05-11', 'taken'),
  dailyTabletSnapshot('2026-04-28', 'skipped'),
  dailyTabletSnapshot('2026-04-29', 'taken'),
  dailyTabletSnapshot('2026-04-30', 'taken'),
  dailyTabletSnapshot('2026-01-02', 'skipped'),
  dailyTabletSnapshot('2025-12-31', 'taken'),
  shortCourseSnapshot('2026-05-01', 'taken'),
  shortCourseSnapshot('2026-05-02', 'taken'),
  shortCourseSnapshot('2026-05-03', 'skipped'),
  shortCourseSnapshot('2026-05-07', 'taken'),
  shortCourseSnapshot('2026-05-09', 'skipped'),
  shortCourseSnapshot('2026-04-29', 'skipped'),
  singleNightSnapshot('2026-05-01', 'taken'),
  singleNightSnapshot('2026-05-02', 'skipped'),
  singleNightSnapshot('2026-05-10', 'taken'),
  singleNightSnapshot('2026-03-31', 'skipped'),
  singleNightSnapshot('2025-12-30', 'taken'),
  threeTimesSnapshot('2026-05-01', 'all-taken'),
  threeTimesSnapshot('2026-05-02', 'middle-missed'),
  threeTimesSnapshot('2026-05-03', 'all-missed'),
  threeTimesSnapshot('2026-04-15', 'last-missed'),
  threeTimesSnapshot('2026-02-14', 'middle-missed'),
  threeTimesSnapshot('2025-12-31', 'all-taken'),
  mealComboSnapshot('2026-05-01', 'taken'),
  mealComboSnapshot('2026-05-04', 'skipped'),
  mealComboSnapshot('2026-04-20', 'taken'),
  mealComboSnapshot('2026-03-05', 'skipped'),
  mealComboSnapshot('2026-03-12', 'taken'),
  unevenDoseSnapshot('2026-05-01', 'taken'),
  unevenDoseSnapshot('2026-05-02', 'skipped'),
  unevenDoseSnapshot('2026-02-01', 'taken'),
  unevenDoseSnapshot('2026-02-08', 'skipped'),
  fourTimesDropsSnapshot('2026-05-01', 'all-taken'),
  fourTimesDropsSnapshot('2026-05-02', 'first-missed'),
  fourTimesDropsSnapshot('2026-04-01', 'alternating'),
  fourTimesDropsSnapshot('2026-01-15', 'all-missed'),
  snackDoseSnapshot('2026-05-04', 'taken'),
  snackDoseSnapshot('2026-05-05', 'skipped'),
  snackDoseSnapshot('2026-05-12', 'taken'),
];

export const seedMedTrackerTestData = (realm) => {
  if (!realm) {
    return;
  }

  const repo = new RealmMedTrackerRepository(realm);
  seedMedicines.forEach((medicine) => {
    repo.addMedEntry(CURRENT_USER_ID, medicine);
  });

  repo.write(() => {
    const seedMeds = realm.objects('MedEntry').filtered('medEntryId BEGINSWITH $0', SEED_MED_PREFIX);
    Array.from(seedMeds).forEach((entry) => {
      entry.isDeleted = false;
      entry.deletedAt = null;
      entry.updatedAt = new Date();
    });

    historySnapshots.forEach((snapshot) => {
      const historyDate = snapshot.dailySched[0]?.takenAt || snapshot.dailySched[0]?.skippedAt || snapshot.startDate;
      repo.snapshotDailyHistory(CURRENT_USER_ID, snapshot, new Date(historyDate));
    });
  });
};

export const clearMedTrackerSeedData = (realm) => {
  if (!realm) {
    return 0;
  }

  return realm.write(() => {
    const seedMeds = realm.objects('MedEntry').filtered('medEntryId BEGINSWITH $0', SEED_MED_PREFIX);
    const seedHistory = realm.objects('MedTrackerDailyHistory').filtered('medEntryId BEGINSWITH $0', SEED_MED_PREFIX);
    const now = new Date();
    let clearedCount = 0;

    Array.from(seedHistory).forEach((entry) => {
      if (!entry.isDeleted) {
        entry.isDeleted = true;
        entry.deletedAt = now;
        clearedCount += 1;
      }
    });

    Array.from(seedMeds).forEach((entry) => {
      if (!entry.isDeleted) {
        entry.isDeleted = true;
        entry.deletedAt = now;
        entry.updatedAt = now;
        clearedCount += 1;
      }
    });

    return clearedCount;
  });
};
