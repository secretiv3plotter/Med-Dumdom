import { useMemo, useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ScrollView, Modal } from 'react-native';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

  // States for Custom Web Scroller Picker Wheel
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState('AM');

  // Sync temp picker states when opening the picker
  useEffect(() => {
    if (isPickerVisible && Platform.OS === 'web') {
      const currentVal = parseValue(value, mode) ?? new Date();
      if (mode === 'date') {
        setTempYear(currentVal.getFullYear());
        setTempMonth(currentVal.getMonth());
        setTempDay(currentVal.getDate());
      } else {
        const rawHours = currentVal.getHours();
        const displayHours = rawHours % 12 || 12;
        const ampm = rawHours >= 12 ? 'PM' : 'AM';
        setTempHour(displayHours);
        setTempMinute(currentVal.getMinutes());
        setTempAmPm(ampm);
      }
    }
  }, [isPickerVisible, value, mode]);

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

  // Web Picker Confirm Handler
  const handleWebConfirm = () => {
    setPickerVisible(false);
    if (mode === 'date') {
      const finalDate = new Date(tempYear, tempMonth, tempDay);
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

  // Adjust tempDay if it exceeds max days of the newly selected month/year
  useEffect(() => {
    const maxDays = new Date(tempYear, tempMonth + 1, 0).getDate();
    if (tempDay > maxDays) {
      setTempDay(maxDays);
    }
  }, [tempYear, tempMonth, tempDay]);

  const minutesList = useMemo(() => {
    const list = [];
    for (let m = 0; m < 60; m++) {
      list.push(m);
    }
    return list;
  }, []);

  const hoursList = useMemo(() => {
    const list = [];
    for (let h = 1; h <= 12; h++) {
      list.push(h);
    }
    return list;
  }, []);

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

      {/* Render Native Picker on Mobile, Custom Scroller Wheel on Web */}
      {isPickerVisible && Platform.OS !== 'web' && (
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
      {isPickerVisible && Platform.OS === 'web' && (
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
                  {mode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
              </View>

              {/* Scroller Columns Container */}
              <View style={styles.columnsContainer}>
                {mode === 'date' ? (
                  <>
                    {/* Month Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <Text style={styles.columnLabel}>Month</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {MONTHS.map((m, idx) => (
                          <Pressable
                            key={m}
                            onPress={() => setTempMonth(idx)}
                            style={[styles.scrollItem, tempMonth === idx && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempMonth === idx && styles.scrollItemTextActive]}>
                              {m.slice(0, 3)}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Day Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <Text style={styles.columnLabel}>Day</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {daysInMonthList.map((d) => (
                          <Pressable
                            key={d}
                            onPress={() => setTempDay(d)}
                            style={[styles.scrollItem, tempDay === d && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempDay === d && styles.scrollItemTextActive]}>
                              {d}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Year Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <Text style={styles.columnLabel}>Year</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {yearsList.map((y) => (
                          <Pressable
                            key={y}
                            onPress={() => setTempYear(y)}
                            style={[styles.scrollItem, tempYear === y && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempYear === y && styles.scrollItemTextActive]}>
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
                      <Text style={styles.columnLabel}>Hour</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {hoursList.map((h) => (
                          <Pressable
                            key={h}
                            onPress={() => setTempHour(h)}
                            style={[styles.scrollItem, tempHour === h && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempHour === h && styles.scrollItemTextActive]}>
                              {h}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Minute Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <Text style={styles.columnLabel}>Min</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {minutesList.map((m) => (
                          <Pressable
                            key={m}
                            onPress={() => setTempMinute(m)}
                            style={[styles.scrollItem, tempMinute === m && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempMinute === m && styles.scrollItemTextActive]}>
                              {pad2(m)}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

                    {/* AM/PM Scroll Wheel */}
                    <View style={styles.columnWrap}>
                      <Text style={styles.columnLabel}>Period</Text>
                      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                        {['AM', 'PM'].map((p) => (
                          <Pressable
                            key={p}
                            onPress={() => setTempAmPm(p)}
                            style={[styles.scrollItem, tempAmPm === p && styles.scrollItemActive]}
                          >
                            <Text style={[styles.scrollItemText, tempAmPm === p && styles.scrollItemTextActive]}>
                              {p}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setPickerVisible(false)}
                  style={[styles.actionBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleWebConfirm}
                  style={[styles.actionBtn, styles.confirmBtn]}
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
  columnLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.bodyMuted,
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
  scrollItemText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '500',
  },
  scrollItemTextActive: {
    color: colors.brandText,
    fontWeight: '700',
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
