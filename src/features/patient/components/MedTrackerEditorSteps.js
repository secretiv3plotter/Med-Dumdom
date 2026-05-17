import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { ScheduleEntryText } from './MedTrackerDisplayComponents';
import { SegmentButton } from './MedTrackerScreenComponents';
import { MEDICINE_SCHEDULE_TYPE_OPTIONS } from '../constants/medTrackerEditorSteps';
import { capitalize, startOfToday } from '../utils/medTrackerUtils';

const UNIT_OPTIONS = ['tablet', 'ml', 'units', 'custom'];

export function MedicineDetailsStep({ formState, setFormState }) {
  return (
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
  return (
    <View style={styles.scheduleTypeGrid}>
      {MEDICINE_SCHEDULE_TYPE_OPTIONS.map((option) => {
        const selected = selectedScheduleType === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            unstable_pressDelay={0}
            onPress={() => onSelectScheduleType(option.value)}
            style={({ pressed }) => [
              styles.scheduleTypeCard,
              selected && styles.scheduleTypeCardSelected,
              pressed && styles.pressedCard,
            ]}
          >
            <Text style={[styles.scheduleTypeLabel, selected && styles.scheduleTypeLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MedicineScheduleStep({
  editorMode,
  formState,
  scheduleDraft,
  scheduleEntries,
  editingScheduleIndex,
  setFormState,
  setScheduleDraft,
  onCancelScheduleEdit,
  onSaveScheduleEntry,
  onEditScheduleEntry,
  onDeleteScheduleEntry,
}) {
  return (
    <>
      <View style={styles.formColumn}>
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
      </View>

      <View style={styles.scheduleBuilder}>
        <Text style={styles.sectionLabel}>Daily schedule entry</Text>

        <InputBar
          placeholder="Dose size"
          keyboardType="number-pad"
          value={scheduleDraft.doseSize}
          onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
        />

        <NativeDateTimeField
          mode="time"
          label="Scheduled time"
          placeholder="Select scheduled time"
          accessibilityLabel="Scheduled time"
          value={scheduleDraft.scheduledTime}
          onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
        />

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
});
