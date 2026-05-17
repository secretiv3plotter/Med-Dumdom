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
import { capitalize, startOfToday } from '../utils/medTrackerUtils';

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

function InlineScheduleEditor({ entry, index, isWeekly, onSave, onCancel }) {
  const [doseSize, setDoseSize] = useState(String(entry.doseSize));
  const [scheduledTime, setScheduledTime] = useState(entry.scheduledTime);
  const [dayOfWeek, setDayOfWeek] = useState(entry.dayOfWeek || '');
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
    setError('');
    const errMsg = onSave(index, { doseSize: trimmed, scheduledTime, dayOfWeek });
    if (errMsg) {
      setError(errMsg);
    }
  };

  return (
    <View style={styles.inlineEditorContainer}>
      <View style={styles.inlineInputsRow}>
        <View style={styles.inlineDoseCol}>
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
  const isSelectedSubInterval = ['regular_daily', 'regular_weekly', 'regular_monthly'].includes(selectedScheduleType);
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

      <View style={styles.scheduleBuilder}>
        <Text style={styles.sectionLabel}>Create a schedule</Text>

        <InputBar
          placeholder="Dose"
          keyboardType="number-pad"
          value={scheduleDraft.doseSize}
          onChangeText={(value) => setScheduleDraft((current) => ({ ...current, doseSize: value }))}
        />

        {Boolean(selectedScheduleType === 'weekly' || selectedScheduleType === 'regular_weekly') && (
          <NativeDateTimeField
            mode="day"
            label="Day of week"
            placeholder="Select day"
            accessibilityLabel="Day of week"
            value={scheduleDraft.dayOfWeek}
            onChange={(value) => setScheduleDraft((current) => ({ ...current, dayOfWeek: value }))}
          />
        )}

        <NativeDateTimeField
          mode="time"
          label="Time"
          placeholder="Select time"
          accessibilityLabel="Time"
          value={scheduleDraft.scheduledTime}
          onChange={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
        />

        <View style={styles.footerActionsRow}>
          <ActionButton
            label="Add schedule item"
            variant="solid"
            onPress={onSaveScheduleEntry}
          />
        </View>
      </View>

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
                    dayLabel={entry.dayOfWeek ? `on ${entry.dayOfWeek}` : ''}
                  />
                  {editingScheduleIndex === null ? (
                    <View style={styles.scheduleEditActions}>
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
                    isWeekly={selectedScheduleType === 'weekly' || selectedScheduleType === 'regular_weekly'}
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
