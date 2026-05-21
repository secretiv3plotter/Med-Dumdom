import { useMemo, useState, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { accessibility, colors, radius, spacing, typography } from '../../theme';

const pad2 = (value) => String(value).padStart(2, '0');
const SCROLL_ITEM_HEIGHT = 38;
const CIRCULAR_LOOP_COUNT = 3;
const CIRCULAR_MIDDLE_LOOP = 1;

export const formatPickerDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const formatPickerTime = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const parseDateValue = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const parts = text.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseTimeValue = (value) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    hours = meridiem === 'AM'
      ? hours === 12 ? 0 : hours
      : hours === 12 ? 12 : hours + 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const parseDurationValue = (value) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthIndex = (monthValue) => MONTHS.indexOf(String(monthValue || '').trim());

const getDaysForMonth = (monthValue) => {
  const monthIndex = getMonthIndex(monthValue);
  if (monthIndex === -1) {
    return 31;
  }
  const resolvedMonth = monthIndex;
  return new Date(new Date().getFullYear(), resolvedMonth + 1, 0).getDate();
};

const resolveListInput = (input, options) => {
  const normalizedInput = String(input || '').trim().toLowerCase();
  if (!normalizedInput) {
    return '';
  }

  const exactMatch = options.find((option) => option.toLowerCase() === normalizedInput);
  if (exactMatch) {
    return exactMatch;
  }

  const prefixMatches = options.filter((option) => option.toLowerCase().startsWith(normalizedInput));
  return prefixMatches.length === 1 ? prefixMatches[0] : '';
};

const resolveMonthInput = (input) => {
  const text = String(input || '').trim();
  if (!text) {
    return -1;
  }

  const numericMonth = Number(text);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return numericMonth - 1;
  }

  const matchedMonth = resolveListInput(text, MONTHS);
  return matchedMonth ? MONTHS.indexOf(matchedMonth) : -1;
};

const circularItems = (items) =>
  Array.from({ length: CIRCULAR_LOOP_COUNT }).flatMap((_, loopIndex) =>
    items.map((item, index) => ({ item, index, loopIndex }))
  );

const circularScrollOffset = (index, itemCount) =>
  (itemCount * CIRCULAR_MIDDLE_LOOP + index) * SCROLL_ITEM_HEIGHT;

const scrollToCircularIndex = (ref, index, itemCount) => {
  if (!ref?.current || !itemCount) {
    return;
  }

  ref.current.scrollTo({ y: circularScrollOffset(index, itemCount), animated: false });
};

const wrapCircularScroll = (event, ref, itemCount) => {
  if (!ref?.current || !itemCount) {
    return;
  }

  const rawIndex = Math.round((event?.nativeEvent?.contentOffset?.y || 0) / SCROLL_ITEM_HEIGHT);
  if (rawIndex >= itemCount && rawIndex < itemCount * 2) {
    return;
  }

  const normalizedIndex = ((rawIndex % itemCount) + itemCount) % itemCount;
  scrollToCircularIndex(ref, normalizedIndex, itemCount);
};

const parseValue = (value, mode) => {
  if (mode === 'day') {
    return DAYS_OF_WEEK.includes(value) ? value : '';
  }
  if (mode === 'month') {
    return MONTHS.includes(value) ? value : '';
  }
  if (mode === 'monthDay') {
    const day = Number(String(value || '').trim());
    return Number.isInteger(day) && day >= 1 && day <= 31 ? day : '';
  }
  if (mode === 'duration') {
    return parseDurationValue(value);
  }
  return (mode === 'time' ? parseTimeValue(value) : parseDateValue(value));
};

