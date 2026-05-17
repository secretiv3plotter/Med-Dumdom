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
import NavigationBar from '../../../shared/components/common/NavigationBar';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import { useTextScale } from '../../../shared/theme/textScale';
import {
  BreadcrumbButton,
  DayRecordCard,
  MedicineDetailsCard,
  OptionCard,
} from '../components/MedTrackerHistoryComponents';
import {
  buildHistoryRecordSearchText,
  buildMedGroups,
  formatDate,
  formatTakenAmount,
  getRecordDate,
  groupRecordsByWeek,
  monthName,
  normalizeSearchText,
  uniqueDescending,
} from '../utils/medTrackerHistoryUtils';

const CURRENT_USER_ID = 'current-user';
const CONTENT_BOTTOM_PADDING = moderateScale(150);
const FOOTER_NAV_Z_INDEX = 30;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

export default function MedTrackerHistoryScreen({ navigation, realm = null }) {
  const [version, setVersion] = useState(0);
  const [isCleanupMode, setIsCleanupMode] = useState(false);
  const [selectedMedKey, setSelectedMedKey] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();

  const historyRecords = useMemo(() => {
    if (!realm) {
      return [];
    }

    return new RealmMedTrackerRepository(realm).listMedTrackerDailyHistory(CURRENT_USER_ID);
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
  const weekGroups = useMemo(() => groupRecordsByWeek(monthRecords), [monthRecords]);
  const selectedWeek = useMemo(
    () => weekGroups.find((week) => week.key === selectedWeekKey) || null,
    [weekGroups, selectedWeekKey]
  );
  const dayRecords = useMemo(
    () => [...(selectedWeek?.records || [])].sort((firstRecord, secondRecord) =>
      String(secondRecord.historyDate || '').localeCompare(String(firstRecord.historyDate || ''))
    ),
    [selectedWeek]
  );

  const selectMed = (medKey) => {
    setSelectedMedKey(medKey);
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedWeekKey(null);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedWeekKey(null);
  };

  const selectMonth = (month) => {
    setSelectedMonth(month);
    setSelectedWeekKey(null);
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
      CURRENT_USER_ID,
      pendingDeleteTarget.historyIds
    );
    setPendingDeleteTarget(null);
    if (pendingDeleteTarget.type === 'all' || pendingDeleteTarget.type === 'medicine') {
      setSelectedMedKey(null);
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedWeekKey(null);
    }
    if (pendingDeleteTarget.type === 'year') {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedWeekKey(null);
    }
    if (pendingDeleteTarget.type === 'month') {
      setSelectedMonth(null);
      setSelectedWeekKey(null);
    }
    if (pendingDeleteTarget.type === 'week') {
      setSelectedWeekKey(null);
    }
    setVersion((current) => current + 1);
  };

  const handleBack = () => {
    if (selectedWeekKey) {
      setSelectedWeekKey(null);
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
  }, [selectedWeekKey, selectedMonth, selectedYear, selectedMedKey]);

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

      <ThemedScrollView
        contentContainerStyle={styles.content}
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        {!pinHeader ? headerBlock : null}
        {historyRecords.length ? (
          <>
            <View style={styles.searchWrap}>
              <InputBar
                placeholder="Search previous records"
                accessibilityLabel="Search previous records"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoComplete="off"
              />
            </View>

            <View style={styles.breadcrumbRow}>
              {selectedMed ? (
                <BreadcrumbButton
                  label={selectedMed.medName}
                  onPress={() => {
                    setSelectedMedKey(null);
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setSelectedWeekKey(null);
                  }}
                />
              ) : null}
              {selectedYear ? (
                <BreadcrumbButton
                  label={String(selectedYear)}
                  onPress={() => {
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setSelectedWeekKey(null);
                  }}
                />
              ) : null}
              {selectedMonth !== null ? (
                <BreadcrumbButton
                  label={monthName(selectedMonth)}
                  onPress={() => {
                    setSelectedMonth(null);
                    setSelectedWeekKey(null);
                  }}
                />
              ) : null}
              {selectedWeek ? (
                <BreadcrumbButton
                  label={`${formatDate(selectedWeek.startDate)} - ${formatDate(selectedWeek.endDate)}`}
                  onPress={() => setSelectedWeekKey(null)}
                />
              ) : null}
            </View>

            {!selectedMed ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isCleanupMode ? 'Done cleaning records' : 'Clean up records'}
                  unstable_pressDelay={0}
                  onPress={() => setIsCleanupMode((current) => !current)}
                  style={({ pressed }) => [
                    styles.cleanupBar,
                    isCleanupMode && styles.cleanupBarActive,
                    pressed && styles.pressedControl,
                  ]}
                >
                  <Text style={[styles.cleanupBarText, isCleanupMode && styles.cleanupBarTextActive]}>
                    {isCleanupMode ? 'Done cleaning records' : 'Clean up records'}
                  </Text>
                </Pressable>
                {isCleanupMode ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear all records"
                    unstable_pressDelay={0}
                    onPress={() => requestDeleteRecords('all', 'all previous records', historyRecords)}
                    style={({ pressed }) => [styles.clearAllBar, pressed && styles.pressedControl]}
                  >
                    <Text style={styles.clearAllBarText}>Clear all records</Text>
                  </Pressable>
                ) : null}
                <Text style={styles.sectionTitle}>Medicines</Text>
                {medGroups.length ? medGroups.map((group) => (
                  <OptionCard
                    key={group.key}
                    title={group.medName}
                    subtitle={`${group.unitStrength ? `${group.unitStrength} - ` : ''}Latest record ${formatDate(group.latestDate)} - ${formatTakenAmount(group.records, group.unit, 'Total taken')}`}
                    onPress={() => selectMed(group.key)}
                    onDelete={
                      isCleanupMode
                        ? () => requestDeleteRecords(
                            'medicine',
                            `all records for ${group.medName}`,
                            group.records
                          )
                        : null
                    }
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
                <MedicineDetailsCard medicine={selectedMed} />
                <Text style={styles.sectionTitle}>Years</Text>
                {years.length ? years.map((year) => (
                  <OptionCard
                    key={year}
                    title={String(year)}
                    subtitle={`${selectedMed.records.filter((record) => getRecordDate(record).getFullYear() === year).length} records - ${formatTakenAmount(selectedMed.records.filter((record) => getRecordDate(record).getFullYear() === year), selectedMed.unit, 'Taken this year')}`}
                    onPress={() => selectYear(year)}
                    onDelete={
                      isCleanupMode
                        ? () => requestDeleteRecords(
                            'year',
                            `${year} records for ${selectedMed.medName}`,
                            selectedMed.records.filter((record) => getRecordDate(record).getFullYear() === year)
                          )
                        : null
                    }
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
                    subtitle={`${yearRecords.filter((record) => getRecordDate(record).getMonth() === month).length} records - ${formatTakenAmount(yearRecords.filter((record) => getRecordDate(record).getMonth() === month), selectedMed.unit, 'Taken this month')}`}
                    onPress={() => selectMonth(month)}
                    onDelete={
                      isCleanupMode
                        ? () => requestDeleteRecords(
                            'month',
                            `${monthName(month)} ${selectedYear} records for ${selectedMed.medName}`,
                            yearRecords.filter((record) => getRecordDate(record).getMonth() === month)
                          )
                        : null
                    }
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No months found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedMed && selectedYear && selectedMonth !== null && !selectedWeek ? (
              <>
                <Text style={styles.sectionTitle}>Weeks</Text>
                {weekGroups.length ? weekGroups.map((week) => (
                  <OptionCard
                    key={week.key}
                    title={`${formatDate(week.startDate)} - ${formatDate(week.endDate)}`}
                    subtitle={`${week.records.length} days with records - ${formatTakenAmount(week.records, selectedMed.unit, 'Taken this week')}`}
                    onPress={() => setSelectedWeekKey(week.key)}
                    onDelete={
                      isCleanupMode
                        ? () => requestDeleteRecords(
                            'week',
                            `${formatDate(week.startDate)} - ${formatDate(week.endDate)} records for ${selectedMed.medName}`,
                            week.records
                          )
                        : null
                    }
                  />
                )) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No weeks found.</Text>
                    <Text style={styles.emptyText}>Try adjusting your search.</Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedWeek ? (
              <>
                <Text style={styles.sectionTitle}>Days</Text>
                {dayRecords.length ? dayRecords.map((record) => (
                  <DayRecordCard
                    key={record.historyId}
                    record={record}
                    onDelete={
                      isCleanupMode
                        ? (historyRecord) => requestDeleteRecords(
                            'day',
                            `${formatDate(historyRecord.historyDate)} record for ${historyRecord.medName}`,
                            [historyRecord]
                          )
                        : null
                    }
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
            <Text style={styles.emptyText}>Daily medicine history will appear here after a schedule day is completed.</Text>
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
          onRequestClose={() => setPendingDeleteTarget(null)}
        >
          <Pressable style={styles.confirmOverlay} onPress={() => setPendingDeleteTarget(null)}>
            <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
              <DialogBox
                title="Delete history records?"
                message={`Delete ${pendingDeleteTarget?.label || 'these records'}? You can undo this later.`}
                actions={[
                  { label: 'Cancel', variant: 'outline', onPress: () => setPendingDeleteTarget(null) },
                  { label: 'Delete', variant: 'solid', onPress: confirmDeleteRecords },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
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
    marginBottom: spacing.xs,
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
  cleanupBar: {
    minHeight: moderateScale(48),
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  cleanupBarActive: {
    backgroundColor: '#FEE2E2',
  },
  cleanupBarText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '700',
  },
  cleanupBarTextActive: {
    color: '#991B1B',
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
    minHeight: moderateScale(140),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xs,
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
});
