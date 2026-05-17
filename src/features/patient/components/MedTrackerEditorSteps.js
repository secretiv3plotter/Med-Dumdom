import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import { DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { ScheduleEntryText } from './MedTrackerDisplayComponents';
import { SegmentButton } from './MedTrackerScreenComponents';
import { MEDICINE_SCHEDULE_TYPE_OPTIONS, MEDICINE_SUB_INTERVAL_OPTIONS } from '../constants/medTrackerEditorSteps';
import { capitalize, getScheduleDayLabel, startOfToday, getNextHourOClock } from '../utils/medTrackerUtils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysForMonth = (monthOfYear) => {
  const monthIndex = MONTHS.indexOf(monthOfYear);
  return monthIndex === -1 ? 31 : new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();
};

const formatIntervalValue = (hours = 0, minutes = 0) =>
  `${String(Number(hours) || 0).padStart(2, '0')}:${String(Number(minutes) || 0).padStart(2, '0')}`;

const hasIntervalValue = (hours, minutes) =>
  String(hours ?? '').trim() !== '' || String(minutes ?? '').trim() !== '';

const parseIntervalValue = (value) => {
  const [hours = '0', minutes = '0'] = String(value || '').split(':');
  return {
    hours: Number(hours) || 0,
    minutes: Number(minutes) || 0,
  };
};

function UnitSegmentButton({ label = '', selected, onPress, onDelete }) {
  return (
    <View style={[styles.unitBadgeContainer, selected && styles.unitBadgeContainerSelected]}>
      <Pressable
        onPress={onPress}
        style={styles.unitBadgePressable}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.unitBadgeText, selected && styles.unitBadgeTextSelected]}>
          {capitalize(label)}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={styles.unitDeleteBadge}
        accessibilityRole="button"
        accessibilityLabel={`Delete unit ${label}`}
      >
        <Ionicons name="close" size={14} color="#D32F2F" />
      </Pressable>
    </View>
  );
}

const getDoseUnitLabel = (unit) => String(unit || '').trim() || 'units';

