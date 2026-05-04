export const normalizeEntityId = (value, fieldName) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new RangeError(`${fieldName} cannot be empty.`);
    }

    return trimmedValue;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new TypeError(`${fieldName} must be a non-empty string or a finite number.`);
};

export const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

export const normalizeRange = (range, { emptyPreset } = {}) => {
  if (!range) {
    const emptyRange = { startDate: null, endDate: null };
    if (emptyPreset !== undefined) {
      emptyRange.preset = emptyPreset;
    }
    return emptyRange;
  }

  if (typeof range === 'string') {
    return { startDate: null, endDate: null, preset: range.trim().toLowerCase() };
  }

  if (typeof range !== 'object') {
    throw new TypeError('range must be an object, string, or null.');
  }

  return {
    startDate: normalizeDate(range.startDate ?? range.from ?? null, 'startDate'),
    endDate: normalizeDate(range.endDate ?? range.to ?? null, 'endDate'),
    preset: typeof range.preset === 'string' ? range.preset.trim().toLowerCase() : '',
  };
};

export const isSameDay = (firstDate, secondDate) => {
  if (!(firstDate instanceof Date)) {
    return false;
  }

  if (!(secondDate instanceof Date)) {
    return false;
  }

  return firstDate.toISOString().slice(0, 10) === secondDate.toISOString().slice(0, 10);
};
