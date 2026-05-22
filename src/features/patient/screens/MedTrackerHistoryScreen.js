import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ActionButton from '../../../shared/components/common/ActionButton';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import { useTextScale } from '../../../shared/theme/textScale';
import {
  BreadcrumbButton,
  DayRecordCard,
  OptionCard,
} from '../components/MedTrackerHistoryComponents';
import {
  buildHistoryRecordSearchText,
  buildMedGroups,
  formatDate,
  formatDateTime,
  formatDoseWithUnit,
  formatScheduleText,
  getRecordDate,
  getStatusStyle,
  monthName,
  normalizeSearchText,
  uniqueDescending,
} from '../utils/medTrackerHistoryUtils';

const CONTENT_BOTTOM_PADDING = moderateScale(150);
const FOOTER_NAV_Z_INDEX = 30;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const dateKey = (date) => date.toISOString().slice(0, 10);

const buildDayGroups = (records) =>
  Object.values(records.reduce((groups, record) => {
    const recordDate = getRecordDate(record);
    const dayKey = record.historyDate || dateKey(recordDate);
    const existingGroup = groups[dayKey] || {
      dayKey,
      label: formatDate(dayKey),
      records: [],
    };

    existingGroup.records.push(record);
    groups[dayKey] = existingGroup;
    return groups;
  }, {})).sort((firstDay, secondDay) => String(secondDay.dayKey).localeCompare(String(firstDay.dayKey)));