function InlineScheduleEditor({ entry, index, unit, isHourly, isWeekly, isMonthly, onSave, onCancel }) {
  const [doseSize, setDoseSize] = useState(String(entry.doseSize));
  const [scheduledTime, setScheduledTime] = useState(entry.scheduledTime);
  const [intervalHours, setIntervalHours] = useState(entry.intervalMinutes ? Math.floor(Number(entry.intervalMinutes) / 60) : '');
  const [intervalMinutes, setIntervalMinutes] = useState(entry.intervalMinutes ? Number(entry.intervalMinutes) % 60 : '');
  const [dayOfWeek, setDayOfWeek] = useState(entry.dayOfWeek || '');
  const [monthOfYear, setMonthOfYear] = useState(entry.monthOfYear || '');
  const [dayOfMonth, setDayOfMonth] = useState(entry.dayOfMonth ? String(entry.dayOfMonth) : '');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = doseSize.trim();
    if (!trimmed) {
      setError('Enter a valid dose size.');
      return;
    }
    if (isWeekly && !dayOfWeek) {
      setError('Select a day of the week.');
      return;
    }
    const intervalTotalMinutes = Number(intervalHours || 0) * 60 + Number(intervalMinutes || 0);
    if (isHourly && intervalTotalMinutes <= 0) {
      setError('Select a time period greater than 00:00.');
      return;
    }
    if (isMonthly && !monthOfYear) {
      setError('Select a month.');
      return;
    }
    if (isMonthly && !dayOfMonth) {
      setError('Select a day.');
      return;
    }
    setError('');
    const errMsg = onSave(index, {
      doseSize: trimmed,
      scheduledTime,
      intervalMinutes: isHourly ? intervalTotalMinutes : null,
      dayOfWeek,
      monthOfYear,
      dayOfMonth,
    });
    if (errMsg) {
      setError(errMsg);
    }
  };

  return (
    <View style={styles.inlineEditorContainer}>
      <View style={styles.inlineInputsRow}>
        <View style={styles.inlineDoseCol}>
          <Text style={styles.fieldSubcaption}>How many {getDoseUnitLabel(unit)} will you take for this dose?</Text>
          <InputBar
            placeholder="Dose"
            keyboardType="number-pad"
            value={doseSize}
            onChangeText={(val) => {
              setDoseSize(val);
              setError('');
            }}
          />
        </View>
        <View style={styles.inlineTimeCol}>
          {isHourly ? (
            <NativeDateTimeField
              mode="duration"
              placeholder="Select time period"
              accessibilityLabel="Time Period"
              value={hasIntervalValue(intervalHours, intervalMinutes) ? formatIntervalValue(intervalHours, intervalMinutes) : ''}
              onChange={(val) => {
                const nextInterval = parseIntervalValue(val);
                setIntervalHours(nextInterval.hours);
                setIntervalMinutes(nextInterval.minutes);
                setError('');
              }}
            />
          ) : (
            <NativeDateTimeField
              mode="time"
              placeholder="Select time"
              accessibilityLabel="Time"
              value={scheduledTime}
              onChange={(val) => {
                setScheduledTime(val);
                setError('');
              }}
            />
          )}
        </View>
      </View>
      {isWeekly && (
        <View style={{ marginBottom: spacing.sm }}>
          <NativeDateTimeField
            mode="day"
            label="Day of week"
            placeholder="Select day"
            accessibilityLabel="Day of week"
            value={dayOfWeek}
            onChange={(val) => {
              setDayOfWeek(val);
              setError('');
            }}
          />
        </View>
      )}
      {isMonthly && (
        <View style={{ marginBottom: spacing.sm }}>
          <NativeDateTimeField
            mode="month"
            label="Month"
            placeholder="Select month"
            accessibilityLabel="Month"
            value={monthOfYear}
            onChange={(val) => {
              setMonthOfYear(val);
              setDayOfMonth((currentDay) => {
                const maxDay = getDaysForMonth(val);
                return Number(currentDay) > maxDay ? '' : currentDay;
              });
              setError('');
            }}
          />
          <View style={{ marginTop: spacing.sm }}>
            <NativeDateTimeField
              mode="monthDay"
              label="Day"
              placeholder="Select day"
              accessibilityLabel="Day"
              value={dayOfMonth}
              monthValue={monthOfYear}
              onChange={(val) => {
                setDayOfMonth(val);
                setError('');
              }}
            />
          </View>
        </View>
      )}
      {error ? <Text style={styles.inlineErrorText}>{error}</Text> : null}
      <View style={styles.inlineActionsRow}>
        <ActionButton
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          style={styles.inlineBtn}
        />
        <ActionButton
          label="Save"
          variant="solid"
          onPress={handleSave}
          style={styles.inlineBtn}
        />
      </View>
    </View>
  );
}

export function MedicineDetailsStep({ formState, setFormState, units = [], onAddUnit, onDeleteUnit }) {
  const [customUnitText, setCustomUnitText] = useState('');

  const handleSaveCustomUnit = () => {
    const trimmed = customUnitText.trim();
    if (!trimmed) return;
    onAddUnit?.(trimmed);
    setCustomUnitText('');
  };

  return (
    <View style={styles.formColumn}>
      <InputBar
        placeholder="Name of the medicine"
        value={formState.medName}
        onChangeText={(value) => setFormState((current) => ({ ...current, medName: value }))}
      />
      <View style={styles.scheduleBuilder}>
        <Text style={styles.sectionLabel}>Choose or add a unit</Text>
        <View style={styles.segmentRow}>
          {units.map((unit) => {
            const isSelected = formState.unit.toLowerCase() === unit.name.toLowerCase();
            return (
              <UnitSegmentButton
                key={unit.unitId}
                label={unit.name === 'mg' ? 'Mg' : capitalize(unit.name)}
                selected={isSelected}
                onPress={() =>
                  setFormState((current) => ({
                    ...current,
                    unit: unit.name,
                  }))
                }
                onDelete={() => onDeleteUnit?.(unit.unitId, unit.name)}
              />
            );
          })}
        </View>

        <View style={styles.customUnitAdderRow}>
          <View style={{ flex: 1 }}>
            <InputBar
              placeholder="Add custom unit"
              value={customUnitText}
              onChangeText={setCustomUnitText}
            />
          </View>
          <ActionButton
            label="Add"
            variant="solid"
            onPress={handleSaveCustomUnit}
            style={styles.customUnitAddButton}
            disabled={!customUnitText.trim()}
          />
        </View>
      </View>
      <InputBar
        placeholder="Instructions (optional)"
        value={formState.instructions}
        onChangeText={(value) => setFormState((current) => ({ ...current, instructions: value }))}
      />
      <InputBar
        placeholder="Prescriber contact (optional)"
        value={formState.prescriberContact}
        onChangeText={(value) => setFormState((current) => ({ ...current, prescriberContact: value }))}
      />
    </View>
  );
}