const formatDisplayValue = (value, mode) => {
  if (mode === 'day') {
    return value || '';
  }
  if (mode === 'month') {
    return value || '';
  }
  if (mode === 'monthDay') {
    const day = parseValue(value, mode);
    return day ? `Day ${day}` : '';
  }
  if (mode === 'duration') {
    const parsed = parseValue(value, mode);
    if (!parsed) {
      return '';
    }
    const hText = `${parsed.hours} hour${parsed.hours === 1 ? '' : 's'}`;
    const mText = `${pad2(parsed.minutes)} min${parsed.minutes === 1 ? '' : 's'}`;
    return `${hText} ${mText}`;
  }
  const parsed = parseValue(value, mode);
  if (!parsed) {
    return '';
  }

  if (mode === 'time') {
    return parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function NativeDateTimeField({
  label,
  placeholder,
  value = '',
  onChange = () => {},
  mode = 'date',
  optional = false,
  accessibilityLabel,
  minimumDate,
  maximumDate,
  monthValue = '',
  focusBorderColor,
  focusBackgroundColor,
  focusTextColor,
  pickerDefaultValue = '',
}) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const usesCustomPicker = Platform.OS === 'web' || mode === 'day' || mode === 'month' || mode === 'monthDay' || mode === 'duration';
  const selectedDate = useMemo(() => {
    const parsedValue = parseValue(value, mode) ?? parseValue(pickerDefaultValue, mode) ?? new Date();
    if (mode !== 'date' || !(minimumDate instanceof Date) || parsedValue >= minimumDate) {
      return parsedValue;
    }
    return minimumDate;
  }, [minimumDate, mode, pickerDefaultValue, value]);

  const displayValue = formatDisplayValue(value, mode);
  const resolvedPlaceholder = placeholder || (mode === 'day' ? 'Select day' : (mode === 'month' ? 'Select month' : (mode === 'monthDay' ? 'Select day' : (mode === 'duration' ? 'Select time period' : (mode === 'time' ? 'Select time' : 'Select date')))));
  const resolvedLabel = accessibilityLabel || label || resolvedPlaceholder;
  const pickerAccent = focusBorderColor || colors.brand;
  const pickerAccentSoft = focusBackgroundColor || colors.brandSoft;
  const pickerAccentText = focusTextColor || colors.brandText;
  const pickerActiveItemStyle = {
    backgroundColor: pickerAccentSoft,
    borderBottomColor: pickerAccentSoft,
  };
  const pickerActiveTextStyle = {
    color: pickerAccentText,
  };
  const pickerConfirmButtonStyle = {
    borderColor: pickerAccent,
    backgroundColor: pickerAccent,
  };

  // States for Custom Web Scroller Picker Wheel
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [tempDayOfWeek, setTempDayOfWeek] = useState(DAYS_OF_WEEK[new Date().getDay()]);
  const [tempDayOfMonth, setTempDayOfMonth] = useState(Math.min(new Date().getDate(), getDaysForMonth(monthValue)));

  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState('AM');
  const [typedPickerValue, setTypedPickerValue] = useState('');
  const [typedPickerError, setTypedPickerError] = useState('');
  const [typedDateMonth, setTypedDateMonth] = useState('');
  const [typedDateDay, setTypedDateDay] = useState('');
  const [typedDateYear, setTypedDateYear] = useState('');
  const [typedTimeHour, setTypedTimeHour] = useState('');
  const [typedTimeMinute, setTypedTimeMinute] = useState('');
  const [typedTimePeriod, setTypedTimePeriod] = useState('');

  // Refs for custom scrolling column lists
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  const yearScrollRef = useRef(null);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const ampmScrollRef = useRef(null);

  // Sync temp picker states when opening the picker
  useEffect(() => {
    if (isPickerVisible && usesCustomPicker) {
      if (mode === 'day') {
        const nextDay = value || DAYS_OF_WEEK[new Date().getDay()];
        setTempDayOfWeek(nextDay);
        setTypedPickerValue(nextDay);
      } else if (mode === 'month') {
        const monthIndex = MONTHS.indexOf(value);
        const resolvedMonth = monthIndex === -1 ? new Date().getMonth() : monthIndex;
        setTempMonth(resolvedMonth);
        setTypedPickerValue(MONTHS[resolvedMonth]);
      } else if (mode === 'monthDay') {
        const maxDay = getDaysForMonth(monthValue);
        const selectedDay = parseValue(value, mode) || Math.min(new Date().getDate(), maxDay);
        const resolvedDay = Math.min(selectedDay, maxDay);
        setTempDayOfMonth(resolvedDay);
        setTypedPickerValue(String(resolvedDay));
      } else if (mode === 'duration') {
        const currentVal = parseDurationValue(value) || { hours: 0, minutes: 1 };
        setTempHour(currentVal.hours);
        setTempMinute(currentVal.minutes);
        setTypedPickerValue(`${pad2(currentVal.hours)}:${pad2(currentVal.minutes)}`);
        setTypedTimeHour(pad2(currentVal.hours));
        setTypedTimeMinute(pad2(currentVal.minutes));
      } else if (Platform.OS === 'web') {
        const currentVal = parseValue(value, mode) ?? parseValue(pickerDefaultValue, mode) ?? new Date();
        if (mode === 'date') {
          setTempYear(currentVal.getFullYear());
          setTempMonth(currentVal.getMonth());
          setTempDay(currentVal.getDate());
          setTypedPickerValue(formatPickerDate(currentVal));
          setTypedDateMonth(MONTHS[currentVal.getMonth()]);
          setTypedDateDay(String(currentVal.getDate()));
          setTypedDateYear(String(currentVal.getFullYear()));
        } else {
          const rawHours = currentVal.getHours();
          const displayHours = rawHours % 12 || 12;
          const ampm = rawHours >= 12 ? 'PM' : 'AM';
          setTempHour(displayHours);
          setTempMinute(currentVal.getMinutes());
          setTempAmPm(ampm);
          setTypedPickerValue(formatPickerTime(currentVal));
          setTypedTimeHour(String(displayHours));
          setTypedTimeMinute(pad2(currentVal.getMinutes()));
          setTypedTimePeriod(ampm);
        }
      }
      setTypedPickerError('');
    }
  }, [isPickerVisible, value, mode, monthValue, pickerDefaultValue, usesCustomPicker]);

  const commitValue = (date) => {
    onChange(mode === 'time' ? formatPickerTime(date) : formatPickerDate(date));
  };

  const handlePickerChange = (event, date) => {
    setPickerVisible(false);
    if (event?.type === 'dismissed') {
      return;
    }
    if (date) {
      commitValue(date);
    }
  };

  const handleTypedPickerChange = (input) => {
    setTypedPickerValue(input);
    const trimmedInput = String(input || '').trim();
    if (!trimmedInput) {
      setTypedPickerError('');
      return;
    }

    if (mode === 'day') {
      const matchedDay = resolveListInput(trimmedInput, DAYS_OF_WEEK);
      if (!matchedDay) {
        setTypedPickerError('Enter a valid day.');
        return;
      }
      setTempDayOfWeek(matchedDay);
      setTypedPickerError('');
      return;
    }

    if (mode === 'month') {
      const matchedMonth = resolveListInput(trimmedInput, MONTHS);
      if (!matchedMonth) {
        setTypedPickerError('Enter a valid month.');
        return;
      }
      setTempMonth(MONTHS.indexOf(matchedMonth));
      setTypedPickerError('');
      return;
    }

    if (mode === 'monthDay') {
      const day = Number(trimmedInput);
      const maxDay = getDaysForMonth(monthValue);
      if (!Number.isInteger(day) || day < 1 || day > maxDay) {
        setTypedPickerError(`Enter a day from 1 to ${maxDay}.`);
        return;
      }
      setTempDayOfMonth(day);
      setTypedPickerError('');
      return;
    }

    if (mode === 'date') {
      const parsedDate = parseDateValue(trimmedInput);
      if (!parsedDate) {
        setTypedPickerError('Enter a valid date.');
        return;
      }
      if (minimumDate instanceof Date) {
        const minCompare = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
        const dateCompare = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
        if (dateCompare < minCompare) {
          setTypedPickerError('Enter a date in the allowed range.');
          return;
        }
      }
      setTempYear(parsedDate.getFullYear());
      setTempMonth(parsedDate.getMonth());
      setTempDay(parsedDate.getDate());
      setTypedPickerError('');
      return;
    }

    const parsedTime = parseTimeValue(trimmedInput);
    if (!parsedTime) {
      setTypedPickerError('Enter a valid time.');
      return;
    }
    const rawHours = parsedTime.getHours();
    setTempHour(rawHours % 12 || 12);
    setTempMinute(parsedTime.getMinutes());
    setTempAmPm(rawHours >= 12 ? 'PM' : 'AM');
    setTypedPickerError('');
  };

  const handleTypedDatePartChange = (part, input) => {
    const nextMonth = part === 'month' ? input : typedDateMonth;
    const nextDay = part === 'day' ? input : typedDateDay;
    const nextYear = part === 'year' ? input : typedDateYear;

    if (part === 'month') {
      setTypedDateMonth(input);
    }
    if (part === 'day') {
      setTypedDateDay(input.replace(/[^0-9]/g, ''));
    }
    if (part === 'year') {
      setTypedDateYear(input.replace(/[^0-9]/g, ''));
    }

    const sanitizedDay = part === 'day' ? input.replace(/[^0-9]/g, '') : nextDay;
    const sanitizedYear = part === 'year' ? input.replace(/[^0-9]/g, '') : nextYear;
    const monthIndex = resolveMonthInput(nextMonth);
    const day = Number(sanitizedDay);
    const year = Number(sanitizedYear);

    if (!String(nextMonth || '').trim() || !String(sanitizedDay || '').trim() || !String(sanitizedYear || '').trim()) {
      setTypedPickerError('Complete month, day, and year.');
      return;
    }

    if (monthIndex === -1) {
      setTypedPickerError('Enter a valid month.');
      return;
    }

    if (!Number.isInteger(year) || String(sanitizedYear).length < 4) {
      setTypedPickerError('Enter a valid year.');
      return;
    }

    const maxDay = new Date(year, monthIndex + 1, 0).getDate();
    if (!Number.isInteger(day) || day < 1 || day > maxDay) {
      setTypedPickerError(`Enter a day from 1 to ${maxDay}.`);
      return;
    }

    const parsedDate = new Date(year, monthIndex, day);
    if (minimumDate instanceof Date) {
      const minCompare = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
      if (parsedDate < minCompare) {
        setTypedPickerError('Enter a date in the allowed range.');
        return;
      }
    }

    setTempYear(year);
    setTempMonth(monthIndex);
    setTempDay(day);
    setTypedPickerValue(formatPickerDate(parsedDate));
    setTypedPickerError('');
  };

  const handleTypedTimePartChange = (part, input) => {
    const sanitizedHour = part === 'hour' ? input.replace(/[^0-9]/g, '') : typedTimeHour;
    const sanitizedMinute = part === 'minute' ? input.replace(/[^0-9]/g, '') : typedTimeMinute;
    const nextPeriod = part === 'period' ? input.toUpperCase().replace(/[^APM]/g, '') : typedTimePeriod;

    if (part === 'hour') {
      setTypedTimeHour(sanitizedHour);
    }
    if (part === 'minute') {
      setTypedTimeMinute(sanitizedMinute);
    }
    if (part === 'period') {
      setTypedTimePeriod(nextPeriod);
    }

    if (mode === 'duration') {
      if (!sanitizedHour || !sanitizedMinute) {
        setTypedPickerError('Complete hour and minute.');
        return;
      }

      const hour = Number(sanitizedHour);
      const minute = Number(sanitizedMinute);

      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        setTypedPickerError('Enter an hour from 0 to 23.');
        return;
      }

      if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        setTypedPickerError('Enter minutes from 0 to 59.');
        return;
      }

      setTempHour(hour);
      setTempMinute(minute);
      setTypedPickerValue(`${pad2(hour)}:${pad2(minute)}`);
      setTypedPickerError('');
      return;
    }

    if (!sanitizedHour || !sanitizedMinute || !nextPeriod) {
      setTypedPickerError('Complete hour, minute, and period.');
      return;
    }

    const hour = Number(sanitizedHour);
    const minute = Number(sanitizedMinute);
    const normalizedPeriod = resolveListInput(nextPeriod, ['AM', 'PM']);

    if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
      setTypedPickerError('Enter an hour from 1 to 12.');
      return;
    }

    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      setTypedPickerError('Enter minutes from 0 to 59.');
      return;
    }

    if (!normalizedPeriod) {
      setTypedPickerError('Enter AM or PM.');
      return;
    }

    setTempHour(hour);
    setTempMinute(minute);
    setTempAmPm(normalizedPeriod);
    setTypedPickerValue(`${hour}:${pad2(minute)} ${normalizedPeriod}`);
    setTypedPickerError('');
  };

  // Web Picker Confirm Handler with date bounds validation guard
  const handleWebConfirm = () => {
    if (typedPickerError) {
      return;
    }

    setPickerVisible(false);
    if (mode === 'day') {
      onChange(tempDayOfWeek);
    } else if (mode === 'month') {
      onChange(MONTHS[tempMonth]);
    } else if (mode === 'monthDay') {
      onChange(String(tempDayOfMonth));
    } else if (mode === 'duration') {
      onChange(`${pad2(tempHour)}:${pad2(tempMinute)}`);
    } else if (mode === 'date') {
      let finalDate = new Date(tempYear, tempMonth, tempDay);
      if (minimumDate instanceof Date) {
        const minCompare = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
        if (finalDate < minCompare) {
          finalDate = minCompare;
        }
      }
      commitValue(finalDate);
    } else {
      let finalHour = tempHour;
      if (tempAmPm === 'PM' && finalHour < 12) {
        finalHour += 12;
      }
      if (tempAmPm === 'AM' && finalHour === 12) {
        finalHour = 0;
      }
      const finalTime = new Date();
      finalTime.setHours(finalHour, tempMinute, 0, 0);
      commitValue(finalTime);
    }
  };

  // Generate Year, Day lists dynamically
  const yearsList = useMemo(() => {
    const list = [];
    const currentYear = new Date().getFullYear();
    const min = minimumDate instanceof Date ? minimumDate.getFullYear() : 1920;
    const max = maximumDate instanceof Date ? maximumDate.getFullYear() : currentYear + 20;
    for (let y = min; y <= max; y++) {
      list.push(y);
    }
    return list;
  }, [minimumDate, maximumDate]);

  const daysInMonthList = useMemo(() => {
    const daysCount = new Date(tempYear, tempMonth + 1, 0).getDate();
    const list = [];
    for (let d = 1; d <= daysCount; d++) {
      list.push(d);
    }
    return list;
  }, [tempYear, tempMonth]);

  const daysForSelectedMonthList = useMemo(() => {
    const daysCount = getDaysForMonth(monthValue);
    const list = [];
    for (let d = 1; d <= daysCount; d++) {
      list.push(d);
    }
    return list;
  }, [monthValue]);

  // Adjust tempDay if it exceeds max days of the newly selected month/year
  useEffect(() => {
    const maxDays = new Date(tempYear, tempMonth + 1, 0).getDate();
    if (tempDay > maxDays) {
      setTempDay(maxDays);
    }
  }, [tempYear, tempMonth, tempDay]);

  useEffect(() => {
    const maxDays = getDaysForMonth(monthValue);
    if (tempDayOfMonth > maxDays) {
      setTempDayOfMonth(maxDays);
    }
  }, [monthValue, tempDayOfMonth]);

  // Dynamic Scroll to Selected active row on mount
  useEffect(() => {
    if (isPickerVisible && usesCustomPicker) {
      setTimeout(() => {
        if (mode === 'day') {
          if (dayScrollRef.current) {
            const idx = DAYS_OF_WEEK.indexOf(tempDayOfWeek);
            if (idx !== -1) {
              scrollToCircularIndex(dayScrollRef, idx, DAYS_OF_WEEK.length);
            }
          }
        } else if (mode === 'month') {
          scrollToCircularIndex(monthScrollRef, tempMonth, MONTHS.length);
        } else if (mode === 'monthDay') {
          scrollToCircularIndex(dayScrollRef, tempDayOfMonth - 1, daysForSelectedMonthList.length);
        } else if (mode === 'date') {
          scrollToCircularIndex(monthScrollRef, tempMonth, MONTHS.length);
          scrollToCircularIndex(dayScrollRef, tempDay - 1, daysInMonthList.length);
          if (yearScrollRef.current) {
            const yIdx = yearsList.indexOf(tempYear);
            if (yIdx !== -1) {
              scrollToCircularIndex(yearScrollRef, yIdx, yearsList.length);
            }
          }
        } else {
          const hourIndex = hoursList.indexOf(tempHour);
          scrollToCircularIndex(hourScrollRef, hourIndex === -1 ? 0 : hourIndex, hoursList.length);
          scrollToCircularIndex(minuteScrollRef, tempMinute, minutesList.length);
          if (mode !== 'duration' && ampmScrollRef.current) {
            ampmScrollRef.current.scrollTo({ y: (tempAmPm === 'PM' ? 1 : 0) * SCROLL_ITEM_HEIGHT, animated: false });
          }
        }
      }, 80);
    }
  }, [isPickerVisible, mode, tempMonth, tempDay, tempYear, tempHour, tempMinute, tempAmPm, tempDayOfWeek, tempDayOfMonth, yearsList, usesCustomPicker]);

  // Self-healing effect: shift selected month/day if they fall into disabled/past range
  useEffect(() => {
    if (Platform.OS === 'web' && minimumDate instanceof Date) {
      const minYear = minimumDate.getFullYear();
      const minMonth = minimumDate.getMonth();
      const minDay = minimumDate.getDate();

      if (tempYear === minYear) {
        if (tempMonth < minMonth) {
          setTempMonth(minMonth);
        }
        if (tempMonth === minMonth && tempDay < minDay) {
          setTempDay(minDay);
        }
      }
    }
  }, [tempYear, tempMonth, tempDay, minimumDate]);

  const minutesList = useMemo(() => {
    const list = [];
    for (let m = 0; m < 60; m++) {
      list.push(m);
    }
    return list;
  }, []);

  const hoursList = useMemo(() => {
    const list = [];
    const minHour = mode === 'duration' ? 0 : 1;
    const maxHour = mode === 'duration' ? 23 : 12;
    for (let h = minHour; h <= maxHour; h++) {
      list.push(h);
    }
    return list;
  }, [mode]);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resolvedLabel}
          accessibilityHint={`Opens the ${mode} picker`}
          unstable_pressDelay={0}
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            styles.field,
            pressed && styles.fieldPressed,
            pressed && focusBorderColor ? { borderColor: focusBorderColor } : null,
            pressed && focusBackgroundColor ? { backgroundColor: focusBackgroundColor } : null,
          ]}
        >
          <Text style={[styles.value, !displayValue && styles.placeholder]}>
            {displayValue || resolvedPlaceholder}
          </Text>
        </Pressable>
        {optional && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${resolvedLabel}`}
            unstable_pressDelay={0}
            onPress={() => onChange('')}
            style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Render Native Picker on Mobile, Custom Scroller Wheel on Web */}
      {isPickerVisible && Platform.OS !== 'web' && mode !== 'day' && mode !== 'month' && mode !== 'monthDay' && mode !== 'duration' && (
        <DateTimePicker
          value={selectedDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* Modern Glassmorphic Wheel Picker Modal for Web */}
      {isPickerVisible && usesCustomPicker && (
        <Modal
          transparent
          visible={isPickerVisible}
          animationType="fade"
          onRequestClose={() => setPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.scrollerCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {mode === 'day' ? 'Select Day' : (mode === 'month' ? 'Select Month' : (mode === 'monthDay' ? 'Select Day' : (mode === 'duration' ? 'Select Time Period' : (mode === 'date' ? 'Select Date' : 'Select Time'))))}
                </Text>
              </View>

              {mode === 'date' ? (
                <View style={styles.typedInputWrap}>
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputCell}>
                      <Text style={styles.dateInputLabel}>Month</Text>
                      <TextInput
                        editable
                        selectTextOnFocus
                        value={typedDateMonth}
                        onChangeText={(input) => handleTypedDatePartChange('month', input)}
                        placeholder="Month"
                        inputMode="text"
                        accessibilityLabel="Type month"
                        selectionColor={pickerAccent}
                        style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                      />
                    </View>
                    <View style={styles.dateInputCell}>
                      <Text style={styles.dateInputLabel}>Day</Text>
                      <TextInput
                        editable
                        selectTextOnFocus
                        value={typedDateDay}
                        onChangeText={(input) => handleTypedDatePartChange('day', input)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="DD"
                        accessibilityLabel="Type day"
                        selectionColor={pickerAccent}
                        style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                      />
                    </View>
                    <View style={styles.dateInputCell}>
                      <Text style={styles.dateInputLabel}>Year</Text>
                      <TextInput
                        editable
                        selectTextOnFocus
                        value={typedDateYear}
                        onChangeText={(input) => handleTypedDatePartChange('year', input)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="YYYY"
                        accessibilityLabel="Type year"
                        selectionColor={pickerAccent}
                        style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                      />
                    </View>
                  </View>
                  {typedPickerError ? <Text style={styles.typedInputErrorText}>{typedPickerError}</Text> : null}
                </View>
              ) : mode === 'time' || mode === 'duration' ? (
                <View style={styles.typedInputWrap}>
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputCell}>
                      <Text style={styles.dateInputLabel}>Hour</Text>
                      <TextInput
                        editable
                        selectTextOnFocus
                        value={typedTimeHour}
                        onChangeText={(input) => handleTypedTimePartChange('hour', input)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="HH"
                        accessibilityLabel="Type hour"
                        selectionColor={pickerAccent}
                        style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                      />
                    </View>
                    <View style={styles.dateInputCell}>
                      <Text style={styles.dateInputLabel}>Min</Text>
                      <TextInput
                        editable
                        selectTextOnFocus
                        value={typedTimeMinute}
                        onChangeText={(input) => handleTypedTimePartChange('minute', input)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="MM"
                        accessibilityLabel="Type minutes"
                        selectionColor={pickerAccent}
                        style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                      />
                    </View>
                    {mode === 'time' ? (
                      <View style={styles.dateInputCell}>
                        <Text style={styles.dateInputLabel}>Period</Text>
                        <TextInput
                          editable
                          selectTextOnFocus
                          value={typedTimePeriod}
                          onChangeText={(input) => handleTypedTimePartChange('period', input)}
                          autoCapitalize="characters"
                          inputMode="text"
                          maxLength={2}
                          placeholder="AM"
                          accessibilityLabel="Type AM or PM"
                          selectionColor={pickerAccent}
                          style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                        />
                      </View>
                    ) : null}
                  </View>
                  {typedPickerError ? <Text style={styles.typedInputErrorText}>{typedPickerError}</Text> : null}
                </View>
              ) : (
                <View style={styles.typedInputWrap}>
                  <TextInput
                    editable
                    selectTextOnFocus
                    value={typedPickerValue}
                    onChangeText={handleTypedPickerChange}
                    keyboardType={mode === 'monthDay' ? 'number-pad' : 'default'}
                    inputMode={mode === 'monthDay' ? 'numeric' : 'text'}
                    placeholder={
                      mode === 'time'
                        ? 'Type time, e.g. 08:30'
                        : `Type ${mode === 'monthDay' ? 'day' : mode}`
                    }
                    accessibilityLabel={`Type ${resolvedLabel}`}
                    selectionColor={pickerAccent}
                    style={[styles.typedInput, typedPickerError && styles.typedInputError]}
                  />
                  {typedPickerError ? <Text style={styles.typedInputErrorText}>{typedPickerError}</Text> : null}
                </View>
              )}

              {/* Scroller Columns Container */}
              <View style={styles.columnsContainer}>
                {mode === 'day' ? (
                  <View style={styles.columnWrap}>
                    <ScrollView
                      ref={dayScrollRef}
                      style={styles.columnScroll}
                      showsVerticalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => wrapCircularScroll(event, dayScrollRef, DAYS_OF_WEEK.length)}
                      onScrollEndDrag={(event) => wrapCircularScroll(event, dayScrollRef, DAYS_OF_WEEK.length)}
                    >
                      {circularItems(DAYS_OF_WEEK).map(({ item: d, index, loopIndex }) => (
                        <Pressable
                          key={`${loopIndex}-${d}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Choose ${d} for ${resolvedLabel}`}
                          onPress={() => {
                            setTempDayOfWeek(d);
                            setTypedPickerValue(d);
                            setTypedPickerError('');
                          }}
                          style={[
                            styles.scrollItem,
                            tempDayOfWeek === d && pickerActiveItemStyle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.scrollItemText,
                              tempDayOfWeek === d && pickerActiveTextStyle,
                            ]}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : mode === 'month' ? (
                  <View style={styles.columnWrap}>
                    <ScrollView
                      ref={monthScrollRef}
                      style={styles.columnScroll}
                      showsVerticalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => wrapCircularScroll(event, monthScrollRef, MONTHS.length)}
                      onScrollEndDrag={(event) => wrapCircularScroll(event, monthScrollRef, MONTHS.length)}
                    >
                      {circularItems(MONTHS).map(({ item: monthName, index: idx, loopIndex }) => (
                        <Pressable
                          key={`${loopIndex}-${monthName}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Choose ${monthName} for ${resolvedLabel}`}
                          onPress={() => {
                            setTempMonth(idx);
                            setTypedPickerValue(monthName);
                            setTypedPickerError('');
                          }}
                          style={[
                            styles.scrollItem,
                            tempMonth === idx && pickerActiveItemStyle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.scrollItemText,
                              tempMonth === idx && pickerActiveTextStyle,
                            ]}
                          >
                            {monthName}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : mode === 'monthDay' ? (
                  <View style={styles.columnWrap}>
                    <ScrollView
                      ref={dayScrollRef}
                      style={styles.columnScroll}
                      showsVerticalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => wrapCircularScroll(event, dayScrollRef, daysForSelectedMonthList.length)}
                      onScrollEndDrag={(event) => wrapCircularScroll(event, dayScrollRef, daysForSelectedMonthList.length)}
                    >
                      {circularItems(daysForSelectedMonthList).map(({ item: d, loopIndex }) => (
                        <Pressable
                          key={`${loopIndex}-${d}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Choose day ${d} for ${resolvedLabel}`}
                          onPress={() => {
                            setTempDayOfMonth(d);
                            setTypedPickerValue(String(d));
                            setTypedPickerError('');
                          }}
                          style={[
                            styles.scrollItem,
                            tempDayOfMonth === d && pickerActiveItemStyle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.scrollItemText,
                              tempDayOfMonth === d && pickerActiveTextStyle,
                            ]}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : mode === 'date' ? (
                  <>
                    {/* Month Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <ScrollView
                        ref={monthScrollRef}
                        style={styles.columnScroll}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => wrapCircularScroll(event, monthScrollRef, MONTHS.length)}
                        onScrollEndDrag={(event) => wrapCircularScroll(event, monthScrollRef, MONTHS.length)}
                      >
                        {circularItems(MONTHS).map(({ item: m, index: idx, loopIndex }) => {
                          const isMonthDisabled = minimumDate instanceof Date
                            && tempYear === minimumDate.getFullYear()
                            && idx < minimumDate.getMonth();
                          return (
                            <Pressable
                              key={`${loopIndex}-${m}`}
                              accessibilityRole="button"
                              accessibilityLabel={`Choose ${m} for ${resolvedLabel}`}
                              accessibilityState={{ disabled: isMonthDisabled }}
                              disabled={isMonthDisabled}
                              onPress={() => {
                                setTempMonth(idx);
                                setTypedDateMonth(MONTHS[idx]);
                                setTypedPickerError('');
                              }}
                              style={[
                                styles.scrollItem,
                                tempMonth === idx && pickerActiveItemStyle,
                                isMonthDisabled && styles.scrollItemDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.scrollItemText,
                                  tempMonth === idx && pickerActiveTextStyle,
                                  isMonthDisabled && styles.scrollItemTextDisabled,
                                ]}
                              >
                                {m.slice(0, 3)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Day Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <ScrollView
                        ref={dayScrollRef}
                        style={styles.columnScroll}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => wrapCircularScroll(event, dayScrollRef, daysInMonthList.length)}
                        onScrollEndDrag={(event) => wrapCircularScroll(event, dayScrollRef, daysInMonthList.length)}
                      >
                        {circularItems(daysInMonthList).map(({ item: d, loopIndex }) => {
                          const isDayDisabled = minimumDate instanceof Date
                            && tempYear === minimumDate.getFullYear()
                            && tempMonth === minimumDate.getMonth()
                            && d < minimumDate.getDate();
                          return (
                            <Pressable
                              key={`${loopIndex}-${d}`}
                              accessibilityRole="button"
                              accessibilityLabel={`Choose day ${d} for ${resolvedLabel}`}
                              accessibilityState={{ disabled: isDayDisabled }}
                              disabled={isDayDisabled}
                              onPress={() => {
                                setTempDay(d);
                                setTypedDateDay(String(d));
                                setTypedPickerError('');
                              }}
                              style={[
                                styles.scrollItem,
                                tempDay === d && pickerActiveItemStyle,
                                isDayDisabled && styles.scrollItemDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.scrollItemText,
                                  tempDay === d && pickerActiveTextStyle,
                                  isDayDisabled && styles.scrollItemTextDisabled,
                                ]}
                              >
                                {d}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Year Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <ScrollView
                        ref={yearScrollRef}
                        style={styles.columnScroll}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => wrapCircularScroll(event, yearScrollRef, yearsList.length)}
                        onScrollEndDrag={(event) => wrapCircularScroll(event, yearScrollRef, yearsList.length)}
                      >
                        {circularItems(yearsList).map(({ item: y, loopIndex }) => (
                          <Pressable
                            key={`${loopIndex}-${y}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Choose year ${y} for ${resolvedLabel}`}
                            onPress={() => {
                              setTempYear(y);
                              setTypedDateYear(String(y));
                              setTypedPickerError('');
                            }}
                            style={[styles.scrollItem, tempYear === y && pickerActiveItemStyle]}
                          >
                            <Text style={[styles.scrollItemText, tempYear === y && pickerActiveTextStyle]}>
                              {y}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Hour Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <ScrollView
                        ref={hourScrollRef}
                        style={styles.columnScroll}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => wrapCircularScroll(event, hourScrollRef, hoursList.length)}
                        onScrollEndDrag={(event) => wrapCircularScroll(event, hourScrollRef, hoursList.length)}
                      >
                        {circularItems(hoursList).map(({ item: h, loopIndex }) => (
                          <Pressable
                            key={`${loopIndex}-${h}`}
                            accessibilityRole="button"
                            accessibilityLabel={mode === 'duration' ? `Choose ${pad2(h)} hours for ${resolvedLabel}` : `Choose hour ${h} for ${resolvedLabel}`}
                            onPress={() => {
                              setTempHour(h);
                              setTypedTimeHour(mode === 'duration' ? pad2(h) : String(h));
                              setTypedPickerError('');
                            }}
                            style={[styles.scrollItem, tempHour === h && pickerActiveItemStyle]}
                          >
                            <Text style={[styles.scrollItemText, tempHour === h && pickerActiveTextStyle]}>
                              {mode === 'duration' ? pad2(h) : h}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Minute Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <ScrollView
                        ref={minuteScrollRef}
                        style={styles.columnScroll}
                        showsVerticalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => wrapCircularScroll(event, minuteScrollRef, minutesList.length)}
                        onScrollEndDrag={(event) => wrapCircularScroll(event, minuteScrollRef, minutesList.length)}
                      >
                        {circularItems(minutesList).map(({ item: m, loopIndex }) => (
                          <Pressable
                            key={`${loopIndex}-${m}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Choose ${pad2(m)} minutes for ${resolvedLabel}`}
                            onPress={() => {
                              setTempMinute(m);
                              setTypedTimeMinute(pad2(m));
                              setTypedPickerError('');
                            }}
                            style={[styles.scrollItem, tempMinute === m && pickerActiveItemStyle]}
                          >
                            <Text style={[styles.scrollItemText, tempMinute === m && pickerActiveTextStyle]}>
                              {pad2(m)}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {mode === 'time' ? (
                      <View style={styles.columnWrap}>
                        <ScrollView
                          ref={ampmScrollRef}
                          style={styles.columnScroll}
                          showsVerticalScrollIndicator={false}
                        >
                          {['AM', 'PM'].map((p) => (
                            <Pressable
                              key={p}
                              accessibilityRole="button"
                              accessibilityLabel={`Choose ${p} for ${resolvedLabel}`}
                              onPress={() => {
                                setTempAmPm(p);
                                setTypedTimePeriod(p);
                                setTypedPickerError('');
                              }}
                              style={[styles.scrollItem, tempAmPm === p && pickerActiveItemStyle]}
                            >
                              <Text style={[styles.scrollItemText, tempAmPm === p && pickerActiveTextStyle]}>
                                {p}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    ) : null}
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Cancel ${resolvedLabel} picker`}
                  onPress={() => setPickerVisible(false)}
                  style={[styles.actionBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm ${resolvedLabel}`}
                  onPress={handleWebConfirm}
                  style={[styles.actionBtn, styles.confirmBtn, pickerConfirmButtonStyle]}
                >
                  <Text style={styles.confirmBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  field: {
    minHeight: accessibility.minTouchTarget,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldPressed: {
    borderColor: colors.focusRing,
    backgroundColor: colors.brandSoft,
  },
  value: {
    ...typography.body,
    color: colors.title,
  },
  placeholder: {
    color: colors.placeholder,
  },
  clearButton: {
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearButtonPressed: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandText,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
  },
  // Custom Web Scroller Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Semi-transparent Slate overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  scrollerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    width: 320,
    maxWidth: '100%',
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    gap: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    height: 180,
    alignItems: 'stretch',
  },
  columnWrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  typedInputWrap: {
    gap: spacing.xxs,
  },
  typedInput: {
    minHeight: accessibility.minTouchTarget,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.title,
    ...typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    outlineStyle: 'none',
    cursor: 'text',
    userSelect: 'text',
    zIndex: 2,
  },
  typedInputError: {
    borderColor: colors.error,
  },
  typedInputErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dateInputCell: {
    flex: 1,
    gap: spacing.xxs,
  },
  dateInputLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '600',
  },
  columnScroll: {
    flex: 1,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
  },
  scrollItem: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scrollItemActive: {
    backgroundColor: colors.brandSoft,
    borderBottomColor: colors.brandSoft,
  },
  scrollItemDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.45,
  },
  scrollItemText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '500',
  },
  scrollItemTextActive: {
    color: colors.brandText,
    fontWeight: '700',
  },
  scrollItemTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cancelBtn: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.body,
  },
  confirmBtn: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  confirmBtnText: {
    ...typography.button,
    color: colors.surface,
  },
});
