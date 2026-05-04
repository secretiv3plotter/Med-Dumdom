import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { accessibility, colors, radius, spacing, typography } from '../../theme';

const pad2 = (value) => String(value).padStart(2, '0');

export const formatPickerDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const formatPickerTime = (date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const parseDateValue = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(`${text}T00:00:00`);
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

const parseValue = (value, mode) => (mode === 'time' ? parseTimeValue(value) : parseDateValue(value));

const formatDisplayValue = (value, mode) => {
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
}) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const selectedDate = useMemo(() => {
    const parsedValue = parseValue(value, mode) ?? new Date();
    if (mode !== 'date' || !(minimumDate instanceof Date) || parsedValue >= minimumDate) {
      return parsedValue;
    }

    return minimumDate;
  }, [minimumDate, mode, value]);
  const displayValue = formatDisplayValue(value, mode);
  const resolvedPlaceholder = placeholder || (mode === 'time' ? 'Select time' : 'Select date');
  const resolvedLabel = accessibilityLabel || label || resolvedPlaceholder;

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

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resolvedLabel}
          accessibilityHint={`Opens the native ${mode} picker`}
          unstable_pressDelay={0}
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
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
      {isPickerVisible ? (
        <DateTimePicker
          value={selectedDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
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
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fieldPressed: {
    borderColor: colors.focusRing,
    backgroundColor: '#C7DBFF',
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearButtonPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
  },
});