export function MedicineScheduleTypeStep({ selectedScheduleType, onSelectScheduleType }) {
  const isSelectedSubInterval = ['regular_hourly', 'regular_daily', 'regular_weekly', 'regular_monthly'].includes(selectedScheduleType);
  const [isIntervalsExpanded, setIsIntervalsExpanded] = useState(isSelectedSubInterval);

  return (
    <View style={styles.scheduleTypeGrid}>
      {MEDICINE_SCHEDULE_TYPE_OPTIONS.map((option) => {
        const isParentSelected = option.isParent && isSelectedSubInterval;
        const selected = selectedScheduleType === option.value || isParentSelected;

        return (
          <View key={option.value} style={styles.optionContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              unstable_pressDelay={0}
              onPress={() => {
                if (option.isParent) {
                  const nextExpanded = !isIntervalsExpanded;
                  setIsIntervalsExpanded(nextExpanded);
                  if (nextExpanded && !isSelectedSubInterval) {
                    onSelectScheduleType('regular_daily');
                  }
                } else {
                  onSelectScheduleType(option.value);
                }
              }}
              style={({ pressed }) => [
                styles.scheduleTypeCard,
                selected && styles.scheduleTypeCardSelected,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={styles.scheduleTypeCardContent}>
                <Text style={[styles.scheduleTypeLabel, selected && styles.scheduleTypeLabelSelected]}>
                  {option.label}
                </Text>
                {option.caption ? (
                  <Text style={[styles.scheduleTypeCaption, selected && styles.scheduleTypeCaptionSelected]}>
                    {option.caption}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            {option.isParent && isIntervalsExpanded ? (
              <View style={styles.nestedIntervalsContainer}>
                {MEDICINE_SUB_INTERVAL_OPTIONS.map((subOption) => {
                  const subSelected = selectedScheduleType === subOption.value;
                  return (
                    <Pressable
                      key={subOption.value}
                      accessibilityRole="button"
                      accessibilityLabel={subOption.label}
                      accessibilityState={{ selected: subSelected }}
                      unstable_pressDelay={0}
                      onPress={() => onSelectScheduleType(subOption.value)}
                      style={({ pressed }) => [
                        styles.nestedTypeCard,
                        subSelected && styles.nestedTypeCardSelected,
                        pressed && styles.pressedCard,
                      ]}
                    >
                      <View style={styles.scheduleTypeCardContent}>
                        <Text style={[styles.nestedTypeLabel, subSelected && styles.nestedTypeLabelSelected]}>
                          {subOption.label}
                        </Text>
                        {subOption.caption ? (
                          <Text style={[styles.nestedTypeCaption, subSelected && styles.nestedTypeCaptionSelected]}>
                            {subOption.caption}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function MedicineScheduleStep({
  editorMode,
  selectedScheduleType,
  formState,
  scheduleDraft,
  scheduleEntries,
  editingScheduleIndex,
  setFormState,
  setScheduleDraft,
  onCancelScheduleEdit,
  onSaveScheduleEntry,
  onSaveInlineScheduleEntry,
  onEditScheduleEntry,
  onDeleteScheduleEntry,
}) {
  const isHourly = selectedScheduleType === 'regular_hourly';
  const isWeekly = selectedScheduleType === 'weekly' || selectedScheduleType === 'regular_weekly';
  const isMonthly = selectedScheduleType === 'monthly' || selectedScheduleType === 'regular_monthly';
  const hasHourlySchedule = scheduleEntries.some((entry) => entry.intervalMinutes);
  const intervalTotalMinutes = Number(scheduleDraft.intervalHours || 0) * 60 + Number(scheduleDraft.intervalMinutes || 0);
  const hasSelectedInterval = hasIntervalValue(scheduleDraft.intervalHours, scheduleDraft.intervalMinutes);
  const isScheduleDraftComplete = Boolean(
    String(scheduleDraft.doseSize || '').trim() &&
    (isHourly ? hasSelectedInterval && intervalTotalMinutes > 0 : String(scheduleDraft.scheduledTime || '').trim()) &&
    (!isWeekly || scheduleDraft.dayOfWeek) &&
    (!isMonthly || (scheduleDraft.monthOfYear && scheduleDraft.dayOfMonth)) &&
    (!isHourly || !hasHourlySchedule)
  );

  const calculatedDailyAmount = isHourly && scheduleDraft.doseSize && intervalTotalMinutes > 0
    ? Math.floor(1440 / intervalTotalMinutes) * Number(scheduleDraft.doseSize)
    : null;

  return (
    <>
      <View style={styles.formColumn}>
        <NativeDateTimeField
          label="Start date"
          placeholder="Select start date"
          accessibilityLabel="Start date"
          value={formState.startDate}
          onChange={(value) => setFormState((current) => {
            const nextState = { ...current, startDate: value };
            if (value && !nextState.startTime) {
              nextState.startTime = getNextHourOClock();
            }
            return nextState;
          })}
          minimumDate={startOfToday()}
        />
        {isHourly && formState.startDate ? (
          <NativeDateTimeField
            mode="time"
            label="Start time"
            placeholder="Select start time"
            accessibilityLabel="Start time"
            value={formState.startTime}
            onChange={(value) => setFormState((current) => ({ ...current, startTime: value }))}
          />
        ) : null}
        <NativeDateTimeField
          label="End date"
          placeholder="Select end date (optional)"
          accessibilityLabel="End date"
          value={formState.endDate}
          onChange={(value) => setFormState((current) => ({ ...current, endDate: value }))}
          minimumDate={startOfToday()}
          optional
        />
      </View>

      {(scheduleEntries.length === 0 || !isHourly) ? (
        <View style={styles.scheduleBuilder}>
          <Text style={styles.sectionLabel}>Create a schedule</Text>

          <Text style={styles.fieldSubcaption}>
            How many {getDoseUnitLabel(formState.unit)} will you take for this dose?
          </Text>
          <InputBar
            placeholder="Dose"
            keyboardType="number-pad"
            value={scheduleDraft.doseSize}
            onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
          />

          {isWeekly && (
            <NativeDateTimeField
              mode="day"
              label="Day of week"
              placeholder="Select day"
              accessibilityLabel="Day of week"
              value={scheduleDraft.dayOfWeek}
              onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfWeek: value }))}
            />
          )}

          {isMonthly && (
            <>
              <NativeDateTimeField
                mode="month"
                label="Month"
                placeholder="Select month"
                accessibilityLabel="Month"
                value={scheduleDraft.monthOfYear}
                onChange={(value) => setScheduleDraft((current) => ({
                  ...current,
                  monthOfYear: value,
                  dayOfMonth: Number(current.dayOfMonth) > getDaysForMonth(value) ? '' : current.dayOfMonth,
                }))}
              />
              <NativeDateTimeField
                mode="monthDay"
                label="Day"
                placeholder="Select day"
                accessibilityLabel="Day"
                value={scheduleDraft.dayOfMonth}
                monthValue={scheduleDraft.monthOfYear}
                onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfMonth: value }))}
              />
            </>
          )}

          {isHourly ? (
            <>
              <NativeDateTimeField
                mode="duration"
                label="Time Period"
                placeholder="Select time period"
                accessibilityLabel="Time Period"
                value={hasSelectedInterval ? formatIntervalValue(scheduleDraft.intervalHours, scheduleDraft.intervalMinutes) : ''}
                onChange={(value) => {
                  const nextInterval = parseIntervalValue(value);
                  setScheduleDraft((current) => ({
                    ...current,
                    intervalHours: nextInterval.hours,
                    intervalMinutes: nextInterval.minutes,
                  }));
                }}
              />
              {calculatedDailyAmount !== null && !Number.isNaN(calculatedDailyAmount) ? (
                <Text style={[styles.fieldSubcaption, { color: colors.brand, fontWeight: '700', marginTop: spacing.xxs || 4 }]}>
                  Calculated daily dosage: {calculatedDailyAmount} {formState.unit || 'units'} per day
                </Text>
              ) : null}
            </>
          ) : (
            <NativeDateTimeField
              mode="time"
              label="Time"
              placeholder="Select time"
              accessibilityLabel="Time"
              value={scheduleDraft.scheduledTime}
              onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
            />
          )}

          <View style={styles.footerActionsRow}>
            <ActionButton
              label="Add schedule item"
              variant="solid"
              onPress={onSaveScheduleEntry}
              disabled={!isScheduleDraftComplete}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Added schedule items</Text>
        {scheduleEntries.length ? (
          scheduleEntries.map((entry, index) => {
            const isEditing = editingScheduleIndex === index;
            return (
              <View
                key={`${editorMode || 'create'}-schedule-${index}`}
                style={[
                  styles.scheduleCard,
                  isEditing && styles.scheduleCardEditing,
                ]}
              >
                <View style={styles.scheduleCardRow}>
                  <ScheduleEntryText
                    entry={entry}
                    unit={formState.unit}
                    dayLabel={getScheduleDayLabel(entry)}
                  />
                  {editingScheduleIndex === null ? (
                    <View style={styles.scheduleEditActions}>
                      {!isHourly ? (
                        <View style={styles.iconActionCol}>
                          <Pressable
                            onPress={() => onEditScheduleEntry(index)}
                            style={({ pressed }) => [
                              styles.iconActionBtn,
                              pressed && styles.iconActionPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit schedule item ${index + 1}`}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.brand} />
                          </Pressable>
                          <Text style={styles.iconActionLabel}>Edit</Text>
                        </View>
                      ) : null}
                      <View style={styles.iconActionCol}>
                        <Pressable
                          onPress={() => onDeleteScheduleEntry(index)}
                          style={({ pressed }) => [
                            styles.iconActionBtn,
                            pressed && styles.iconActionPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete schedule item ${index + 1}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.error || '#D32F2F'} />
                        </Pressable>
                        <Text style={[styles.iconActionLabel, { color: colors.error || '#D32F2F' }]}>Delete</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                {isEditing ? (
                  <InlineScheduleEditor
                    entry={entry}
                    index={index}
                    unit={formState.unit}
                    isHourly={isHourly}
                    isWeekly={isWeekly}
                    isMonthly={isMonthly}
                    onSave={onSaveInlineScheduleEntry}
                    onCancel={onCancelScheduleEdit}
                  />
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyScheduleText}>No schedule items added yet.</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formColumn: {
    gap: spacing.sm,
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scheduleBuilder: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    marginTop: spacing.sm,
  },
  scheduleSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  durationFieldGroup: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
  },
  fieldSubcaption: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  scheduleCardEditing: {
    borderColor: colors.brand,
    borderWidth: 2,
    backgroundColor: colors.brandSoft,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scheduleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scheduleEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  iconActionPressed: {
    backgroundColor: '#E2E8F0',
  },
  iconActionCol: {
    alignItems: 'center',
    gap: spacing.xxs || 2,
  },
  iconActionLabel: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand,
    textAlign: 'center',
  },
  emptyScheduleText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  scheduleTypeGrid: {
    gap: spacing.sm,
  },
  scheduleTypeCard: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  scheduleTypeCardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  scheduleTypeLabel: {
    ...typography.body,
    color: colors.body,
    fontWeight: '700',
  },
  scheduleTypeLabelSelected: {
    color: colors.brandText,
  },
  pressedCard: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  unitBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 44,
  },
  unitBadgeContainerSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  unitBadgePressable: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  unitBadgeText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
  },
  unitBadgeTextSelected: {
    color: colors.brandText,
  },
  unitDeleteBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xxs,
  },
  customUnitAdderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customUnitAddButton: {
    width: 60,
    flexGrow: 0,
    height: 48,
    justifyContent: 'center',
  },
  optionContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  scheduleTypeCardContent: {
    flexDirection: 'column',
    gap: 4,
  },
  scheduleTypeCaption: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '400',
    fontSize: 12,
  },
  scheduleTypeCaptionSelected: {
    color: '#0055B3',
  },
  nestedIntervalsContainer: {
    paddingLeft: spacing.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  nestedTypeCard: {
    minHeight: 48,
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  nestedTypeCardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  nestedTypeLabel: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
  },
  nestedTypeLabelSelected: {
    color: colors.brandText,
  },
  nestedTypeCaption: {
    fontSize: 11,
    color: colors.bodyMuted,
    fontWeight: '400',
  },
  nestedTypeCaptionSelected: {
    color: '#0055B3',
  },
  inlineEditorContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  inlineInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineDoseCol: {
    flex: 1,
  },
  inlineTimeCol: {
    flex: 2,
  },
  inlineActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  inlineBtn: {
    minWidth: 80,
  },
  inlineErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
});
