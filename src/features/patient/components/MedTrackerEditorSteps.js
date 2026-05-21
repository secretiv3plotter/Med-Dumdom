import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { ScheduleEntryText } from './MedTrackerDisplayComponents';
import { SegmentButton } from './MedTrackerScreenComponents';
import { MEDICINE_SCHEDULE_TYPE_OPTIONS, MEDICINE_SUB_INTERVAL_OPTIONS } from '../constants/medTrackerEditorSteps';
import { getScheduleDayLabel, getSchedulesBySchedulePatternOrder, isPastTimeToday, startOfToday, getNextHourOClock } from '../utils/medTrackerUtils';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

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

const getScheduleTypeWarningLabel = (scheduleType) => {
  const option = [...MEDICINE_SCHEDULE_TYPE_OPTIONS, ...MEDICINE_SUB_INTERVAL_OPTIONS]
    .find((item) => item.value === scheduleType);

  return option ? option.label.toLowerCase() : 'previous';
};

const parsePositiveCount = (value) => {
  const numericValue = Number(String(value || '').trim());
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 0;
};

const formatTimeForSummary = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':');
  const hours = Number(h);
  if (Number.isNaN(hours)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 || 12;
  return `${display}:${String(m || '00').padStart(2, '0')} ${period}`;
};

function UnitSegmentButton({ label = '', selected, onPress, onDelete }) {
  return (
    <View style={[styles.unitBadgeContainer, selected && styles.unitBadgeContainerSelected]}>
      <Pressable
        onPress={onPress}
        style={styles.unitBadgePressable}
        accessibilityRole="button"
        accessibilityLabel={`Select unit ${label}`}
        accessibilityState={{ selected }}
      >
        <Text style={[styles.unitBadgeText, selected && styles.unitBadgeTextSelected]}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={styles.unitDeleteBadge}
        accessibilityRole="button"
        accessibilityLabel={`Delete unit ${label}`}
      >
        <Ionicons name="close" size={14} color={colors.error} />
      </Pressable>
    </View>
  );
}

const getDoseUnitLabel = (unit) => String(unit || '').trim() || 'units';

