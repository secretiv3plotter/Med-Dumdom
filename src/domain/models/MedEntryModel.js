const normalizeRequiredString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new RangeError(`${fieldName} cannot be empty.`);
  }

  return trimmedValue;
};

const normalizeOptionalString = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value.trim();
};

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

const normalizeOptionalDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return normalizeDate(value, fieldName);
};

const normalizeInteger = (value, fieldName, { allowZero = true, optional = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return null;
    }

    throw new RangeError(`${fieldName} is required.`);
  }

  const rawValue = typeof value === 'number' ? value : Number(String(value).trim());
  const numericValue = Number.isInteger(rawValue)
    ? rawValue
    : (() => {
        const matchedNumber = String(value).match(/-?\d+/);
        return matchedNumber ? Number(matchedNumber[0]) : Number.NaN;
      })();
  if (!Number.isInteger(numericValue)) {
    throw new RangeError(`${fieldName} must be an integer.`);
  }

  if (numericValue < 0 || (!allowZero && numericValue === 0)) {
    throw new RangeError(`${fieldName} must be ${allowZero ? 'a non-negative integer' : 'a positive integer'}.`);
  }

  return numericValue;
};

const normalizeTime = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} must be a string or Date.`);
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      throw new RangeError(`${fieldName} must be a valid time.`);
    }

    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    throw new RangeError(`${fieldName} must be a valid time.`);
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const normalizeRequiredTime = (value, fieldName) => {
  const normalizedTime = normalizeTime(value, fieldName);
  if (!normalizedTime) {
    throw new RangeError(`${fieldName} is required.`);
  }

  return normalizedTime;
};

const normalizeMealContext = (value) => {
  const normalized = normalizeRequiredString(value, 'mealContext').toLowerCase();
  if (!['before', 'during', 'after'].includes(normalized)) {
    throw new RangeError('mealContext must be before, during, or after.');
  }

  return normalized;
};

const normalizeAssociatedMeal = (value) => {
  const normalized = normalizeRequiredString(value, 'associatedMeal').toLowerCase();
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(normalized)) {
    throw new RangeError('associatedMeal must be breakfast, lunch, dinner, or snack.');
  }

  return normalized;
};

const scheduleEffectiveTime = (entry) => entry.scheduledTime || entry.mealTime || '';

const normalizeScheduleEntry = (entry, index) => {
  if (typeof entry === 'string' || entry instanceof Date) {
    return {
      scheduleType: 'time',
      doseSize: 1,
      scheduledTime: normalizeRequiredTime(entry, `dailySched[${index}].scheduledTime`),
      instructions: '',
    };
  }

  if (!entry || typeof entry !== 'object') {
    throw new TypeError(`dailySched[${index}] must be an object, string, or Date.`);
  }

  const normalizedType = normalizeOptionalString(entry.scheduleType ?? entry.type ?? entry.mode, `dailySched[${index}].scheduleType`).toLowerCase();
  const isMealBased =
    normalizedType === 'meal' ||
    normalizedType === 'meal-based' ||
    entry.mealContext !== undefined ||
    entry.associatedMeal !== undefined ||
    entry.mealTime !== undefined;

  const doseSize = normalizeInteger(entry.doseSize ?? entry.amount ?? 1, `dailySched[${index}].doseSize`, {
    allowZero: false,
  });
  const instructions = normalizeOptionalString(entry.instructions, `dailySched[${index}].instructions`);

  if (isMealBased) {
    return {
      scheduleType: 'meal',
      doseSize,
      mealContext: normalizeMealContext(entry.mealContext),
      associatedMeal: normalizeAssociatedMeal(entry.associatedMeal),
      mealTime: normalizeRequiredTime(entry.mealTime ?? entry.scheduledTime, `dailySched[${index}].mealTime`),
      instructions,
    };
  }

  return {
    scheduleType: 'time',
    doseSize,
    scheduledTime: normalizeRequiredTime(
      entry.scheduledTime ?? entry.time ?? entry.mealTime,
      `dailySched[${index}].scheduledTime`
    ),
    instructions,
  };
};

const normalizeSchedule = (dailySched) => {
  if (dailySched === undefined || dailySched === null || dailySched === '') {
    throw new RangeError('dailySched cannot be empty.');
  }

  const scheduleItems = Array.isArray(dailySched)
    ? dailySched
    : typeof dailySched === 'string'
      ? dailySched.split(',').map((item) => item.trim()).filter(Boolean)
      : dailySched instanceof Date
        ? [dailySched]
        : (() => {
            throw new TypeError('dailySched must be a string, Date, or array.');
          })();

  const normalizedSchedule = scheduleItems.map((item, index) => normalizeScheduleEntry(item, index));
  if (!normalizedSchedule.length) {
    throw new RangeError('dailySched cannot be empty.');
  }

  return normalizedSchedule;
};

const sumDoseSizes = (dailySched) =>
  dailySched.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

const ensureDateRange = (startDate, endDate) => {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new RangeError('endDate must be the same as or later than startDate.');
  }
};

const normalizeTimesTaken = (timesTaken) => {
  if (!Array.isArray(timesTaken)) {
    throw new TypeError('timesTaken must be an array.');
  }

  return timesTaken.map((time, index) => normalizeTime(time, `timesTaken[${index}]`));
};

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
    inventoryCount = null,
    inventory_count = null,
    prescriberContact = '',
    prescriber_contact = '',
    isTaken = false,
    timeTaken = null,
    dateTaken = null,
    timesTaken = [],
  } = {}) {
    this.medEntryId = medEntryId === undefined || medEntryId === null ? '' : String(medEntryId).trim();
    this.medName = normalizeRequiredString(medName, 'medName');
    this.unitStrength = normalizeRequiredString(unitStrength ?? dosage, 'unitStrength');
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
    this.inventoryCount = normalizeInteger(inventoryCount ?? inventory_count, 'inventoryCount', {
      optional: true,
    });
    this.prescriberContact = normalizeOptionalString(prescriberContact || prescriber_contact, 'prescriberContact');
    this.isTaken = typeof isTaken === 'boolean' ? isTaken : (() => {
      throw new TypeError('isTaken must be a boolean.');
    })();
    this.timeTaken = normalizeTime(timeTaken, 'timeTaken') || null;
    this.dateTaken = normalizeOptionalDate(dateTaken, 'dateTaken');
    this.timesTaken = normalizeTimesTaken(timesTaken);

    if (this.isTaken) {
      if (!this.timeTaken || !this.dateTaken) {
        throw new RangeError('timeTaken and dateTaken are required when isTaken is true.');
      }
    } else if (this.timeTaken || this.dateTaken) {
      throw new RangeError('timeTaken and dateTaken must be null when isTaken is false.');
    }
  }

  updateMedName(newMedName) {
    this.medName = normalizeRequiredString(newMedName, 'medName');
    return this.medName;
  }

  updateUnitStrength(newUnitStrength) {
    this.unitStrength = normalizeRequiredString(newUnitStrength, 'unitStrength');
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

  updateDailySched(newDailySched) {
    const nextSchedule = normalizeSchedule(newDailySched);
    if (sumDoseSizes(nextSchedule) !== this.totalDailyAmount) {
      throw new RangeError('totalDailyAmount must match the sum of dailySched doseSize values.');
    }

    this.dailySched = nextSchedule;
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

  updateInventoryCount(newInventoryCount) {
    this.inventoryCount = normalizeInteger(newInventoryCount, 'inventoryCount', { optional: true });
    return this.inventoryCount;
  }

  updatePrescriberContact(newPrescriberContact) {
    this.prescriberContact = normalizeOptionalString(newPrescriberContact, 'prescriberContact');
    return this.prescriberContact;
  }

  markTaken(takenAt = new Date()) {
    const takenDateTime = normalizeDate(takenAt, 'takenAt') ?? new Date();
    const takenTime = normalizeTime(takenDateTime, 'takenAt');

    if (!this.timesTaken.includes(takenTime)) {
      this.timesTaken.push(takenTime);
    }

    this.isTaken = true;
    this.timeTaken = takenTime;
    this.dateTaken = takenDateTime;

    return this;
  }

  clearTakenStatus() {
    this.isTaken = false;
    this.timeTaken = null;
    this.dateTaken = null;
    this.timesTaken = [];
    return this;
  }

  isActiveOnDate(currDate = new Date()) {
    const currentDay = normalizeOptionalDate(currDate, 'currDate');

    if (!currentDay) {
      return false;
    }

    const startDay = normalizeOptionalDate(this.startDate, 'startDate');
    const endDay = normalizeOptionalDate(this.endDate, 'endDate');

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
  }

  isDue(currTime, currDate = new Date()) {
    if (this.isTaken || !this.isActiveOnDate(currDate) || !this.dailySched.length) {
      return false;
    }

    const currentTime = currTime instanceof Date ? currTime : currTime || currDate;
    const currentMinutes = normalizeTime(currentTime, 'currTime');
    if (!currentMinutes) {
      return false;
    }

    const nowMinutes = (() => {
      const match = currentMinutes.match(/^(\d{2}):(\d{2})$/);
      if (!match) {
        return null;
      }

      return Number(match[1]) * 60 + Number(match[2]);
    })();

    if (nowMinutes === null) {
      return false;
    }

    const dueDoseCount = this.dailySched.reduce((count, entry) => {
      const scheduleMinutes = (() => {
        const effectiveTime = scheduleEffectiveTime(entry);
        const match = effectiveTime.match(/^(\d{2}):(\d{2})$/);
        if (!match) {
          return null;
        }

        return Number(match[1]) * 60 + Number(match[2]);
      })();

      return scheduleMinutes !== null && scheduleMinutes <= nowMinutes ? count + Number(entry.doseSize || 0) : count;
    }, 0);

    return dueDoseCount > 0;
  }
}
