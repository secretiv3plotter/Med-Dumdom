import {
  ensureDateRange,
  ensureScheduleIndex,
  normalizeDate,
  normalizeInteger,
  normalizeOptionalDate,
  normalizeOptionalDateTime,
  normalizeOptionalString,
  normalizeRequiredString,
  normalizeSchedule,
  normalizeTime,
  normalizeTimesTaken,
  sumDoseSizes,
  toMinutes,
  isIntervalScheduleEntry,
  getIntervalMinutes,
  isScheduleDateTimeInCurrentInterval,
} from './medEntryModelUtils';
import {
  getScheduleMissedDateTime,
  getScheduleStatus,
  hasScheduleStatus,
  isActiveOnDate,
  isScheduleActionAvailable,
  resetDailyScheduleStatusesIfNeeded,
} from './medEntryStatusUtils';

export default class MedEntry {
  constructor({
    medEntryId = '',
    medName,
    unitStrength,
    dosage,
    unit,
    quantityUnit,
    totalDailyAmount,
    amount,
    dailySched,
    startDate,
    endDate = null,
    instructions = '',
    prescriberContact = '',
    prescriber_contact = '',
    isTaken = false,
    timeTaken = null,
    dateTaken = null,
    timesTaken = [],
    createdAt = null,
    updatedAt = null,
    totalPrescribedDoses = null,
  } = {}) {
    this.medEntryId = medEntryId === undefined || medEntryId === null ? '' : String(medEntryId).trim();
    this.medName = normalizeRequiredString(medName, 'medName');
    this.unitStrength = normalizeOptionalString(unitStrength ?? dosage, 'unitStrength');
    this.dosage = this.unitStrength;
    this.unit = normalizeRequiredString(unit ?? quantityUnit, 'unit');
    this.quantityUnit = this.unit;
    this.totalDailyAmount = normalizeInteger(totalDailyAmount ?? amount, 'totalDailyAmount', {
      allowZero: false,
    });
    this.amount = this.totalDailyAmount;
    this.dailySched = normalizeSchedule(dailySched);
    if (sumDoseSizes(this.dailySched) !== this.totalDailyAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }
    this.startDate = normalizeDate(startDate, 'startDate');
    this.endDate = normalizeOptionalDate(endDate, 'endDate');
    if (!this.startDate) {
      throw new RangeError('startDate is required.');
    }
    ensureDateRange(this.startDate, this.endDate);
    this.instructions = normalizeOptionalString(instructions, 'instructions');
    this.prescriberContact = normalizeOptionalString(prescriberContact || prescriber_contact, 'prescriberContact');
    this.isTaken = typeof isTaken === 'boolean' ? isTaken : (() => {
      throw new TypeError('isTaken must be a boolean.');
    })();
    this.timeTaken = normalizeTime(timeTaken, 'timeTaken') || null;
    this.dateTaken = normalizeOptionalDate(dateTaken, 'dateTaken');
    this.timesTaken = normalizeTimesTaken(timesTaken);
    this.createdAt = normalizeOptionalDate(createdAt, 'createdAt');
    this.updatedAt = normalizeOptionalDate(updatedAt, 'updatedAt');
    this.totalPrescribedDoses = null;

    if (this.isTaken) {
      if (!this.timeTaken || !this.dateTaken) {
        throw new RangeError('timeTaken and dateTaken are required when isTaken is true.');
      }
    } else if (this.timeTaken || this.dateTaken) {
      throw new RangeError('timeTaken and dateTaken must be null when isTaken is false.');
    }

    const hasScheduleStatus = this.dailySched.some((entry) => entry.status !== 'pending');
    if (this.isTaken && !hasScheduleStatus) {
      const takenDateTime = new Date(this.dateTaken.getTime());
      const takenMinutes = toMinutes(this.timeTaken);
      if (takenMinutes !== null) {
        takenDateTime.setHours(Math.floor(takenMinutes / 60), takenMinutes % 60, 0, 0);
      }

      this.dailySched = this.dailySched.map((entry) => ({
        ...entry,
        status: 'taken',
        takenAt: takenDateTime.toISOString(),
        skippedAt: null,
      }));
    } else if (hasScheduleStatus) {
      this.syncTakenStatusFromSchedule();
    }
  }

  updateMedName(newMedName) {
    this.medName = normalizeRequiredString(newMedName, 'medName');
    return this.medName;
  }

  updateUnitStrength(newUnitStrength) {
    this.unitStrength = normalizeOptionalString(newUnitStrength, 'unitStrength');
    this.dosage = this.unitStrength;
    return this.unitStrength;
  }

  updateDosage(newDosage) {
    return this.updateUnitStrength(newDosage);
  }

  updateUnit(newUnit) {
    this.unit = normalizeRequiredString(newUnit, 'unit');
    this.quantityUnit = this.unit;
    return this.unit;
  }