function InlineScheduleEditor({ entry, index, unit, isHourly, isWeeklyInterval, isEveryWeeksInterval, isMonthlyInterval, isAsNeeded, isWeekly, isMonthly, onSave, onCancel }) {
  const [doseSize, setDoseSize] = useState(String(entry.doseSize));
  const [scheduledTime, setScheduledTime] = useState(entry.scheduledTime);
  const [intervalHours, setIntervalHours] = useState(entry.intervalMinutes ? Math.floor(Number(entry.intervalMinutes) / 60) : '');
  const [intervalMinutes, setIntervalMinutes] = useState(entry.intervalMinutes ? Number(entry.intervalMinutes) % 60 : '');
  const [intervalDays, setIntervalDays] = useState(isWeeklyInterval && entry.intervalMinutes ? String(Math.floor(Number(entry.intervalMinutes) / 1440)) : '');
  const [intervalWeeks, setIntervalWeeks] = useState(isEveryWeeksInterval && entry.intervalMinutes ? String(Math.floor(Number(entry.intervalMinutes) / 10080)) : '');
  const [intervalMonths, setIntervalMonths] = useState(isMonthlyInterval && entry.intervalCount ? String(entry.intervalCount) : '');
  const [dayOfWeek, setDayOfWeek] = useState(entry.dayOfWeek || '');
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
    const intervalTotalMinutes = isWeeklyInterval
      ? parsePositiveCount(intervalDays) * 1440
      : isEveryWeeksInterval
      ? parsePositiveCount(intervalWeeks) * 10080
      : isMonthlyInterval
      ? 0
      : Number(intervalHours || 0) * 60 + Number(intervalMinutes || 0);
    if (isHourly && intervalTotalMinutes <= 0) {
      setError('Select a time period greater than 00:00.');
      return;
    }
    if (isWeeklyInterval && intervalTotalMinutes <= 0) {
      setError('Enter how many days between doses.');
      return;
    }
    if (isEveryWeeksInterval && intervalTotalMinutes <= 0) {
      setError('Enter how many weeks between doses.');
      return;
    }
    if (isMonthlyInterval && !parsePositiveCount(intervalMonths)) {
      setError('Enter how many months between doses.');
      return;
    }
    if (isMonthlyInterval && !dayOfMonth) {
      setError('Select a day of the month.');
      return;
    }
    if (isMonthly && !dayOfMonth) {
      setError('Select a day.');
      return;
    }
    setError('');
    const errMsg = onSave(index, {
      doseSize: trimmed,
      scheduledTime: isHourly || isWeeklyInterval || isEveryWeeksInterval || isMonthlyInterval || isAsNeeded ? '00:00' : scheduledTime,
      intervalMinutes: isHourly || isWeeklyInterval || isEveryWeeksInterval ? intervalTotalMinutes : null,
      intervalUnit: isAsNeeded ? 'asNeeded' : isWeeklyInterval ? 'days' : isEveryWeeksInterval ? 'weeks' : isMonthlyInterval ? 'months' : '',
      intervalCount: isMonthlyInterval ? parsePositiveCount(intervalMonths) : null,
      dayOfWeek,
      monthOfYear: '',
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
          <Text style={styles.fieldSubcaption}>Dose</Text>
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
          ) : isWeeklyInterval || isEveryWeeksInterval || isMonthlyInterval || isAsNeeded ? null : (
            <>
              <Text style={styles.fieldSubcaption}>Time</Text>
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
            </>
          )}
        </View>
      </View>
      {isWeeklyInterval ? (
        <View style={{ marginBottom: spacing.sm }}>
          <Text style={styles.fieldSubcaption}>Repeat after how many days?</Text>
          <InputBar
            placeholder="Days"
            keyboardType="number-pad"
            value={intervalDays}
            onChangeText={(val) => {
              setIntervalDays(val.replace(/[^0-9]/g, ''));
              setError('');
            }}
          />
        </View>
      ) : null}
      {isEveryWeeksInterval ? (
        <View style={{ marginBottom: spacing.sm }}>
          <Text style={styles.fieldSubcaption}>Repeat after how many weeks?</Text>
          <InputBar
            placeholder="Weeks"
            keyboardType="number-pad"
            value={intervalWeeks}
            onChangeText={(val) => {
              setIntervalWeeks(val.replace(/[^0-9]/g, ''));
              setError('');
            }}
          />
        </View>
      ) : null}
      {isMonthlyInterval ? (
        <View style={{ marginBottom: spacing.sm }}>
          <Text style={styles.fieldSubcaption}>Repeat after how many months?</Text>
          <InputBar
            placeholder="Months"
            keyboardType="number-pad"
            value={intervalMonths}
            onChangeText={(val) => {
              setIntervalMonths(val.replace(/[^0-9]/g, ''));
              setError('');
            }}
          />
          <View style={{ marginTop: spacing.sm }}>
            <NativeDateTimeField
              mode="monthDay"
              label="Day"
              placeholder="Select day"
              accessibilityLabel="Day of month"
              value={dayOfMonth}
              onChange={(val) => {
                setDayOfMonth(val);
                setError('');
              }}
            />
          </View>
        </View>
      ) : null}
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
          <View style={styles.fieldPromptGroup}>
            <Text style={styles.fieldPromptLabel}>Day</Text>
            <Text style={styles.fieldSubcaption}>At which day of the month?</Text>
          </View>
          <NativeDateTimeField
            mode="monthDay"
            placeholder="Select day"
            accessibilityLabel="Day of month"
            value={dayOfMonth}
            onChange={(val) => {
              setDayOfMonth(val);
              setError('');
            }}
          />
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
                label={unit.name}
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
              onChangeText={(value) => setCustomUnitText(value.toLowerCase())}
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

export function MedicineScheduleTypeStep({ selectedScheduleType, originalScheduleType = null, onSelectScheduleType }) {
  const defaultIntervalType = MEDICINE_SUB_INTERVAL_OPTIONS[0]?.value || 'regular_hourly';
  const isSelectedSubInterval = MEDICINE_SUB_INTERVAL_OPTIONS.some((option) => option.value === selectedScheduleType);
  const [isIntervalsExpanded, setIsIntervalsExpanded] = useState(isSelectedSubInterval);
  const showChangeWarning = Boolean(originalScheduleType && selectedScheduleType !== originalScheduleType);
  const previousScheduleLabel = getScheduleTypeWarningLabel(originalScheduleType);

  return (
    <View style={styles.scheduleTypeGrid}>
      {MEDICINE_SCHEDULE_TYPE_OPTIONS.map((option) => {
        const isParentSelected = option.isParent && isSelectedSubInterval;
        const selected = selectedScheduleType === option.value || isParentSelected;

        return (
          <View key={option.value} style={styles.optionContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose ${option.label} medicine schedule. ${option.caption || ''}`}
              accessibilityState={{ selected }}
              unstable_pressDelay={0}
              onPress={() => {
                if (option.isParent) {
                  if (isIntervalsExpanded) {
                    setIsIntervalsExpanded(false);
                    if (isSelectedSubInterval) {
                      onSelectScheduleType('');
                    }
                    return;
                  }

                  setIsIntervalsExpanded(true);
                  if (!isSelectedSubInterval) {
                    onSelectScheduleType(defaultIntervalType);
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
                      accessibilityLabel={`Choose ${subOption.label} interval schedule. ${subOption.caption || ''}`}
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
      {showChangeWarning ? (
        <View style={styles.scheduleTypeWarning}>
          <Ionicons name="warning-outline" size={18} color={colors.warning} />
          <Text style={styles.scheduleTypeWarningText}>
            This will remove all your {previousScheduleLabel} schedules.
          </Text>
        </View>
      ) : null}
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
  const isWeeklyInterval = selectedScheduleType === 'regular_weekly';
  const isEveryWeeksInterval = selectedScheduleType === 'regular_every_weeks';
  const isMonthlyInterval = selectedScheduleType === 'regular_monthly';
  const isIntervalSchedule = isHourly || isWeeklyInterval || isEveryWeeksInterval || isMonthlyInterval;
  const isAsNeeded = selectedScheduleType === 'asNeeded';
  const isWeekly = selectedScheduleType === 'weekly';
  const isMonthly = selectedScheduleType === 'monthly';
  const isDaily = selectedScheduleType === 'daily';
  const hasIntervalSchedule = scheduleEntries.some((entry) => entry.intervalMinutes || entry.intervalUnit === 'months');
  const selectedDailyTimes = Array.isArray(scheduleDraft.scheduledTimes)
    ? scheduleDraft.scheduledTimes.filter(Boolean).sort()
    : [];
  const hasDailyTimeDraft = String(scheduleDraft.scheduledTime || '').trim();
  const scheduleDraftTimes = Array.from(new Set([
    ...selectedDailyTimes,
    ...(hasDailyTimeDraft ? [scheduleDraft.scheduledTime] : []),
  ])).sort();
  const selectedWeeklyDays = Array.isArray(scheduleDraft.dayOfWeeks)
    ? scheduleDraft.dayOfWeeks.filter(Boolean).sort((left, right) => DAYS_OF_WEEK.indexOf(left) - DAYS_OF_WEEK.indexOf(right))
    : [];
  const hasWeeklyDayDraft = String(scheduleDraft.dayOfWeek || '').trim();
  const weeklyDraftDays = Array.from(new Set([
    ...selectedWeeklyDays,
    ...(hasWeeklyDayDraft ? [scheduleDraft.dayOfWeek] : []),
  ])).sort((left, right) => DAYS_OF_WEEK.indexOf(left) - DAYS_OF_WEEK.indexOf(right));
  const selectedMonthlyDays = Array.isArray(scheduleDraft.dayOfMonths)
    ? scheduleDraft.dayOfMonths.filter(Boolean).map(Number).sort((left, right) => left - right)
    : [];
  const monthlyDayDraft = parsePositiveCount(scheduleDraft.dayOfMonth);
  const monthlyDraftDays = Array.from(new Set([
    ...selectedMonthlyDays,
    ...(monthlyDayDraft ? [monthlyDayDraft] : []),
  ])).sort((left, right) => left - right);
  const intervalTotalMinutes = isWeeklyInterval
    ? parsePositiveCount(scheduleDraft.intervalDays) * 1440
    : isEveryWeeksInterval
    ? parsePositiveCount(scheduleDraft.intervalWeeks) * 10080
    : isMonthlyInterval
    ? 0
    : Number(scheduleDraft.intervalHours || 0) * 60 + Number(scheduleDraft.intervalMinutes || 0);
  const hasSelectedInterval = hasIntervalValue(scheduleDraft.intervalHours, scheduleDraft.intervalMinutes);
  const hasValidHourlyStartTime = !isHourly || (String(formState.startTime || '').trim() && !isPastTimeToday(formState.startDate, formState.startTime));
  const isScheduleDraftComplete = Boolean(
    String(scheduleDraft.doseSize || '').trim() &&
    (isAsNeeded
      ? true
      : isIntervalSchedule
      ? (isHourly ? hasSelectedInterval && intervalTotalMinutes > 0 && hasValidHourlyStartTime : true)
      : isDaily || isWeekly || isMonthly
      ? scheduleDraftTimes.length > 0
      : String(scheduleDraft.scheduledTime || '').trim()) &&
    (!isWeeklyInterval || parsePositiveCount(scheduleDraft.intervalDays) > 0) &&
    (!isEveryWeeksInterval || parsePositiveCount(scheduleDraft.intervalWeeks) > 0) &&
    (!isMonthlyInterval || (parsePositiveCount(scheduleDraft.intervalMonths) > 0 && scheduleDraft.dayOfMonth)) &&
    (!isWeekly || weeklyDraftDays.length > 0) &&
    (!isMonthly || (isMonthlyInterval ? scheduleDraft.dayOfMonth : monthlyDraftDays.length > 0)) &&
    (!isIntervalSchedule || !hasIntervalSchedule || scheduleEntries.length > 0)
  );

  const calculatedDailyAmount = isIntervalSchedule && scheduleDraft.doseSize && intervalTotalMinutes > 0
    ? Math.floor(1440 / intervalTotalMinutes) * Number(scheduleDraft.doseSize)
    : null;
  const hourlyScheduleSummary = isHourly && String(scheduleDraft.doseSize || '').trim() && intervalTotalMinutes > 0
    ? {
        dose: `${String(scheduleDraft.doseSize).trim()} ${getDoseUnitLabel(formState.unit)}`,
        interval: formatIntervalValue(scheduleDraft.intervalHours, scheduleDraft.intervalMinutes),
      }
    : null;
  const scheduleTimeSummary = (isDaily || isWeekly || isMonthly) &&
    String(scheduleDraft.doseSize || '').trim() &&
    scheduleDraftTimes.length &&
    (!isWeekly || weeklyDraftDays.length) &&
    (!isMonthly || monthlyDraftDays.length)
    ? `You will take ${String(scheduleDraft.doseSize).trim()} ${getDoseUnitLabel(formState.unit)} at ${scheduleDraftTimes.map(formatTimeForSummary).join(', ')}${
        isWeekly && weeklyDraftDays.length
          ? ` every ${weeklyDraftDays.join(', ')}`
          : isMonthly && monthlyDraftDays.length
          ? ` on day ${monthlyDraftDays.join(', ')} of each month`
          : ' each day'
      }.`
    : null;
  const canAddScheduleTime = (isDaily || isWeekly || isMonthly) && hasDailyTimeDraft && !selectedDailyTimes.includes(scheduleDraft.scheduledTime);
  const canAddWeeklyDay = isWeekly && hasWeeklyDayDraft && !selectedWeeklyDays.includes(scheduleDraft.dayOfWeek);
  const canAddMonthlyDay = isMonthly && !isMonthlyInterval && monthlyDayDraft && !selectedMonthlyDays.includes(monthlyDayDraft);
  const addScheduleTime = () => {
    if (!canAddScheduleTime) {
      return;
    }

    setScheduleDraft((current) => ({
      ...current,
      scheduledTime: '',
      scheduledTimes: Array.from(new Set([...(current.scheduledTimes || []), current.scheduledTime])).sort(),
    }));
  };
  const removeScheduleTime = (timeValue) => {
    setScheduleDraft((current) => ({
      ...current,
      scheduledTimes: (current.scheduledTimes || []).filter((item) => item !== timeValue),
    }));
  };
  const addWeeklyDay = () => {
    if (!canAddWeeklyDay) {
      return;
    }

    setScheduleDraft((current) => ({
      ...current,
      dayOfWeek: '',
      dayOfWeeks: Array.from(new Set([...(current.dayOfWeeks || []), current.dayOfWeek]))
        .sort((left, right) => DAYS_OF_WEEK.indexOf(left) - DAYS_OF_WEEK.indexOf(right)),
    }));
  };
  const removeWeeklyDay = (dayValue) => {
    setScheduleDraft((current) => ({
      ...current,
      dayOfWeeks: (current.dayOfWeeks || []).filter((item) => item !== dayValue),
    }));
  };
  const addMonthlyDay = () => {
    if (!canAddMonthlyDay) {
      return;
    }

    setScheduleDraft((current) => ({
      ...current,
      dayOfMonth: '',
      dayOfMonths: Array.from(new Set([...(current.dayOfMonths || []), Number(current.dayOfMonth)]))
        .sort((left, right) => left - right),
    }));
  };
  const removeMonthlyDay = (dayValue) => {
    setScheduleDraft((current) => ({
      ...current,
      dayOfMonths: (current.dayOfMonths || []).filter((item) => Number(item) !== Number(dayValue)),
    }));
  };

  return (
    <>
      <View style={styles.formColumn}>
        <NativeDateTimeField
          label="Start date"
          placeholder="Select start date"
          accessibilityLabel="Start date"
          value={formState.startDate}
          onChange={(value) => setFormState((current) => ({ ...current, startDate: value }))}
          minimumDate={startOfToday()}
        />
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

      {true ? (
        <View style={styles.scheduleBuilder}>
          <Text style={styles.sectionLabel}>
            {isIntervalSchedule && scheduleEntries.length > 0 ? 'Edit schedule' : 'Create a schedule'}
          </Text>

          <View style={styles.fieldPromptGroup}>
            <Text style={styles.fieldPromptLabel}>Dose</Text>
            <Text style={styles.fieldSubcaption}>
              {`How many ${getDoseUnitLabel(formState.unit)} of ${formState.medName || 'this medicine'} are you taking in this schedule?`}
            </Text>
          </View>
          <InputBar
            placeholder="Enter Dose"
            keyboardType="number-pad"
            value={scheduleDraft.doseSize}
            onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
          />

          {isHourly ? (
            <View style={styles.fieldWithPromptGroup}>
              <View style={styles.fieldPromptGroup}>
                <Text style={styles.fieldPromptLabel}>Start Time</Text>
                <Text style={styles.fieldSubcaption}>
                  {`At which time today do you want to start taking ${formState.medName || 'this medicine'}?`}
                </Text>
              </View>
              <NativeDateTimeField
                mode="time"
                placeholder="Select start time"
                accessibilityLabel="Start time"
                value={formState.startTime}
                onChange={(value) => setFormState((current) => ({ ...current, startTime: value }))}
                pickerDefaultValue={getNextHourOClock()}
                validateValue={(value) => (
                  isPastTimeToday(formState.startDate, value)
                    ? 'Start time cannot be in the past.'
                    : ''
                )}
              />
            </View>
          ) : null}

          {isWeekly && (
            <View style={styles.fieldWithPromptGroup}>
              <View style={styles.fieldPromptGroup}>
                <Text style={styles.fieldPromptLabel}>Day</Text>
                <Text style={styles.fieldSubcaption}>At which day of the week?</Text>
              </View>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerField}>
                  <NativeDateTimeField
                    mode="day"
                    placeholder="Select day"
                    accessibilityLabel="Day of week"
                    value={scheduleDraft.dayOfWeek}
                    onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfWeek: value }))}
                  />
                </View>
                <ActionButton
                  label="Add day"
                  variant="outline"
                  onPress={addWeeklyDay}
                  disabled={!canAddWeeklyDay}
                  style={styles.addTimeButton}
                  textStyle={styles.addTimeButtonText}
                  pressedStyle={styles.addTimeButtonPressed}
                  pressedTextStyle={styles.addTimeButtonPressedText}
                />
              </View>
              {selectedWeeklyDays.length ? (
                <View style={styles.selectedTimesWrap}>
                  {selectedWeeklyDays.map((dayValue) => (
                    <View key={dayValue} style={styles.selectedTimeChip}>
                      <Text style={styles.selectedTimeText}>{dayValue}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${dayValue}`}
                        onPress={() => removeWeeklyDay(dayValue)}
                        style={({ pressed }) => [
                          styles.selectedTimeRemove,
                          pressed && styles.selectedTimeRemovePressed,
                        ]}
                      >
                        <Ionicons name="close" size={14} color={colors.brandText} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {isMonthly && (
            <View style={styles.fieldWithPromptGroup}>
              <View style={styles.fieldPromptGroup}>
                <Text style={styles.fieldPromptLabel}>Day</Text>
                <Text style={styles.fieldSubcaption}>At which day of the month?</Text>
              </View>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerField}>
                  <NativeDateTimeField
                    mode="monthDay"
                    placeholder="Select day"
                    accessibilityLabel="Day of month"
                    value={scheduleDraft.dayOfMonth}
                    onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfMonth: value }))}
                  />
                </View>
                <ActionButton
                  label="Add day"
                  variant="outline"
                  onPress={addMonthlyDay}
                  disabled={!canAddMonthlyDay}
                  style={styles.addTimeButton}
                  textStyle={styles.addTimeButtonText}
                  pressedStyle={styles.addTimeButtonPressed}
                  pressedTextStyle={styles.addTimeButtonPressedText}
                />
              </View>
              {selectedMonthlyDays.length ? (
                <View style={styles.selectedTimesWrap}>
                  {selectedMonthlyDays.map((dayValue) => (
                    <View key={dayValue} style={styles.selectedTimeChip}>
                      <Text style={styles.selectedTimeText}>Day {dayValue}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove day ${dayValue}`}
                        onPress={() => removeMonthlyDay(dayValue)}
                        style={({ pressed }) => [
                          styles.selectedTimeRemove,
                          pressed && styles.selectedTimeRemovePressed,
                        ]}
                      >
                        <Ionicons name="close" size={14} color={colors.brandText} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {isHourly ? (
            <View style={styles.fieldWithPromptGroup}>
              <View style={styles.fieldPromptGroup}>
                <Text style={styles.fieldPromptLabel}>Time Period</Text>
                <Text style={styles.fieldSubcaption}>Every how much time?</Text>
              </View>
              <NativeDateTimeField
                mode="duration"
                placeholder="Select time period"
                accessibilityLabel="Time Period"
                value={hasSelectedInterval ? formatIntervalValue(scheduleDraft.intervalHours, scheduleDraft.intervalMinutes) : ''}
                pickerDefaultValue="01:00"
                onChange={(value) => {
                  const nextInterval = parseIntervalValue(value);
                  setScheduleDraft((current) => ({
                    ...current,
                    intervalHours: nextInterval.hours,
                    intervalMinutes: nextInterval.minutes,
                  }));
                }}
              />
            </View>
          ) : isWeeklyInterval ? (
            <>
              <Text style={styles.fieldSubcaption}>Repeat after how many days?</Text>
              <InputBar
                placeholder="Days"
                keyboardType="number-pad"
                value={scheduleDraft.intervalDays}
                onChangeText={(value) => setScheduleDraft((current) => ({
                  ...current,
                  intervalDays: value.replace(/[^0-9]/g, ''),
                }))}
              />
            </>
          ) : isEveryWeeksInterval ? (
            <>
              <Text style={styles.fieldSubcaption}>Repeat after how many weeks?</Text>
              <InputBar
                placeholder="Weeks"
                keyboardType="number-pad"
                value={scheduleDraft.intervalWeeks}
                onChangeText={(value) => setScheduleDraft((current) => ({
                  ...current,
                  intervalWeeks: value.replace(/[^0-9]/g, ''),
                }))}
              />
            </>
          ) : isMonthlyInterval ? (
            <>
              <Text style={styles.fieldSubcaption}>Repeat after how many months?</Text>
              <InputBar
                placeholder="Months"
                keyboardType="number-pad"
                value={scheduleDraft.intervalMonths}
                onChangeText={(value) => setScheduleDraft((current) => ({
                  ...current,
                  intervalMonths: value.replace(/[^0-9]/g, ''),
                }))}
              />
              <NativeDateTimeField
                mode="monthDay"
                label="Day"
                placeholder="Select day"
                accessibilityLabel="Day of month"
                value={scheduleDraft.dayOfMonth}
                onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfMonth: value }))}
              />
            </>
          ) : isAsNeeded ? (
            <Text style={styles.fieldSubcaption}>
              No time is needed. Mark this medicine when you take it.
            </Text>
          ) : isDaily || isWeekly || isMonthly ? (
            <View style={styles.fieldWithPromptGroup}>
              <View style={styles.fieldPromptGroup}>
                <Text style={styles.fieldPromptLabel}>Time</Text>
                <Text style={styles.fieldSubcaption}>At which time of the day?</Text>
              </View>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerField}>
                  <NativeDateTimeField
                    mode="time"
                    placeholder="Select time"
                    accessibilityLabel="Time"
                    value={scheduleDraft.scheduledTime}
                    onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
                  />
                </View>
                {isDaily || isWeekly || isMonthly ? (
                  <ActionButton
                    label="Add time"
                    variant="outline"
                    onPress={addScheduleTime}
                    disabled={!canAddScheduleTime}
                    style={styles.addTimeButton}
                    textStyle={styles.addTimeButtonText}
                    pressedStyle={styles.addTimeButtonPressed}
                    pressedTextStyle={styles.addTimeButtonPressedText}
                  />
                ) : null}
              </View>
              {selectedDailyTimes.length ? (
                <View style={styles.selectedTimesWrap}>
                  {selectedDailyTimes.map((timeValue) => (
                    <View key={timeValue} style={styles.selectedTimeChip}>
                      <Text style={styles.selectedTimeText}>{formatTimeForSummary(timeValue)}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${formatTimeForSummary(timeValue)}`}
                        onPress={() => removeScheduleTime(timeValue)}
                        style={({ pressed }) => [
                          styles.selectedTimeRemove,
                          pressed && styles.selectedTimeRemovePressed,
                        ]}
                      >
                        <Ionicons name="close" size={14} color={colors.brandText} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              {scheduleTimeSummary ? (
                <Text style={styles.dailyScheduleSummary}>{scheduleTimeSummary}</Text>
              ) : null}
            </View>
          ) : (
            <>
              <NativeDateTimeField
                mode="time"
                label="Time"
                placeholder="Select time"
                accessibilityLabel="Time"
                value={scheduleDraft.scheduledTime}
                onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
              />
              {dailyScheduleSummary ? (
                <Text style={styles.dailyScheduleSummary}>{dailyScheduleSummary}</Text>
              ) : null}
            </>
          )}

          {hourlyScheduleSummary ? (
            <Text style={styles.hourlyScheduleSummary}>
              {`You will take ${hourlyScheduleSummary.dose} every ${hourlyScheduleSummary.interval} hours.`}
            </Text>
          ) : null}

          <View style={styles.footerActionsRow}>
            <ActionButton
              label={isIntervalSchedule && scheduleEntries.length > 0 ? "Update schedule item" : "Add schedule item"}
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
          getSchedulesBySchedulePatternOrder(scheduleEntries).map(({ entry, index }) => {
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
                      {!isIntervalSchedule ? (
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
                            <Ionicons name="create-outline" size={18} color="#0077B6" />
                          </Pressable>
                          <Text style={[styles.iconActionLabel, { color: '#0077B6' }]}>Edit</Text>
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
                        isWeeklyInterval={isWeeklyInterval}
                        isEveryWeeksInterval={isEveryWeeksInterval}
                        isMonthlyInterval={isMonthlyInterval}
                        isAsNeeded={isAsNeeded}
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
    marginTop: 0,
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
  fieldWithPromptGroup: {
    gap: spacing.xs,
  },
  fieldPromptGroup: {
    gap: 2,
  },
  fieldPromptLabel: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
  },
  hourlyScheduleSummary: {
    ...typography.bodySmall,
    color: colors.brandText,
    textAlign: 'center',
  },
  dailyScheduleSummary: {
    ...typography.bodySmall,
    color: colors.brandText,
    textAlign: 'center',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  timePickerField: {
    flex: 1,
    minWidth: 0,
  },
  addTimeButton: {
    borderColor: '#0077B6',
    minWidth: 104,
    flexGrow: 0,
    flexShrink: 0,
  },
  addTimeButtonText: {
    color: '#0077B6',
  },
  addTimeButtonPressed: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0077B6',
  },
  addTimeButtonPressedText: {
    color: '#0077B6',
  },
  selectedTimesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectedTimeChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
  },
  selectedTimeText: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
  },
  selectedTimeRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeRemovePressed: {
    backgroundColor: '#C7DBFF',
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
  scheduleTypeWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scheduleTypeWarningText: {
    ...typography.bodySmall,
    color: colors.warning,
    fontWeight: '700',
    flex: 1,
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
