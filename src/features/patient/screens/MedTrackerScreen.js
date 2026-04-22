import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import medTrackerService from '../../../domain/services/MedTrackerService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';
const TOP_OVERLAY_HEIGHT = moderateScale(170);

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const EMPTY_FORM = {
  medName: '',
  unitStrength: '',
  unit: '',
  totalDailyAmount: '',
  startDate: '',
  endDate: '',
  instructions: '',
  inventoryCount: '',
  prescriberContact: '',
};

const EMPTY_SCHEDULE_DRAFT = {
  scheduleType: 'time',
  doseSize: '',
  scheduledTime: '',
  mealContext: 'before',
  associatedMeal: 'breakfast',
  mealTime: '',
};

const MEAL_CONTEXT_OPTIONS = ['before', 'during', 'after'];
const ASSOCIATED_MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'];
const UNIT_OPTIONS = ['tablet', 'ml', 'units', 'custom'];

const capitalize = (value) => String(value || '')
  .trim()
  .replace(/^\w/, (char) => char.toUpperCase());

const parseDateInput = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return '--';
  }

  return text;
};

const normalizeTimeInput = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return '';
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase() ?? null;

  if (minutes < 0 || minutes > 59) {
    return '';
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return '';
    }

    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    return '';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parsePositiveInteger = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
};

const parseNonNegativeInteger = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric < 0) {
    return null;
  }

  return numeric;
};

const formatDoseWithUnit = (doseSize, unit) => {
  const normalizedUnit = String(unit || '').trim();
  return normalizedUnit ? `${doseSize} ${normalizedUnit}` : String(doseSize);
};

const formatScheduleEntry = (entry, unit = '') => {
  if (entry.scheduleType === 'meal') {
    return `${capitalize(entry.mealContext)} ${capitalize(entry.associatedMeal)} at ${formatTime(entry.mealTime)} - ${formatDoseWithUnit(entry.doseSize, unit)}`;
  }

  return `${formatTime(entry.scheduledTime)} - ${formatDoseWithUnit(entry.doseSize, unit)}`;
};

const buildFormStateFromMedicine = (medicine) => ({
  medName: medicine.medName || '',
  unitStrength: medicine.unitStrength || '',
  unit: medicine.unit || '',
  totalDailyAmount: medicine.totalDailyAmount ? String(medicine.totalDailyAmount) : '',
  startDate: medicine.startDate ? medicine.startDate.toISOString().slice(0, 10) : '',
  endDate: medicine.endDate ? medicine.endDate.toISOString().slice(0, 10) : '',
  instructions: medicine.instructions || '',
  inventoryCount:
    medicine.inventoryCount === undefined || medicine.inventoryCount === null
      ? ''
      : String(medicine.inventoryCount),
  prescriberContact: medicine.prescriberContact || '',
});

const buildScheduleEntriesFromMedicine = (medicine) =>
  Array.isArray(medicine.dailySched)
    ? medicine.dailySched.map((entry) => ({ ...entry }))
    : [];

const getStatus = (entry) => {
  if (entry.isTaken) {
    return { label: 'Taken', bgColor: '#E9F8EF', textColor: colors.success };
  }

  if (entry.isDue(new Date(), new Date())) {
    return { label: 'Due now', bgColor: '#FDECEC', textColor: colors.error };
  }

  return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
};

const sumDoseSizes = (scheduleEntries) =>
  scheduleEntries.reduce((total, entry) => total + Number(entry.doseSize || 0), 0);

