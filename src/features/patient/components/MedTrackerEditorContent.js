import { StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { ScheduleEntryText } from './MedTrackerDisplayComponents';
import { SegmentButton } from './MedTrackerScreenComponents';
import { capitalize, startOfToday } from '../utils/medTrackerUtils';

const MEAL_CONTEXT_OPTIONS = ['before', 'during', 'after'];
const ASSOCIATED_MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'];
const UNIT_OPTIONS = ['tablet', 'ml', 'units', 'custom'];

export function MedTrackerEditorContent({
  editorMode,
  formState,
  scheduleDraft,
  scheduleEntries,
  editingScheduleIndex,
  formError,
  setFormState,
  setScheduleDraft,
  onCancelScheduleEdit,
  onSaveScheduleEntry,
  onEditScheduleEntry,
  onDeleteScheduleEntry,
  onCancel,
  onSaveMedicine,
}) {
  return (
    <>
      <View style={styles.formColumn}>
        <InputBar
          placeholder="Name of the medicine"
          value={formState.medName}
          onChangeText={(value) => setFormState((current) => ({ ...current, medName: value }))}
        />
        <InputBar
          placeholder="Unit strength (optional)"
          value={formState.unitStrength}
          onChangeText={(value) => setFormState((current) => ({ ...current, unitStrength: value }))}
          accessibilityLabel="Unit strength"
        />
        <View style={styles.scheduleBuilder}>
          <Text style={styles.sectionLabel}>Unit</Text>
          <View style={styles.segmentRow}>
            {UNIT_OPTIONS.map((option) => (
              <SegmentButton
                key={option}
                label={option === 'custom' ? 'Custom' : option === 'ml' ? 'mL' : capitalize(option)}
                selected={
                  option === 'custom' ? !['tablet', 'ml', 'units'].includes(formState.unit) : formState.unit === option
                }
                onPress={() =>
                  setFormState((current) => ({
                    ...current,
                    unit: option === 'custom' ? '' : option,
                  }))
                }
              />
            ))}
          </View>
          {!['tablet', 'ml', 'units'].includes(formState.unit) ? (
            <InputBar
              placeholder="Custom unit"
              value={formState.unit}
              onChangeText={(value) => setFormState((current) => ({ ...current, unit: value }))}
            />
          ) : null}
        </View>
        <InputBar
          placeholder="Total daily amount"
          keyboardType="number-pad"
          value={formState.totalDailyAmount}
          onChangeText={(value) => setFormState((current) => ({ ...current, totalDailyAmount: value }))}
        />
        <NativeDateTimeField
          label="Start date"
          placeholder="Select start date"
          accessibilityLabel="Start date"
          value={formState.startDate}
          onChange={(value) => setFormState((current) => ({ ...current, startDate: value }))}
          minimumDate={editorMode === 'edit' ? undefined : startOfToday()}
        />
        <NativeDateTimeField
          label="End date"
          placeholder="Select end date"
          accessibilityLabel="End date"
          value={formState.endDate}
          onChange={(value) => setFormState((current) => ({ ...current, endDate: value }))}
          optional
        />
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

      <View style={styles.scheduleBuilder}>
        <Text style={styles.sectionLabel}>Daily schedule entry</Text>
        <View style={styles.segmentRow}>
          <SegmentButton
            label="Time"
            selected={scheduleDraft.scheduleType === 'time'}
            onPress={() => setScheduleDraft((current) => ({ ...current, scheduleType: 'time' }))}
          />
          <SegmentButton
            label="Meal"
            selected={scheduleDraft.scheduleType === 'meal'}
            onPress={() => setScheduleDraft((current) => ({ ...current, scheduleType: 'meal' }))}
          />
        </View>

        <InputBar
          placeholder="Dose size"
          keyboardType="number-pad"
          value={scheduleDraft.doseSize}
          onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
        />

        {scheduleDraft.scheduleType === 'time' ? (
          <NativeDateTimeField
            mode="time"
            label="Scheduled time"
            placeholder="Select scheduled time"
            accessibilityLabel="Scheduled time"
            value={scheduleDraft.scheduledTime}
            onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
          />
        ) : (
          <>
            <View style={styles.segmentRow}>
              {MEAL_CONTEXT_OPTIONS.map((option) => (
                <SegmentButton
                  key={option}
                  label={capitalize(option)}
                  selected={scheduleDraft.mealContext === option}
                  onPress={() => setScheduleDraft((current) => ({ ...current, mealContext: option }))}
                />
              ))}
            </View>

            <View style={styles.segmentRow}>
              {ASSOCIATED_MEAL_OPTIONS.map((option) => (
                <SegmentButton
                  key={option}
                  label={capitalize(option)}
                  selected={scheduleDraft.associatedMeal === option}
                  onPress={() => setScheduleDraft((current) => ({ ...current, associatedMeal: option }))}
                />
              ))}
            </View>

            <NativeDateTimeField
              mode="time"
              label="Meal time"
              placeholder="Select meal time"
              accessibilityLabel="Meal time"
              value={scheduleDraft.mealTime}
              onChange={(value) => setScheduleDraft((current) => ({ ...current, mealTime: value }))}
            />
          </>
        )}

        <View style={styles.footerActionsRow}>
          {editingScheduleIndex !== null ? (
            <ActionButton label="Cancel edit" variant="outline" onPress={onCancelScheduleEdit} />
          ) : null}
          <ActionButton
            label={editingScheduleIndex === null ? 'Add schedule item' : 'Update schedule item'}
            variant="solid"
            onPress={onSaveScheduleEntry}
          />
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Added schedule items</Text>
        {scheduleEntries.length ? (
          scheduleEntries.map((entry, index) => (
            <View key={`${editorMode || 'create'}-schedule-${index}`} style={styles.scheduleCard}>
              <View style={styles.scheduleCardRow}>
                <ScheduleEntryText entry={entry} unit={formState.unit} />
                <View style={styles.scheduleEditActions}>
                  <EditButton onPress={() => onEditScheduleEntry(index)} />
                  <DeleteButton onPress={() => onDeleteScheduleEntry(index)} />
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyScheduleText}>No schedule items added yet.</Text>
        )}
      </View>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <View style={styles.footerActionsRow}>
        <ActionButton label="Cancel" variant="outline" onPress={onCancel} />
        <ActionButton
          label={editorMode === 'edit' ? 'Save Medicine' : 'Add Medicine'}
          variant="solid"
          onPress={onSaveMedicine}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formColumn: {
    gap: spacing.sm,
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scheduleBuilder: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  scheduleSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
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
    gap: spacing.sm,
  },
  emptyScheduleText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
});
