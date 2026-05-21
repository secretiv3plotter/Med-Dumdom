import {
  DUE_NOW_GRACE_MINUTES,
  SINGLE_SCHEDULE_UPCOMING_WINDOW_MINUTES,
  dateTimeAtMinutes,
  ensureScheduleIndex,
  getScheduleDateTime,
  getIntervalOccurrenceDateTime,
  getIntervalNextOccurrenceDateTime,
  isAsNeededScheduleEntry,
  isIntervalScheduleEntry,
  isScheduleDateTimeInCurrentInterval,
  isBeforeCurrentDay,
  isBeforeDay,
  normalizeDate,
  normalizeOptionalDate,
  normalizeTime,
  scheduleEffectiveTime,
  toMinutes,
} from './medEntryModelUtils';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SCHEDULE_MISSED_AFTER_MS = 24 * 60 * 60 * 1000;

const isDailyScheduleEntry = (scheduleEntry) =>
  !isAsNeededScheduleEntry(scheduleEntry) &&
  !isIntervalScheduleEntry(scheduleEntry) &&
  !scheduleEntry?.dayOfWeek &&
  !scheduleEntry?.monthOfYear &&
  !scheduleEntry?.dayOfMonth;

export const isScheduleActiveOnDate = (scheduleEntry, currDate = new Date()) => {
  const currentDay = normalizeOptionalDate(currDate, 'currDate');
  if (!currentDay) {
    return false;
  }

  if (scheduleEntry?.dayOfWeek) {
    return DAYS_OF_WEEK[currentDay.getDay()] === scheduleEntry.dayOfWeek;
  }

  if (scheduleEntry?.monthOfYear) {
    if (MONTHS[currentDay.getMonth()] !== scheduleEntry.monthOfYear) {
      return false;
    }
  }

  if (scheduleEntry?.dayOfMonth) {
    return currentDay.getDate() === Number(scheduleEntry.dayOfMonth);
  }

  return true;
};

export const resetDailyScheduleStatusesIfNeeded = (medEntry, now = new Date(), syncTakenStatus) => {
  const currentDateTime = normalizeDate(now, 'now') ?? new Date();
  if (Number.isNaN(currentDateTime.getTime()) || !medEntry.dailySched.length) {
    return false;
  }

  const firstScheduleMinutes = medEntry.dailySched
    .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
    .filter((minutes) => minutes !== null)
    .sort((firstMinute, secondMinute) => firstMinute - secondMinute)[0];
  const currentMinutes = toMinutes(normalizeTime(currentDateTime, 'now'));

  const resetStartMinutes =
    medEntry.dailySched.length === 1
      ? Math.max(0, firstScheduleMinutes - SINGLE_SCHEDULE_UPCOMING_WINDOW_MINUTES)
      : firstScheduleMinutes;

  if (firstScheduleMinutes === undefined || currentMinutes === null || currentMinutes < resetStartMinutes) {
    return false;
  }

  const currentDay = new Date(currentDateTime.getTime());
  currentDay.setHours(0, 0, 0, 0);

  let didReset = false;
  medEntry.dailySched = medEntry.dailySched.map((entry) => {
    if (
      isIntervalScheduleEntry(entry) &&
      entry.status !== 'pending' &&
      !isScheduleDateTimeInCurrentInterval(entry, getScheduleDateTime(entry), currentDateTime)
    ) {
      didReset = true;
      return {
        ...entry,
        status: 'pending',
        takenAt: null,
        skippedAt: null,
      };
    }

    if (entry.status === 'pending' || !isBeforeDay(getScheduleDateTime(entry), currentDay)) {
      return entry;
    }

    didReset = true;
    return {
      ...entry,
      status: 'pending',
      takenAt: null,
      skippedAt: null,
    };
  });

  if (didReset) {
    syncTakenStatus?.();
  }

  return didReset;
};

export const isActiveOnDate = (medEntry, currDate = new Date()) => {
  const currentDay = normalizeOptionalDate(currDate, 'currDate');

  if (!currentDay) {
    return false;
  }

  const startDay = normalizeOptionalDate(medEntry.startDate, 'startDate');
  const endDay = normalizeOptionalDate(medEntry.endDate, 'endDate');

  if (startDay) {
    startDay.setHours(0, 0, 0, 0);
  }
  currentDay.setHours(0, 0, 0, 0);

  if (startDay && currentDay < startDay) {
    return false;
  }

  if (endDay) {
    endDay.setHours(0, 0, 0, 0);
    if (currentDay > endDay) {
      return false;
    }
  }

  return true;
};

export const isPastEndDate = (medEntry, currDate = new Date()) => {
  const currentDay = normalizeOptionalDate(currDate, 'currDate');
  const endDay = normalizeOptionalDate(medEntry.endDate, 'endDate');

  if (!currentDay || !endDay) {
    return false;
  }

  currentDay.setHours(0, 0, 0, 0);
  endDay.setHours(0, 0, 0, 0);
  return currentDay > endDay;
};