export default function MedTrackerScreen({ navigation }) {
  const [version, setVersion] = useState(0);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [scheduleDraft, setScheduleDraft] = useState(EMPTY_SCHEDULE_DRAFT);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [formError, setFormError] = useState('');

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const medicines = useMemo(() => medTrackerService.listMedEntries(CURRENT_USER_ID), [version]);

  const selectedMedicine = useMemo(
    () => medicines.find((medicine) => medicine.medEntryId === selectedMedicineId) || null,
    [medicines, selectedMedicineId]
  );

  const sortedMedicines = useMemo(() => {
    return [...medicines].sort((left, right) => {
      if (left.isTaken !== right.isTaken) {
        return left.isTaken ? 1 : -1;
      }

      return left.medName.localeCompare(right.medName);
    });
  }, [medicines]);

  const refresh = () => setVersion((current) => current + 1);

  const resetEditor = () => {
    setEditorMode(null);
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
  };

  const openCreateEditor = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setScheduleEntries([]);
    setIsDetailsVisible(false);
    setEditorMode('create');
  };

  const openEditEditor = () => {
    if (!selectedMedicine) {
      return;
    }

    setFormError('');
    setFormState(buildFormStateFromMedicine(selectedMedicine));
    setScheduleEntries(buildScheduleEntriesFromMedicine(selectedMedicine));
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
    setIsDetailsVisible(false);
    setEditorMode('edit');
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const handleDeleteMedicine = () => {
    if (!selectedMedicine) {
      return;
    }

    medTrackerService.softDeleteMedEntry(CURRENT_USER_ID, selectedMedicine.medEntryId);
    setIsDetailsVisible(false);
    setSelectedMedicineId(null);
    refresh();
  };

  const handleToggleTaken = (nextValue) => {
    if (!selectedMedicine) {
      return;
    }

    if (nextValue) {
      medTrackerService.markMedTaken(CURRENT_USER_ID, selectedMedicine.medEntryId, new Date());
    } else {
      medTrackerService.undoMedTaken(CURRENT_USER_ID, selectedMedicine.medEntryId);
    }

    refresh();
  };

  const addScheduleEntry = () => {
    const doseSize = parsePositiveInteger(scheduleDraft.doseSize);
    if (!doseSize) {
      setFormError('Enter a valid dose size for the schedule item.');
      return;
    }

    if (scheduleDraft.scheduleType === 'meal') {
      const mealTime = normalizeTimeInput(scheduleDraft.mealTime);
      if (!mealTime || !scheduleDraft.mealContext || !scheduleDraft.associatedMeal) {
        setFormError('Fill in meal context, associated meal, and meal time.');
        return;
      }

      setScheduleEntries((current) => [
        ...current,
        {
          scheduleType: 'meal',
          doseSize,
          mealContext: scheduleDraft.mealContext,
          associatedMeal: scheduleDraft.associatedMeal,
          mealTime,
        },
      ]);
    } else {
      const scheduledTime = normalizeTimeInput(scheduleDraft.scheduledTime);
      if (!scheduledTime) {
        setFormError('Enter a valid scheduled time.');
        return;
      }

      setScheduleEntries((current) => [
        ...current,
        {
          scheduleType: 'time',
          doseSize,
          scheduledTime,
        },
      ]);
    }

    setFormError('');
    setScheduleDraft(EMPTY_SCHEDULE_DRAFT);
  };

  const removeScheduleEntry = (indexToRemove) => {
    setScheduleEntries((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const saveMedicine = () => {
    const medName = formState.medName.trim();
    const unitStrength = formState.unitStrength.trim();
    const unit = formState.unit.trim();
    const totalDailyAmount = parsePositiveInteger(formState.totalDailyAmount);
    const startDate = parseDateInput(formState.startDate);
    const endDateText = formState.endDate.trim();
    const endDate = endDateText ? parseDateInput(endDateText) : null;
    const instructions = formState.instructions.trim();
    const inventoryCountText = formState.inventoryCount.trim();
    const inventoryCount = inventoryCountText ? parseNonNegativeInteger(inventoryCountText) : null;
    const prescriberContact = formState.prescriberContact.trim();

    if (!medName || !unitStrength || !unit || !totalDailyAmount || !startDate) {
      setFormError('Complete the required medication fields.');
      return;
    }

    if (endDateText && !endDate) {
      setFormError('Use YYYY-MM-DD for the end date.');
      return;
    }

    if (inventoryCountText && inventoryCount === null) {
      setFormError('Inventory count must be a whole number.');
      return;
    }

    if (!scheduleEntries.length) {
      setFormError('Add at least one schedule item.');
      return;
    }

    if (sumDoseSizes(scheduleEntries) !== totalDailyAmount) {
      setFormError('Total daily amount must match the sum of the schedule dose sizes.');
      return;
    }

    const payload = {
      medName,
      unitStrength,
      unit,
      totalDailyAmount,
      dailySched: scheduleEntries,
      startDate,
      endDate,
      instructions,
      inventoryCount,
      prescriberContact,
    };

    if (editorMode === 'edit' && selectedMedicine) {
      medTrackerService.updateMedEntry(CURRENT_USER_ID, selectedMedicine.medEntryId, payload);
    } else {
      medTrackerService.addMedEntry(CURRENT_USER_ID, payload);
    }

    resetEditor();
    setSelectedMedicineId(null);
    refresh();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Med Tracker</Text>
            <Text style={styles.subtitle}>Track daily strengths, schedules, and inventory in one place.</Text>
          </View>
          <AddButton onPress={openCreateEditor} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listSection}>
          {sortedMedicines.map((medicine) => {
            const status = getStatus(medicine);
            const isSelected = medicine.medEntryId === selectedMedicineId;

            return (
              <ClickableCard
                key={medicine.medEntryId}
                size="landscape"
                variant="solid"
                onPress={() => {
                  setSelectedMedicineId(medicine.medEntryId);
                  setIsDetailsVisible(true);
                }}
                cardStyle={[styles.medicineCard, isSelected && styles.selectedMedicineCard]}
                contentStyle={styles.medicineCardContent}
                leftSlot={
                  <View style={styles.cardHeaderBlock}>
                    <Text style={styles.cardHeaderName} numberOfLines={1}>
                      {medicine.medName}
                    </Text>
                    <Text style={styles.cardHeaderMeta} numberOfLines={1}>
                      {`${medicine.unitStrength} • ${medicine.totalDailyAmount} ${medicine.unit} per day`}
                    </Text>
                    <View style={styles.schedulePreviewList}>
                      {medicine.dailySched.map((entry, index) => (
                        <Text
                          key={`${medicine.medEntryId}-preview-schedule-${index}`}
                          style={styles.schedulePreviewText}
                          numberOfLines={1}
                        >
                          {formatScheduleEntry(entry, medicine.unit)}
                        </Text>
                      ))}
                    </View>
                  </View>
                }
                rightSlot={
                  <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
                  </View>
                }
              />
            );
          })}
        </View>
      </ScrollView>

      <LargePopup
        visible={isDetailsVisible && Boolean(selectedMedicine)}
        onClose={() => {
          setIsDetailsVisible(false);
        }}
        header={
          selectedMedicine ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Medicine Details</Text>
                <Text style={styles.detailsMedicineName}>{selectedMedicine.medName}</Text>
              </View>
              <View style={styles.detailActionsTop}>
                <EditButton onPress={openEditEditor} />
                <DeleteButton onPress={handleDeleteMedicine} />
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
      >
        {selectedMedicine ? (
          <>
            <DetailItem label="Medication name" value={selectedMedicine.medName} />
            <DetailItem label="Unit strength" value={selectedMedicine.unitStrength} />
            <DetailItem label="Total daily amount" value={`${selectedMedicine.totalDailyAmount} ${selectedMedicine.unit}`} />
            <DetailItem label="Start date" value={formatDate(selectedMedicine.startDate)} />
            <DetailItem label="End date" value={selectedMedicine.endDate ? formatDate(selectedMedicine.endDate) : 'Indefinite'} />
            <DetailItem label="Instructions" value={selectedMedicine.instructions || '--'} />
            <DetailItem
              label="Inventory count"
              value={selectedMedicine.inventoryCount === null ? '--' : String(selectedMedicine.inventoryCount)}
            />
            <DetailItem label="Prescriber contact" value={selectedMedicine.prescriberContact || '--'} />

            <View style={styles.scheduleSection}>
              <Text style={styles.sectionLabel}>Daily schedule</Text>
              {selectedMedicine.dailySched.map((entry, index) => (
                <View key={`${selectedMedicine.medEntryId}-schedule-${index}`} style={styles.scheduleCard}>
                  <Text style={styles.scheduleCardTitle}>
                    {formatScheduleEntry(entry, selectedMedicine.unit)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.detailLabel}>Mark as taken</Text>
              <ToggleButton
                value={Boolean(selectedMedicine.isTaken)}
                onChange={handleToggleTaken}
                size={30}
              />
            </View>

            <DetailItem label="Time taken" value={selectedMedicine.timeTaken || '--'} />
            <DetailItem label="Date taken" value={formatDate(selectedMedicine.dateTaken)} />

            <View style={styles.footerActionsRow}>
              <ActionButton
                label="Close"
                variant="outline"
                onPress={() => {
                  setIsDetailsVisible(false);
                }}
              />
            </View>
          </>
        ) : null}
      </LargePopup>

      <LargePopup
        visible={editorMode === 'create' || editorMode === 'edit'}
        onClose={resetEditor}
        header={
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>{editorMode === 'edit' ? 'Edit Medicine' : 'Add Medicine'}</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.formColumn}>
          <InputBar
            placeholder="Name of the medicine"
            value={formState.medName}
            onChangeText={(value) => setFormState((current) => ({ ...current, medName: value }))}
          />
          <InputBar
            placeholder="Unit strength (e.g. 500 mg)"
            value={formState.unitStrength}
            onChangeText={(value) => setFormState((current) => ({ ...current, unitStrength: value }))}
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
          <InputBar
            placeholder="Start date (YYYY-MM-DD)"
            value={formState.startDate}
            onChangeText={(value) => setFormState((current) => ({ ...current, startDate: value }))}
          />
          <InputBar
            placeholder="End date (optional, YYYY-MM-DD)"
            value={formState.endDate}
            onChangeText={(value) => setFormState((current) => ({ ...current, endDate: value }))}
          />
          <InputBar
            placeholder="Instructions (optional)"
            value={formState.instructions}
            onChangeText={(value) => setFormState((current) => ({ ...current, instructions: value }))}
          />
          <InputBar
            placeholder="Inventory count (optional)"
            keyboardType="number-pad"
            value={formState.inventoryCount}
            onChangeText={(value) => setFormState((current) => ({ ...current, inventoryCount: value }))}
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
            <InputBar
              placeholder="Scheduled time (e.g. 08:00 or 8:00 AM)"
              value={scheduleDraft.scheduledTime}
              onChangeText={(value) => setScheduleDraft((current) => ({ ...current, scheduledTime: value }))}
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

              <InputBar
                placeholder="Meal time (e.g. 08:00)"
                value={scheduleDraft.mealTime}
                onChangeText={(value) => setScheduleDraft((current) => ({ ...current, mealTime: value }))}
              />
            </>
          )}

          <View style={styles.footerActionsRow}>
            <ActionButton label="Add schedule item" variant="solid" onPress={addScheduleEntry} />
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.sectionLabel}>Added schedule items</Text>
          {scheduleEntries.length ? (
            scheduleEntries.map((entry, index) => (
              <View key={`${editorMode || 'create'}-schedule-${index}`} style={styles.scheduleCard}>
                <View style={styles.scheduleCardRow}>
                  <Text style={styles.scheduleCardTitle}>
                    {formatScheduleEntry(entry, formState.unit)}
                  </Text>
                  <DeleteButton onPress={() => removeScheduleEntry(index)} />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyScheduleText}>No schedule items added yet.</Text>
          )}
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.footerActionsRow}>
          <ActionButton label="Cancel" variant="outline" onPress={resetEditor} />
          <ActionButton
            label={editorMode === 'edit' ? 'Save Medicine' : 'Add Medicine'}
            variant="solid"
            onPress={saveMedicine}
          />
        </View>
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="med" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SegmentButton({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: TOP_OVERLAY_HEIGHT,
    paddingBottom: 150,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  listSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  medicineCard: {
    minHeight: moderateScale(108),
  },
  selectedMedicineCard: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  medicineCardContent: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  cardHeaderName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
  },
  cardHeaderBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
    paddingRight: spacing.sm,
  },
  cardHeaderMeta: {
    ...typography.bodySmall,
    color: colors.body,
  },
  schedulePreviewList: {
    gap: spacing.xxs,
    paddingTop: spacing.xxs,
  },
  schedulePreviewText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  detailsTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.title,
  },
  detailsHeaderRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    minHeight: moderateScale(72),
    paddingRight: 140,
  },
  detailsHeaderTextBlock: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  detailsMedicineName: {
    ...typography.body,
    color: colors.body,
    fontWeight: '600',
  },
  detailRow: {
    gap: spacing.xxs,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  detailValue: {
    ...typography.body,
    color: colors.body,
  },
  detailActionsTop: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formColumn: {
    gap: spacing.sm,
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  stickyTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: TOP_OVERLAY_HEIGHT,
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
  scheduleCardTitle: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
    flex: 1,
  },
  emptyScheduleText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  toggleRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  segmentButton: {
    minHeight: moderateScale(40),
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  segmentButtonText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
  },
  segmentButtonTextSelected: {
    color: colors.brandText,
  },
});