export default function MedTrackerHistoryScreen({ navigation, realm = null }) {
  const { currentUser } = useFirebase();
  const [version, setVersion] = useState(0);
  const [selectedMedKey, setSelectedMedKey] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [selectedScheduleRecord, setSelectedScheduleRecord] = useState(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();

  const historyRecords = useMemo(() => {
    if (!realm) {
      return [];
    }

    return new RealmMedTrackerRepository(realm).listMedTrackerDailyHistory(currentUser.uid);
  }, [realm, version]);

  const filteredHistoryRecords = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    if (!normalizedQuery) {
      return historyRecords;
    }

    return historyRecords.filter((record) => buildHistoryRecordSearchText(record).includes(normalizedQuery));
  }, [historyRecords, searchQuery]);

  const medGroups = useMemo(() => buildMedGroups(filteredHistoryRecords), [filteredHistoryRecords]);
  const selectedMed = useMemo(
    () => medGroups.find((group) => group.key === selectedMedKey) || null,
    [medGroups, selectedMedKey]
  );

  const selectedMedRecords = selectedMed?.records || [];
  const years = useMemo(
    () => uniqueDescending(selectedMedRecords.map((record) => getRecordDate(record).getFullYear())),
    [selectedMedRecords]
  );
  const yearRecords = useMemo(
    () => selectedMedRecords.filter((record) => getRecordDate(record).getFullYear() === selectedYear),
    [selectedMedRecords, selectedYear]
  );
  const months = useMemo(
    () => uniqueDescending(yearRecords.map((record) => getRecordDate(record).getMonth())),
    [yearRecords]
  );
  const monthRecords = useMemo(
    () => yearRecords.filter((record) => getRecordDate(record).getMonth() === selectedMonth),
    [yearRecords, selectedMonth]
  );
  const dayGroups = useMemo(() => buildDayGroups(monthRecords), [monthRecords]);
  const selectedDayGroup = useMemo(
    () => dayGroups.find((dayGroup) => dayGroup.dayKey === selectedDayKey) || null,
    [dayGroups, selectedDayKey]
  );

  const selectMed = (medKey) => {
    setSelectedMedKey(medKey);
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDayKey(null);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedDayKey(null);
  };

  const selectMonth = (month) => {
    setSelectedMonth(month);
    setSelectedDayKey(null);
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const requestDeleteRecords = (type, label, records) => {
    const historyIds = records.map((record) => record.historyId).filter(Boolean);
    if (!historyIds.length) {
      return;
    }

    setPendingDeleteTarget({
      type,
      label,
      count: historyIds.length,
      historyIds,
    });
  };

  const confirmDeleteRecords = () => {
    if (!realm || !pendingDeleteTarget) {
      return;
    }

    new RealmMedTrackerRepository(realm).deleteMedTrackerDailyHistoryRecords(
      currentUser.uid,
      pendingDeleteTarget.historyIds
    );
    setSelectedScheduleRecord((currentRecord) => (
      currentRecord && pendingDeleteTarget.historyIds.includes(currentRecord.record.historyId) ? null : currentRecord
    ));
    setPendingDeleteTarget(null);
    if (pendingDeleteTarget.type === 'all' || pendingDeleteTarget.type === 'medicine') {
      setSelectedMedKey(null);
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDayKey(null);
    }
    if (pendingDeleteTarget.type === 'year') {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDayKey(null);
    }
    if (pendingDeleteTarget.type === 'month') {
      setSelectedMonth(null);
      setSelectedDayKey(null);
    }
    setVersion((current) => current + 1);
  };

  const handleBack = () => {
    if (selectedDayKey) {
      setSelectedScheduleRecord(null);
      setSelectedDayKey(null);
      return true;
    }

    if (selectedMonth !== null) {
      setSelectedMonth(null);
      return true;
    }

    if (selectedYear) {
      setSelectedYear(null);
      return true;
    }

    if (selectedMedKey) {
      setSelectedMedKey(null);
      return true;
    }

    navigation?.navigate?.(ROUTES.MED_TRACKER);
    return true;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [selectedDayKey, selectedMonth, selectedYear, selectedMedKey]);

  const headerBlock = (
    <View style={styles.headerTextBlock}>
      <Text style={styles.title}>Previous Records</Text>
      <Text style={styles.subtitle}>Medicine schedule history from latest to oldest.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        {pinHeader ? headerBlock : null}
      </View>

      <ThemedScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!pinHeader ? headerBlock : null}
        <View style={styles.searchWrap}>
          <InputBar
            placeholder="Search previous records"
            accessibilityLabel="Search previous records"
            value={searchQuery}
            onChangeText={setSearchQuery}
            showSearchIcon
            autoComplete="off"
          />
        </View>

        {historyRecords.length ? (
          <>
            <View style={styles.breadcrumbRow}>
              {selectedMed ? (
                <BreadcrumbButton
                  label={selectedMed.medName}
                  onPress={() => {
                    setSelectedMedKey(null);
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setSelectedDayKey(null);
                  }}
                />
              ) : null}
              {selectedYear ? (
                <BreadcrumbButton
                  label={String(selectedYear)}
                  onPress={() => {
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setSelectedDayKey(null);
                  }}
                />
              ) : null}
              {selectedMonth !== null ? (
                <BreadcrumbButton
                  label={monthName(selectedMonth)}
                  onPress={() => {
                    setSelectedMonth(null);
                    setSelectedDayKey(null);
                  }}
                />
              ) : null}
              {selectedDayGroup ? (
                <BreadcrumbButton
                  label={selectedDayGroup.label}
                  onPress={() => setSelectedDayKey(null)}
                />
              ) : null}
            </View>

            {!selectedMed ? (
              <>
                <Text style={styles.sectionTitle}>Medicines</Text>
                {medGroups.length ? medGroups.map((group) => (
                  <OptionCard
                    key={group.key}
                    title={group.medName}
                    subtitle={`${group.records.length} record${group.records.length === 1 ? '' : 's'}`}
                    onPress={() => selectMed(group.key)}
                    onDelete={() => requestDeleteRecords(
                      'medicine',
                      `all records for ${group.medName}`,
                      group.records
                    )}
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No records found.</Text>
                    <Text style={styles.emptyText}>Try another medicine, date, schedule, or status.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedMed && !selectedYear ? (
              <>
                <Text style={styles.sectionTitle}>Years</Text>
                {years.length ? years.map((year) => (
                  <OptionCard
                    key={year}
                    title={String(year)}
                    subtitle={`${selectedMed.records.filter((record) => getRecordDate(record).getFullYear() === year).length} records`}
                    onPress={() => selectYear(year)}
                    onDelete={() => requestDeleteRecords(
                      'year',
                      `${year} records for ${selectedMed.medName}`,
                      selectedMed.records.filter((record) => getRecordDate(record).getFullYear() === year)
                    )}
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No years found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedMed && selectedYear && selectedMonth === null ? (
              <>
                <Text style={styles.sectionTitle}>Months</Text>
                {months.length ? months.map((month) => (
                  <OptionCard
                    key={month}
                    title={monthName(month)}
                    subtitle={`${yearRecords.filter((record) => getRecordDate(record).getMonth() === month).length} records`}
                    onPress={() => selectMonth(month)}
                    onDelete={() => requestDeleteRecords(
                      'month',
                      `${monthName(month)} ${selectedYear} records for ${selectedMed.medName}`,
                      yearRecords.filter((record) => getRecordDate(record).getMonth() === month)
                    )}
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No months found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedMed && selectedYear && selectedMonth !== null && !selectedDayGroup ? (
              <>
                <Text style={styles.sectionTitle}>Days</Text>
                {dayGroups.length ? dayGroups.map((dayGroup) => (
                  <OptionCard
                    key={dayGroup.dayKey}
                    title={dayGroup.label}
                    subtitle={`${dayGroup.records.length} record${dayGroup.records.length === 1 ? '' : 's'}`}
                    onPress={() => setSelectedDayKey(dayGroup.dayKey)}
                    onDelete={() => requestDeleteRecords(
                      'day',
                      `${dayGroup.label} records for ${selectedMed.medName}`,
                      dayGroup.records
                    )}
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No days found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedDayGroup ? (
              <>
                <Text style={styles.sectionTitle}>Schedules</Text>
                {selectedDayGroup.records.length ? selectedDayGroup.records.map((record) => (
                  <DayRecordCard
                    key={record.historyId}
                    record={record}
                    onDelete={(historyRecord) => requestDeleteRecords(
                      'day',
                      `${formatDate(historyRecord.historyDate)} record for ${historyRecord.medName}`,
                      [historyRecord]
                    )}
                    onSchedulePress={(historyRecord, scheduleEntry) => setSelectedScheduleRecord({
                      record: historyRecord,
                      entry: scheduleEntry,
                    })}
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No days found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No previous records yet.</Text>
          </View>
        )}
      </ThemedScrollView>

      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[styles.footerNav, { opacity: footerNav.isVisible ? 1 : 0 }]}
      >
        <NavigationBar
          selectedTab="med"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
      </View>

      {pendingDeleteTarget ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          accessibilityViewIsModal
          onRequestClose={() => setPendingDeleteTarget(null)}
        >
          <Pressable accessible={false} style={styles.confirmOverlay} onPress={() => setPendingDeleteTarget(null)}>
            <Pressable accessible={false} style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
              <DialogBox
                title="Delete history records?"
                message={`Delete ${pendingDeleteTarget?.label || 'these records'}? You can undo this later.`}
                actions={[
                  {
                    label: 'Cancel',
                    accessibilityLabel: 'Cancel deleting medicine history records',
                    variant: 'outline',
                    onPress: () => setPendingDeleteTarget(null),
                  },
                  {
                    label: 'Delete',
                    accessibilityLabel: 'Confirm deleting medicine history records',
                    variant: 'solid',
                    onPress: confirmDeleteRecords,
                  },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <LargePopup
        visible={Boolean(selectedScheduleRecord)}
        onClose={() => setSelectedScheduleRecord(null)}
        accessibilityLabel={
          selectedScheduleRecord
            ? `Medicine schedule history details for ${selectedScheduleRecord.record.medName}`
            : 'Medicine schedule history details'
        }
        header={
          selectedScheduleRecord ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Schedule Details</Text>
                <Text style={styles.detailsMedicineName}>{selectedScheduleRecord.record.medName}</Text>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
        sheetStyle={styles.medModalSheet}
        headerStyle={styles.medModalHeader}
      >
        {selectedScheduleRecord ? (
          <ScheduleRecordDetails
            record={selectedScheduleRecord.record}
            entry={selectedScheduleRecord.entry}
            onClose={() => setSelectedScheduleRecord(null)}
          />
        ) : null}
      </LargePopup>
    </SafeAreaView>
  );
}

function HistoryDetailItem({ label, value }) {
  const displayValue = String(value || '').trim();
  const accessibleValue = displayValue || 'Blank';

  return (
    <View
      style={styles.detailRow}
      accessible
      accessibilityLabel={`${label}: ${accessibleValue}`}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{displayValue}</Text>
    </View>
  );
}

function ScheduleRecordDetails({ record, entry, onClose }) {
  const statusStyle = getStatusStyle(entry.finalStatus);
  const resolvedAt = formatDateTime(entry.takenAt || entry.skippedAt || entry.resolvedAt);
  const statusLabel = statusStyle.label;

  return (
    <>
      <Text style={styles.stepTitle}>Schedule Details</Text>

      <View style={styles.detailPanel}>
        <HistoryDetailItem label="Medication name" value={record.medName} />
        <HistoryDetailItem label="Schedule" value={formatScheduleText(entry, record.unit)} />
        <View style={styles.detailGrid}>
          <HistoryDetailItem label="Dose" value={formatDoseWithUnit(entry.doseSize, record.unit)} />
          <HistoryDetailItem label="Date" value={formatDate(record.historyDate)} />
        </View>
      </View>

      <View style={styles.schedulePanel}>
        <View style={styles.schedulePanelHeader}>
          <Text style={[styles.modalStatusText, { color: statusStyle.textColor }]}>
            {statusLabel}
          </Text>
        </View>

        <View style={styles.scheduleTileRow}>
          <View style={styles.scheduleTile}>
            <Text style={styles.scheduleTileLabel}>Status</Text>
            <Text style={styles.scheduleTileValue}>{statusLabel}</Text>
          </View>
          <View style={styles.scheduleTile}>
            <Text style={styles.scheduleTileLabel}>Resolved</Text>
            <Text style={styles.scheduleTileValue}>{resolvedAt}</Text>
          </View>
        </View>
      </View>

      <View style={styles.notesPanel}>
        <HistoryDetailItem label="Instructions" value={entry.instructions || record.instructions} />
      </View>

      <View style={styles.footerActionsRow}>
        <ActionButton
          label="Close"
          accessibilityLabel={`Close medicine schedule history details for ${record.medName}`}
          variant="outline"
          onPress={onClose}
          style={styles.closeButton}
          textStyle={styles.closeButtonText}
          pressedStyle={styles.closeButtonPressed}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: BACK_HEADER_BOTTOM_PADDING,
    gap: spacing.sm,
    backgroundColor: colors.pageBg,
  },
  headerTextBlock: {
    gap: spacing.xxs,
  },
  headerBlock: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: CONTENT_BOTTOM_PADDING,
    gap: spacing.sm,
  },
  searchWrap: {
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  clearAllBar: {
    minHeight: moderateScale(48),
    borderWidth: 1,
    borderColor: '#991B1B',
    borderRadius: radius.lg,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  clearAllBarText: {
    ...typography.body,
    color: '#991B1B',
    fontWeight: '700',
  },
  pressedControl: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: FOOTER_NAV_Z_INDEX,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: moderateScale(360),
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  medModalSheet: {
    backgroundColor: colors.surface,
  },
  medModalHeader: {
    borderBottomColor: colors.border,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    minHeight: 5,
  },
  detailsHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  detailsTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  detailsMedicineName: {
    ...typography.body,
    color: colors.body,
    fontWeight: '600',
  },
  stepTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  detailPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
  },
  notesPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailRow: {
    flex: 1,
    minWidth: moderateScale(130),
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
  schedulePanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.sm,
  },
  schedulePanelHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalStatusText: {
    ...typography.body,
    fontWeight: '700',
  },
  scheduleTileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scheduleTile: {
    flex: 1,
    minWidth: moderateScale(130),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  scheduleTileLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  scheduleTileValue: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  closeButton: {
    borderColor: colors.brand,
  },
  closeButtonText: {
    color: colors.brandText,
  },
  closeButtonPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
});