const getScheduledDateTimeForDate = (scheduleEntry, dateValue) => {
  const scheduleMinutes = toMinutes(scheduleEffectiveTime(scheduleEntry));
  if (scheduleMinutes === null || !(dateValue instanceof Date)) {
    return null;
  }

  return dateTimeAtMinutes(dateValue, scheduleMinutes);
};

const getLatestScheduleOccurrenceDateTime = (medEntry, scheduleEntry, cutoffTime = new Date()) => {
  if (isIntervalScheduleEntry(scheduleEntry) || isAsNeededScheduleEntry(scheduleEntry)) {
    return null;
  }

  const cutoffDateTime = normalizeDate(cutoffTime, 'cutoffTime') ?? new Date();
  for (let dayOffset = 0; dayOffset <= 370; dayOffset += 1) {
    const candidateDay = new Date(cutoffDateTime.getTime());
    candidateDay.setDate(candidateDay.getDate() - dayOffset);
    candidateDay.setHours(0, 0, 0, 0);

    if (!isActiveOnDate(medEntry, candidateDay) || !isScheduleActiveOnDate(scheduleEntry, candidateDay)) {
      continue;
    }

    const occurrence = getScheduledDateTimeForDate(scheduleEntry, candidateDay);
    if (occurrence && occurrence <= cutoffDateTime) {
      return occurrence;
    }
  }

  return null;
};

const getLatestStaleScheduleOccurrenceDateTime = (medEntry, scheduleEntry, currentTime = new Date()) => {
  const currentDateTime = normalizeDate(currentTime, 'currentTime') ?? new Date();
  const staleCutoff = new Date(currentDateTime.getTime() - SCHEDULE_MISSED_AFTER_MS);
  return getLatestScheduleOccurrenceDateTime(medEntry, scheduleEntry, staleCutoff);
};

export const getScheduleStatus = (medEntry, scheduleIndex, currTime = new Date(), currDate = new Date(), syncTakenStatus) => {
  resetDailyScheduleStatusesIfNeeded(medEntry, currTime instanceof Date ? currTime : currDate, syncTakenStatus);
  ensureScheduleIndex(medEntry.dailySched, scheduleIndex);
  const scheduleEntry = medEntry.dailySched[scheduleIndex];

  if (isPastEndDate(medEntry, currDate)) {
    return 'inactive';
  }

  if (!isActiveOnDate(medEntry, currDate)) {
    return 'upcoming';
  }

  if (isAsNeededScheduleEntry(scheduleEntry)) {
    return scheduleEntry.status === 'taken' || scheduleEntry.status === 'skipped'
      ? scheduleEntry.status
      : 'pending';
  }

  const currentTime = currTime instanceof Date ? currTime : currTime || currDate;

  if (!isIntervalScheduleEntry(scheduleEntry) && !isScheduleActiveOnDate(scheduleEntry, currDate)) {
    if (scheduleEntry.status === 'pending') {
      if (getLatestStaleScheduleOccurrenceDateTime(medEntry, scheduleEntry, currentTime)) {
        return 'missed';
      }

      if (getLatestScheduleOccurrenceDateTime(medEntry, scheduleEntry, currentTime)) {
        return 'pending';
      }
    }

    return 'upcoming';
  }

  if (scheduleEntry.status === 'taken') {
    return isIntervalScheduleEntry(scheduleEntry) && !isScheduleDateTimeInCurrentInterval(scheduleEntry, scheduleEntry.takenAt, currentTime)
      ? 'pending'
      : 'taken';
  }

  if (scheduleEntry.status === 'skipped') {
    return isIntervalScheduleEntry(scheduleEntry) && !isScheduleDateTimeInCurrentInterval(scheduleEntry, scheduleEntry.skippedAt, currentTime)
      ? 'pending'
      : 'skipped';
  }

  const currentDay = new Date(currentTime.getTime());
  currentDay.setHours(0, 0, 0, 0);
  const currentMinutes = toMinutes(normalizeTime(currentTime, 'currTime'));
  const scheduleMinutes = toMinutes(scheduleEffectiveTime(scheduleEntry));
  if (isBeforeCurrentDay(currDate, currentDay)) {
    if (
      isDailyScheduleEntry(scheduleEntry) &&
      currentMinutes !== null &&
      scheduleMinutes !== null &&
      currentMinutes < scheduleMinutes
    ) {
      return 'pending';
    }

    return 'missed';
  }

  if (isIntervalScheduleEntry(scheduleEntry)) {
    const occurrenceDateTime = getIntervalOccurrenceDateTime(scheduleEntry, currentTime);
    if (!occurrenceDateTime) {
      return 'upcoming';
    }

    const dueTime = occurrenceDateTime.getTime();
    const currentTimeMs = currentTime.getTime();
    if (currentTimeMs >= dueTime + DUE_NOW_GRACE_MINUTES * 60000) {
      return 'pending';
    }

    return currentTimeMs >= dueTime ? 'due' : 'upcoming';
  }

  if (currentMinutes === null || scheduleMinutes === null) {
    return 'upcoming';
  }

  if (scheduleEntry.status === 'pending' && getLatestStaleScheduleOccurrenceDateTime(medEntry, scheduleEntry, currentTime)) {
    return 'missed';
  }

  const laterScheduledMinutes = medEntry.dailySched
    .filter((entry) => isScheduleActiveOnDate(entry, currDate))
    .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
    .filter((minutes) => minutes !== null && minutes > scheduleMinutes)
    .sort((firstMinute, secondMinute) => firstMinute - secondMinute);

  if (laterScheduledMinutes.length && currentMinutes >= laterScheduledMinutes[0]) {
    return 'missed';
  }

  if (currentMinutes >= scheduleMinutes + DUE_NOW_GRACE_MINUTES) {
    return 'pending';
  }

  return currentMinutes >= scheduleMinutes ? 'due' : 'upcoming';
};

