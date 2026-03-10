import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import ClickableCard from '../components/common/ClickableCard';
import { AddButton, DeleteButton, EditButton } from '../components/common/CrudButton';
import InputBar from '../components/common/InputBar';
import LargePopup from '../components/common/LargePopup';
import NavigationBar from '../components/common/NavigationBar';
import ToggleButton from '../components/common/ToggleButton';
import { ROUTES } from '../constants/routes';
import { colors, spacing, typography } from '../constants/Themes';

const TOP_OVERLAY_HEIGHT = 130;

const INITIAL_MEDICINES = [
  {
    id: 'med-1',
    name: 'Metformin',
    dosage: '500 mg',
    amount: '30 tablets',
    dailySched: '8:00 AM, 8:00 PM',
    startDate: 'Mar 1, 2026',
    endDate: 'Mar 31, 2026',
    isDue: true,
    takenAt: null,
  },
  {
    id: 'med-2',
    name: 'Losartan',
    dosage: '50 mg',
    amount: '30 tablets',
    dailySched: '7:00 AM',
    startDate: 'Mar 5, 2026',
    endDate: 'Apr 5, 2026',
    isDue: false,
    takenAt: null,
  },
  {
    id: 'med-3',
    name: 'Atorvastatin',
    dosage: '20 mg',
    amount: '15 tablets',
    dailySched: '9:00 PM',
    startDate: 'Mar 2, 2026',
    endDate: 'Mar 17, 2026',
    isDue: false,
    takenAt: '2026-03-09T21:03:00.000Z',
  },
];

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function MedTracker({ navigation }) {
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [selectedMedicineId, setSelectedMedicineId] = useState(INITIAL_MEDICINES[0]?.id || null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    dosage: '',
    amount: '',
    dailySched: '',
    startDate: '',
    endDate: '',
  });
  const [formError, setFormError] = useState('');
  const [draftDetails, setDraftDetails] = useState({
    name: '',
    dosage: '',
    amount: '',
    dailySched: '',
    startDate: '',
    endDate: '',
  });

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const selectedMedicine = useMemo(
    () => medicines.find((medicine) => medicine.id === selectedMedicineId) || null,
    [medicines, selectedMedicineId]
  );

  useEffect(() => {
    if (!selectedMedicine) {
      return;
    }

    setDraftDetails({
      name: selectedMedicine.name,
      dosage: selectedMedicine.dosage,
      amount: selectedMedicine.amount,
      dailySched: selectedMedicine.dailySched,
      startDate: selectedMedicine.startDate,
      endDate: selectedMedicine.endDate,
    });
  }, [selectedMedicine]);
  const sortedMedicines = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const getNextScheduleTimestamp = (dailySched) => {
      const scheduleParts = String(dailySched || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

      if (!scheduleParts.length) {
        return Number.MAX_SAFE_INTEGER;
      }

      const possibleTimes = [];

      for (const part of scheduleParts) {
        const parsed = parseTimeString(part);
        if (!parsed) {
          continue;
        }

        const todayTime = new Date(todayStart);
        todayTime.setHours(parsed.hours, parsed.minutes, 0, 0);
        possibleTimes.push(todayTime.getTime());

        const tomorrowTime = new Date(todayTime);
        tomorrowTime.setDate(tomorrowTime.getDate() + 1);
        possibleTimes.push(tomorrowTime.getTime());
      }

      if (!possibleTimes.length) {
        return Number.MAX_SAFE_INTEGER;
      }

      const upcoming = possibleTimes
        .filter((timeMs) => timeMs >= now.getTime())
        .sort((a, b) => a - b);

      return upcoming[0] ?? Math.min(...possibleTimes);
    };

    return [...medicines].sort((a, b) => {
      const aNext = getNextScheduleTimestamp(a.dailySched);
      const bNext = getNextScheduleTimestamp(b.dailySched);
      return aNext - bNext;
    });
  }, [medicines]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const getMedicineStatus = (medicine) => {
    if (medicine.takenAt) {
      return { label: 'Taken', bgColor: '#E9F8EF', textColor: colors.success };
    }

    if (medicine.isDue) {
      return { label: 'Due now', bgColor: '#FDECEC', textColor: colors.error };
    }

    return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
  };

  const handleAddMedicine = () => {
    setFormError('');
    setFormState({
      name: '',
      dosage: '',
      amount: '',
      dailySched: '',
      startDate: '',
      endDate: '',
    });
    setEditorMode('create');
  };

  const handleToggleTaken = (nextValue) => {
    if (!selectedMedicine) {
      return;
    }

    setMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === selectedMedicine.id
          ? {
              ...medicine,
              takenAt: nextValue ? new Date().toISOString() : null,
              isDue: !nextValue,
            }
          : medicine
      )
    );
  };

  const handleEditMedicine = () => {
    if (!selectedMedicine) {
      return;
    }
    setIsEditingDetails(true);
  };

  const handleDeleteMedicine = () => {
    if (!selectedMedicine) {
      return;
    }

    setMedicines((prev) => {
      const nextMedicines = prev.filter((medicine) => medicine.id !== selectedMedicine.id);
      setSelectedMedicineId(nextMedicines[0]?.id || null);
      return nextMedicines;
    });
    setIsEditingDetails(false);
    setIsDetailsVisible(false);
  };

  const handleSaveDetails = () => {
    if (!selectedMedicine) {
      return;
    }

    setMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === selectedMedicine.id
          ? {
              ...medicine,
              name: draftDetails.name.trim() || medicine.name,
              dosage: draftDetails.dosage.trim() || medicine.dosage,
              amount: draftDetails.amount.trim() || medicine.amount,
              dailySched: draftDetails.dailySched.trim() || medicine.dailySched,
              startDate: draftDetails.startDate.trim() || medicine.startDate,
              endDate: draftDetails.endDate.trim() || medicine.endDate,
            }
          : medicine
      )
    );
    setIsEditingDetails(false);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setFormError('');
  };

  const saveMedicine = () => {
    const requiredFields = [
      formState.name.trim(),
      formState.dosage.trim(),
      formState.amount.trim(),
      formState.dailySched.trim(),
    ];

    if (requiredFields.some((field) => !field)) {
      setFormError('Complete all required medicine fields.');
      return;
    }

    const newMedicine = {
      id: `med-${Date.now()}`,
      name: formState.name.trim(),
      dosage: formState.dosage.trim(),
      amount: formState.amount.trim(),
      dailySched: formState.dailySched.trim(),
      startDate: formState.startDate.trim() || 'Mar 10, 2026',
      endDate: formState.endDate.trim() || 'Mar 24, 2026',
      isDue: true,
      takenAt: null,
    };

    setMedicines((prev) => [newMedicine, ...prev]);
    setSelectedMedicineId(newMedicine.id);
    closeEditor();
  };

  const handleCancelEdit = () => {
    if (selectedMedicine) {
      setDraftDetails({
        name: selectedMedicine.name,
        dosage: selectedMedicine.dosage,
        amount: selectedMedicine.amount,
        dailySched: selectedMedicine.dailySched,
        startDate: selectedMedicine.startDate,
        endDate: selectedMedicine.endDate,
      });
    }
    setIsEditingDetails(false);
  };

  const formatTakenDate = (isoString) => {
    if (!isoString) {
      return '--';
    }

    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTakenTime = (isoString) => {
    if (!isoString) {
      return '--';
    }

    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
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
            <Text style={styles.subtitle}>Tap a medicine to view complete details.</Text>
          </View>
          <AddButton onPress={handleAddMedicine} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.listSection}>
          {sortedMedicines.map((medicine) => {
            const status = getMedicineStatus(medicine);
            const isSelected = medicine.id === selectedMedicineId;

            return (
              <ClickableCard
                key={medicine.id}
                size="landscape"
                variant="solid"
                onPress={() => {
                  setSelectedMedicineId(medicine.id);
                  setIsDetailsVisible(true);
                }}
                cardStyle={[styles.medicineCard, isSelected && styles.selectedMedicineCard]}
                contentStyle={styles.medicineCardContent}
                leftSlot={
                  <View style={styles.cardHeaderBlock}>
                    <Text style={styles.cardHeaderName} numberOfLines={1}>
                      {medicine.name}
                    </Text>
                    <Text style={styles.cardHeaderMeta} numberOfLines={1}>
                      {`${medicine.dosage} - ${medicine.amount}`}
                    </Text>
                    <Text style={styles.cardHeaderMeta} numberOfLines={1}>
                      {`Daily: ${medicine.dailySched}`}
                    </Text>
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
          setIsEditingDetails(false);
          setIsDetailsVisible(false);
        }}
        header={
          selectedMedicine ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Medicine Details</Text>
                <Text style={styles.detailsMedicineName}>{selectedMedicine.name}</Text>
              </View>
              <View style={styles.detailActionsTop}>
                <EditButton onPress={handleEditMedicine} />
                <DeleteButton onPress={handleDeleteMedicine} />
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
      >
        {selectedMedicine ? (
          <>
            <EditableDetailItem
              label="Name of the medicine"
              value={isEditingDetails ? draftDetails.name : selectedMedicine.name}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, name: text }))}
            />
            <EditableDetailItem
              label="Dosage"
              value={isEditingDetails ? draftDetails.dosage : selectedMedicine.dosage}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, dosage: text }))}
            />
            <EditableDetailItem
              label="Amount"
              value={isEditingDetails ? draftDetails.amount : selectedMedicine.amount}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, amount: text }))}
            />
            <EditableDetailItem
              label="Daily schedule"
              value={isEditingDetails ? draftDetails.dailySched : selectedMedicine.dailySched}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, dailySched: text }))}
            />
            <EditableDetailItem
              label="Start date"
              value={isEditingDetails ? draftDetails.startDate : selectedMedicine.startDate}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, startDate: text }))}
            />
            <EditableDetailItem
              label="End date"
              value={isEditingDetails ? draftDetails.endDate : selectedMedicine.endDate}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, endDate: text }))}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.detailLabel}>Mark as taken</Text>
              <ToggleButton
                value={Boolean(selectedMedicine.takenAt)}
                onChange={handleToggleTaken}
                size={30}
              />
            </View>

            <DetailItem label="Time taken" value={formatTakenTime(selectedMedicine.takenAt)} />
            <DetailItem label="Date taken" value={formatTakenDate(selectedMedicine.takenAt)} />

            <View style={styles.footerActionsRow}>
              {isEditingDetails ? (
                <>
                  <ActionButton label="Cancel" variant="outline" onPress={handleCancelEdit} />
                  <ActionButton label="Save" variant="solid" onPress={handleSaveDetails} />
                </>
              ) : (
                <ActionButton
                  label="Close"
                  variant="outline"
                  onPress={() => {
                    setIsEditingDetails(false);
                    setIsDetailsVisible(false);
                  }}
                />
              )}
            </View>
          </>
        ) : null}
      </LargePopup>

      <LargePopup
        visible={editorMode === 'create'}
        onClose={closeEditor}
        header={
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>Add Medicine</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.formColumn}>
          <InputBar
            placeholder="Name of the medicine"
            value={formState.name}
            onChangeText={(value) => setFormState((current) => ({ ...current, name: value }))}
          />
          <InputBar
            placeholder="Dosage"
            value={formState.dosage}
            onChangeText={(value) => setFormState((current) => ({ ...current, dosage: value }))}
          />
          <InputBar
            placeholder="Amount"
            value={formState.amount}
            onChangeText={(value) => setFormState((current) => ({ ...current, amount: value }))}
          />
          <InputBar
            placeholder="Daily schedule"
            value={formState.dailySched}
            onChangeText={(value) => setFormState((current) => ({ ...current, dailySched: value }))}
          />
          <InputBar
            placeholder="Start date"
            value={formState.startDate}
            onChangeText={(value) => setFormState((current) => ({ ...current, startDate: value }))}
          />
          <InputBar
            placeholder="End date"
            value={formState.endDate}
            onChangeText={(value) => setFormState((current) => ({ ...current, endDate: value }))}
          />
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.footerActionsRow}>
          <ActionButton label="Cancel" variant="outline" onPress={closeEditor} />
          <ActionButton label="Add Medicine" variant="solid" onPress={saveMedicine} />
        </View>
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="med" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
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
    minHeight: 86,
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
    minHeight: 64,
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
  toggleRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditableDetailItem({ label, value, editable, onChangeText }) {
  if (!editable) {
    return <DetailItem label={label} value={value} />;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <InputBar value={value} onChangeText={onChangeText} placeholder={label} />
    </View>
  );
}

function parseTimeString(timeText) {
  const match = String(timeText || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const rawHours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(rawHours) || Number.isNaN(minutes) || rawHours < 1 || rawHours > 12 || minutes > 59) {
    return null;
  }

  let hours = rawHours % 12;
  if (meridiem === 'PM') {
    hours += 12;
  }

  return { hours, minutes };
}