  updateTotalDailyAmount(newTotalDailyAmount) {
    const nextAmount = normalizeInteger(newTotalDailyAmount, 'totalDailyAmount', {
      allowZero: false,
    });

    const currentScheduleTotal = sumDoseSizes(this.dailySched);
    if (currentScheduleTotal !== nextAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.totalDailyAmount = nextAmount;
    this.amount = this.totalDailyAmount;
    return this.totalDailyAmount;
  }

  updateAmount(newAmount) {
    return this.updateTotalDailyAmount(newAmount);
  }

  updateTotalDailyAmountAndDailySched(newTotalDailyAmount, newDailySched) {
    const nextAmount = normalizeInteger(newTotalDailyAmount, 'totalDailyAmount', {
      allowZero: false,
    });
    const nextSchedule = normalizeSchedule(newDailySched);

    if (sumDoseSizes(nextSchedule) !== nextAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.totalDailyAmount = nextAmount;
    this.amount = this.totalDailyAmount;
    this.dailySched = nextSchedule;
    this.syncTakenStatusFromSchedule();
    return this;
  }

  updateDailySched(newDailySched) {
    const nextSchedule = normalizeSchedule(newDailySched);
    if (sumDoseSizes(nextSchedule) !== this.totalDailyAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.dailySched = nextSchedule;
    this.syncTakenStatusFromSchedule();
    return [...this.dailySched];
  }

  updateStartDate(newStartDate) {
    const nextStartDate = normalizeDate(newStartDate, 'startDate');
    if (!nextStartDate) {
      throw new RangeError('startDate is required.');
    }

    ensureDateRange(nextStartDate, this.endDate);
    this.startDate = nextStartDate;
    return this.startDate;
  }

  updateEndDate(newEndDate) {
    const nextEndDate = normalizeOptionalDate(newEndDate, 'endDate');
    ensureDateRange(this.startDate, nextEndDate);
    this.endDate = nextEndDate;
    return this.endDate;
  }

  updateInstructions(newInstructions) {
    this.instructions = normalizeOptionalString(newInstructions, 'instructions');
    return this.instructions;
  }

  updatePrescriberContact(newPrescriberContact) {
    this.prescriberContact = normalizeOptionalString(newPrescriberContact, 'prescriberContact');
    return this.prescriberContact;
  }

  markTaken(takenAt = new Date()) {
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();
    const takenTime = normalizeTime(takenDateTime, 'takenAt');

    this.dailySched = this.dailySched.map((entry) => ({
      ...entry,
      status: 'taken',
      takenAt: takenDateTime.toISOString(),
      skippedAt: null,
    }));

    if (!this.timesTaken.includes(takenTime)) {
      this.timesTaken.push(takenTime);
    }

    this.isTaken = true;
    this.timeTaken = takenTime;
    this.dateTaken = takenDateTime;

    return this;
  }

  clearTakenStatus() {
    this.dailySched = this.dailySched.map((entry) => ({
      ...entry,
      status: 'pending',
      takenAt: null,
      skippedAt: null,
    }));
    this.isTaken = false;
    this.timeTaken = null;
    this.dateTaken = null;
    this.timesTaken = [];
    return this;
  }

  syncTakenStatusFromSchedule() {
    const takenEntries = this.dailySched.filter((entry) => entry.status === 'taken');
    const allEntriesTaken = this.dailySched.length > 0 && takenEntries.length === this.dailySched.length;
    this.isTaken = allEntriesTaken;

    if (!takenEntries.length) {
      this.timeTaken = null;
      this.dateTaken = null;
      this.timesTaken = [];
      return this;
    }

    const takenAtValues = takenEntries
      .map((entry) => normalizeOptionalDateTime(entry.takenAt, 'takenAt'))
      .filter(Boolean)
      .sort();
    const latestTakenAt = takenAtValues[takenAtValues.length - 1] || null;

    this.timesTaken = takenEntries
      .map((entry) => (entry.takenAt ? normalizeTime(new Date(entry.takenAt), 'takenAt') : ''))
      .filter(Boolean);

    if (allEntriesTaken && latestTakenAt) {
      const latestDate = new Date(latestTakenAt);
      this.timeTaken = normalizeTime(latestDate, 'takenAt');
      this.dateTaken = latestDate;
    } else {
      this.timeTaken = null;
      this.dateTaken = null;
    }

    return this;
  }

  markScheduleTaken(scheduleIndex, takenAt = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();

    const currentEntry = this.dailySched[scheduleIndex];

    this.dailySched[scheduleIndex] = {
      ...currentEntry,
      status: 'taken',
      takenAt: takenDateTime.toISOString(),
      skippedAt: null,
    };

    if (isIntervalScheduleEntry(currentEntry)) {
      const hasSubsequent = this.dailySched.slice(scheduleIndex + 1).length > 0;
      if (!hasSubsequent) {
        const intervalMinutes = getIntervalMinutes(currentEntry);
        const currentActivatedAt = new Date(currentEntry.activatedAt);
        const nextActivatedAt = intervalMinutes
          ? new Date(currentActivatedAt.getTime() + intervalMinutes * 60000)
          : takenDateTime;
        
        const nextEntry = {
          ...currentEntry,
          status: 'pending',
          takenAt: null,
          skippedAt: null,
          activatedAt: nextActivatedAt.toISOString(),
        };
        this.dailySched.push(nextEntry);
      }
      this.totalDailyAmount = sumDoseSizes(this.dailySched);
      this.amount = this.totalDailyAmount;
    }

    this.syncTakenStatusFromSchedule();
    return this;
  }

  markScheduleSkipped(scheduleIndex, skippedAt = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const skippedDateTime = normalizeDate(skippedAt, 'skippedAt') ?? new Date();
    const currentStatus = this.getScheduleStatus(scheduleIndex, skippedDateTime, skippedDateTime);
    const missedDateTime =
      currentStatus === 'missed'
        ? this.getScheduleMissedDateTime(scheduleIndex, skippedDateTime)
        : null;
    const resolvedSkippedDateTime = missedDateTime || skippedDateTime;

    const currentEntry = this.dailySched[scheduleIndex];

    this.dailySched[scheduleIndex] = {
      ...currentEntry,
      status: 'skipped',
      takenAt: null,
      skippedAt: resolvedSkippedDateTime.toISOString(),
    };

    if (isIntervalScheduleEntry(currentEntry)) {
      const hasSubsequent = this.dailySched.slice(scheduleIndex + 1).length > 0;
      if (!hasSubsequent) {
        const intervalMinutes = getIntervalMinutes(currentEntry);
        const currentActivatedAt = new Date(currentEntry.activatedAt);
        const nextActivatedAt = intervalMinutes
          ? new Date(currentActivatedAt.getTime() + intervalMinutes * 60000)
          : resolvedSkippedDateTime;
        
        const nextEntry = {
          ...currentEntry,
          status: 'pending',
          takenAt: null,
          skippedAt: null,
          activatedAt: nextActivatedAt.toISOString(),
        };
        this.dailySched.push(nextEntry);
      }
      this.totalDailyAmount = sumDoseSizes(this.dailySched);
      this.amount = this.totalDailyAmount;
    }

    this.syncTakenStatusFromSchedule();
    return this;
  }

  clearScheduleStatus(scheduleIndex) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const currentEntry = this.dailySched[scheduleIndex];

    this.dailySched[scheduleIndex] = {
      ...currentEntry,
      status: 'pending',
      takenAt: null,
      skippedAt: null,
    };

    if (isIntervalScheduleEntry(currentEntry)) {
      this.dailySched = this.dailySched.slice(0, scheduleIndex + 1);
      this.totalDailyAmount = sumDoseSizes(this.dailySched);
      this.amount = this.totalDailyAmount;
    }

    this.syncTakenStatusFromSchedule();
    return this;
  }

  resetDailyScheduleStatusesIfNeeded(now = new Date()) {
    return resetDailyScheduleStatusesIfNeeded(this, now, () => this.syncTakenStatusFromSchedule());
  }

  isActiveOnDate(currDate = new Date()) {
    return isActiveOnDate(this, currDate);
  }

  getScheduleStatus(scheduleIndex, currTime = new Date(), currDate = new Date()) {
    return getScheduleStatus(this, scheduleIndex, currTime, currDate, () => this.syncTakenStatusFromSchedule());
  }

  getScheduleMissedDateTime(scheduleIndex, currTime = new Date()) {
    return getScheduleMissedDateTime(this, scheduleIndex, currTime);
  }

  isScheduleActionAvailable(scheduleIndex, currTime = new Date(), currDate = new Date()) {
    return isScheduleActionAvailable(this, scheduleIndex, currTime, currDate, () => this.syncTakenStatusFromSchedule());
  }

  canRevertSchedule(scheduleIndex, currTime = new Date()) {
    ensureScheduleIndex(this.dailySched, scheduleIndex);
    const entry = this.dailySched[scheduleIndex];
    if (!entry || (entry.status !== 'taken' && entry.status !== 'skipped')) {
      return false;
    }
    if (isIntervalScheduleEntry(entry)) {
      const actionTime = entry.takenAt || entry.skippedAt;
      return isScheduleDateTimeInCurrentInterval(entry, actionTime, currTime);
    }
    return true;
  }

  isDue(currTime, currDate = new Date()) {
    return hasScheduleStatus(this, 'due', currTime, currDate, () => this.syncTakenStatusFromSchedule());
  }

  isPending(currTime, currDate = new Date()) {
    return hasScheduleStatus(this, 'pending', currTime, currDate, () => this.syncTakenStatusFromSchedule());
  }

  isMissed(currTime, currDate = new Date()) {
    return hasScheduleStatus(this, ['missed', 'skipped'], currTime, currDate, () => this.syncTakenStatusFromSchedule());
  }
}