export const getScheduleMissedDateTime = (medEntry, scheduleIndex, currTime = new Date()) => {
  ensureScheduleIndex(medEntry.dailySched, scheduleIndex);
  if (isAsNeededScheduleEntry(medEntry.dailySched[scheduleIndex])) {
    return currTime instanceof Date ? currTime : new Date();
  }
  const currentDateTime = normalizeDate(currTime, 'currTime') ?? new Date();
  const scheduleMinutes = toMinutes(scheduleEffectiveTime(medEntry.dailySched[scheduleIndex]));
  if (isIntervalScheduleEntry(medEntry.dailySched[scheduleIndex])) {
    return getIntervalNextOccurrenceDateTime(medEntry.dailySched[scheduleIndex], currentDateTime) || currentDateTime;
  }

  if (scheduleMinutes === null) {
    return currentDateTime;
  }

  const laterScheduledMinutes = medEntry.dailySched
    .filter((entry) => isScheduleActiveOnDate(entry, currentDateTime))
    .map((entry) => toMinutes(scheduleEffectiveTime(entry)))
    .filter((minutes) => minutes !== null && minutes > scheduleMinutes)
    .sort((firstMinute, secondMinute) => firstMinute - secondMinute);

  if (laterScheduledMinutes.length) {
    return dateTimeAtMinutes(currentDateTime, laterScheduledMinutes[0]);
  }

  const nextDay = new Date(currentDateTime.getTime());
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return nextDay;
};

export const isScheduleActionAvailable = (medEntry, scheduleIndex, currTime = new Date(), currDate = new Date(), syncTakenStatus) => {
  resetDailyScheduleStatusesIfNeeded(medEntry, currTime instanceof Date ? currTime : currDate, syncTakenStatus);
  ensureScheduleIndex(medEntry.dailySched, scheduleIndex);

  if (!isActiveOnDate(medEntry, currDate)) {
    return false;
  }

  if (isAsNeededScheduleEntry(medEntry.dailySched[scheduleIndex])) {
    return true;
  }

  if (!isIntervalScheduleEntry(medEntry.dailySched[scheduleIndex]) && !isScheduleActiveOnDate(medEntry.dailySched[scheduleIndex], currDate)) {
    return false;
  }

  const currentTime = currTime instanceof Date ? currTime : currTime || currDate;
  const currentMinutes = toMinutes(normalizeTime(currentTime, 'currTime'));
  if (isIntervalScheduleEntry(medEntry.dailySched[scheduleIndex])) {
    const status = getScheduleStatus(medEntry, scheduleIndex, currTime, currDate, syncTakenStatus);
    return status === 'due' || status === 'pending' || status === 'missed';
  }

  const scheduleMinutes = toMinutes(scheduleEffectiveTime(medEntry.dailySched[scheduleIndex]));
  if (currentMinutes === null || scheduleMinutes === null || currentMinutes < scheduleMinutes) {
    return false;
  }

  return true;
};

export const hasScheduleStatus = (medEntry, targetStatuses, currTime, currDate = new Date(), syncTakenStatus) => {
  if (!isActiveOnDate(medEntry, currDate) || !medEntry.dailySched.length) {
    return false;
  }

  const statuses = Array.isArray(targetStatuses) ? targetStatuses : [targetStatuses];
  return medEntry.dailySched.some((entry, index) =>
    statuses.includes(getScheduleStatus(medEntry, index, currTime, currDate, syncTakenStatus))
  );
};
