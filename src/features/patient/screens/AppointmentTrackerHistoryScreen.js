import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../../app/navigation/routes';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import ActionButton from '../../../shared/components/common/ActionButton';
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
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';
const CONTENT_BOTTOM_PADDING = moderateScale(150);
const FOOTER_NAV_Z_INDEX = 30;
const SEEDED_MOCK_HISTORY_USERS = new Set();
const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_TEXT = '#1B6B4A';
const APPOINTMENT_ACCENT_PRESSED = '#B7E4C7';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const normalizeSearchText = (value) => String(value || '').trim().toLowerCase();

const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeString) => {
  if (!timeString) {
    return '';
  }

  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeRecord = (record) => {
  if (record.entry) {
    return {
      historyId: record.entry.apptEntryId,
      concern: record.entry.concern,
      address: record.entry.address,
      doctorName: record.entry.doctorName || '',
      contactNumber: record.entry.contactNumber || '',
      dateSched: record.entry.dateSched,
      timeSched: record.entry.timeSched,
      note: record.entry.note || '',
      finalStatus: record.deleted ? 'deleted' : record.completed ? 'completed' : record.skipped ? 'skipped' : 'missed',
    };
  }
  return record;
};

const getRecordLabel = (record) => {
  if (record.finalStatus === 'deleted') {
    return 'Deleted';
  }

  if (record.finalStatus === 'completed') {
    return 'Completed';
  }

  if (record.finalStatus === 'skipped') {
    return 'Skipped';
  }

  return 'Missed';
};

const getRecordStatusTextStyle = (record) => {
  if (record.finalStatus === 'completed') {
    return styles.statusTextCompleted;
  }

  if (record.finalStatus === 'missed') {
    return styles.statusTextMissed;
  }

  return styles.statusTextMuted;
};

const buildRecordSearchText = (record) => {
  return [
    record.concern,
    record.address,
    record.doctorName,
    record.contactNumber,
    record.dateSched,
    formatDate(record.dateSched),
    formatTime(record.timeSched),
    record.note,
    getRecordLabel(record),
  ].join(' ').toLowerCase();
};

const formatDateOffset = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const createMockPreviousAppointments = () => [
  {
    entry: {
      apptEntryId: 'mock-history-physical-checkup',
      concern: 'Annual physical checkup',
      address: 'Greenfield Family Clinic',
      doctorName: 'Dr. Navarro',
      contactNumber: '0917 555 0214',
      dateSched: formatDateOffset(-3),
      timeSched: '10:00',
      note: 'Routine wellness visit.',
    },
    finalStatus: 'completed',
  },
  {
    entry: {
      apptEntryId: 'mock-history-therapy-session',
      concern: 'Therapy session',
      address: 'MindCare Wellness Center',
      doctorName: 'Dr. Cruz',
      contactNumber: '0917 555 0166',
      dateSched: formatDateOffset(-18),
      timeSched: '15:30',
      note: 'Follow-up session.',
    },
    finalStatus: 'skipped',
  },
  {
    entry: {
      apptEntryId: 'mock-history-cardio-consult',
      concern: 'Cardiology consult',
      address: 'Metro Heart Institute',
      doctorName: 'Dr. Villanueva',
      contactNumber: '0917 555 0147',
      dateSched: formatDateOffset(-42),
      timeSched: '08:45',
      note: 'Discuss ECG results.',
    },
    finalStatus: 'missed',
  },
  {
    entry: {
      apptEntryId: 'mock-history-derma-followup',
      concern: 'Dermatology follow-up',
      address: 'SkinHealth Clinic',
      doctorName: 'Dr. Mercado',
      contactNumber: '0917 555 0189',
      dateSched: formatDateOffset(-390),
      timeSched: '13:15',
      note: 'Review medication response.',
    },
    finalStatus: 'completed',
  },
];

const monthName = (monthIndex) => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
][monthIndex] || '';

const getRecordDate = (record) => {
  const parsedDate = new Date(`${record.dateSched}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
};

const groupRecordsByDate = (records) => {
  const yearsMap = new Map();

  records.forEach((record) => {
    const recordDate = getRecordDate(record);
    const year = recordDate.getFullYear();
    const month = recordDate.getMonth();
    const dayKey = record.dateSched || recordDate.toISOString().slice(0, 10);

    if (!yearsMap.has(year)) {
      yearsMap.set(year, { year, monthsMap: new Map() });
    }
    const yearGroup = yearsMap.get(year);

    if (!yearGroup.monthsMap.has(month)) {
      yearGroup.monthsMap.set(month, { month, monthName: monthName(month), daysMap: new Map() });
    }
    const monthGroup = yearGroup.monthsMap.get(month);

    if (!monthGroup.daysMap.has(dayKey)) {
      monthGroup.daysMap.set(dayKey, { dayKey, label: formatDate(dayKey), records: [] });
    }
    monthGroup.daysMap.get(dayKey).records.push(record);
  });

  return [...yearsMap.values()]
    .sort((first, second) => second.year - first.year)
    .map((yearGroup) => ({
      year: yearGroup.year,
      months: [...yearGroup.monthsMap.values()]
        .sort((first, second) => second.month - first.month)
        .map((monthGroup) => ({
          month: monthGroup.month,
          monthName: monthGroup.monthName,
          days: [...monthGroup.daysMap.values()]
            .sort((first, second) => String(second.dayKey).localeCompare(String(first.dayKey)))
            .map((dayGroup) => ({
              ...dayGroup,
              records: [...dayGroup.records].sort((left, right) =>
                String(right.timeSched || '').localeCompare(String(left.timeSched || ''))
              ),
            })),
        })),
    }));
};

export default function AppointmentTrackerHistoryScreen({ navigation, realm = null }) {
  const [version, setVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pressedRecordId, setPressedRecordId] = useState(null);

  const activeApptTrackerService = useMemo(
    () => (realm ? new RealmApptTrackerRepository(realm) : apptTrackerService),
    [realm],
  );

  const records = useMemo(
    () => activeApptTrackerService.listPreviousApptRecords(CURRENT_USER_ID).map(normalizeRecord).filter(Boolean),
    [activeApptTrackerService, version]
  );

  useEffect(() => {
    if (records.length || SEEDED_MOCK_HISTORY_USERS.has(CURRENT_USER_ID) || !activeApptTrackerService?.snapshotHistory) {
      return;
    }

    createMockPreviousAppointments().forEach(({ entry, finalStatus }) => {
      activeApptTrackerService.snapshotHistory(CURRENT_USER_ID, entry, finalStatus, new Date(`${entry.dateSched}T${entry.timeSched}:00`));
    });
    SEEDED_MOCK_HISTORY_USERS.add(CURRENT_USER_ID);
    setVersion((current) => current + 1);
  }, [activeApptTrackerService, records.length]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    const visibleRecords = normalizedQuery
      ? records.filter((record) => buildRecordSearchText(record).includes(normalizedQuery))
      : records;

    return [...visibleRecords].sort((left, right) => {
      const leftTime = new Date(`${left.dateSched}T${left.timeSched}:00`).getTime() || 0;
      const rightTime = new Date(`${right.dateSched}T${right.timeSched}:00`).getTime() || 0;
      return rightTime - leftTime;
    });
  }, [records, searchQuery]);

  const groupedRecords = useMemo(() => groupRecordsByDate(filteredRecords), [filteredRecords]);
  const selectedYearGroup = useMemo(
    () => groupedRecords.find((yearGroup) => yearGroup.year === selectedYear) || null,
    [groupedRecords, selectedYear]
  );
  const selectedMonthGroup = useMemo(
    () => selectedYearGroup?.months.find((monthGroup) => monthGroup.month === selectedMonth) || null,
    [selectedMonth, selectedYearGroup]
  );
  const selectedDayGroup = useMemo(
    () => selectedMonthGroup?.days.find((dayGroup) => dayGroup.dayKey === selectedDayKey) || null,
    [selectedDayKey, selectedMonthGroup]
  );

  const requestDeleteRecord = (record) => {
    setPendingDeleteTarget({
      historyIds: [record.historyId],
      concern: record.concern,
    });
  };

  const confirmDeleteRecord = () => {
    if (!activeApptTrackerService || !pendingDeleteTarget) {
      return;
    }

    activeApptTrackerService.deleteApptTrackerHistoryRecords(
      CURRENT_USER_ID,
      pendingDeleteTarget.historyIds
    );
    setSelectedRecord((currentRecord) => (
      currentRecord && pendingDeleteTarget.historyIds.includes(currentRecord.historyId) ? null : currentRecord
    ));
    setPendingDeleteTarget(null);
    setVersion((current) => current + 1);
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const handleBack = () => {
    if (selectedDayKey) {
      setSelectedDayKey(null);
      return true;
    }

    if (selectedMonth !== null) {
      setSelectedMonth(null);
      return true;
    }

    if (selectedYear !== null) {
      setSelectedYear(null);
      return true;
    }

    navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER);
    return true;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [selectedDayKey, selectedMonth, selectedYear]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Previous Records</Text>
          <Text style={styles.subtitle}>Completed, skipped, and missed appointments are here.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <InputBar
          placeholder="Search previous records"
          accessibilityLabel="Search previous records"
          value={searchQuery}
          onChangeText={setSearchQuery}
          showSearchIcon
          autoComplete="off"
          focusBorderColor={APPOINTMENT_ACCENT}
        />

        {selectedYear !== null || selectedMonth !== null || selectedDayGroup ? (
          <View style={styles.breadcrumbRow}>
            {selectedYear !== null ? (
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
        ) : null}

        {groupedRecords.length && selectedYear === null ? (
          <>
            <Text style={styles.sectionTitle}>Years</Text>
            {groupedRecords.map((yearGroup) => (
              <DirectoryCard
                key={`year-${yearGroup.year}`}
                title={String(yearGroup.year)}
                subtitle={`${yearGroup.months.reduce((total, monthGroup) => total + monthGroup.days.reduce((dayTotal, dayGroup) => dayTotal + dayGroup.records.length, 0), 0)} records`}
                onPress={() => {
                  setSelectedYear(yearGroup.year);
                  setSelectedMonth(null);
                  setSelectedDayKey(null);
                }}
              />
            ))}
          </>
        ) : null}

        {selectedYearGroup && selectedMonth === null ? (
          <>
            <Text style={styles.sectionTitle}>Months</Text>
            {selectedYearGroup.months.map((monthGroup) => (
              <DirectoryCard
                key={`${selectedYearGroup.year}-${monthGroup.month}`}
                title={monthGroup.monthName}
                subtitle={`${monthGroup.days.reduce((total, dayGroup) => total + dayGroup.records.length, 0)} records`}
                onPress={() => {
                  setSelectedMonth(monthGroup.month);
                  setSelectedDayKey(null);
                }}
              />
            ))}
          </>
        ) : null}

        {selectedMonthGroup && !selectedDayGroup ? (
          <>
            <Text style={styles.sectionTitle}>Days</Text>
            {selectedMonthGroup.days.map((dayGroup) => (
              <DirectoryCard
                key={dayGroup.dayKey}
                title={dayGroup.label}
                subtitle={`${dayGroup.records.length} records`}
                onPress={() => setSelectedDayKey(dayGroup.dayKey)}
              />
            ))}
          </>
        ) : null}

        {selectedDayGroup ? (
          <>
            <Text style={styles.sectionTitle}>Appointments</Text>
            {selectedDayGroup.records.map((record) => {
              const recordKey = record.historyId || record.apptEntryId;
              return (
                <View
                  key={recordKey}
                  style={[styles.recordCard, pressedRecordId === recordKey && styles.pressedRecordCard]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View appointment record for ${record.concern}`}
                    onPress={() => setSelectedRecord(record)}
                    onPressIn={() => setPressedRecordId(recordKey)}
                    onPressOut={() => setPressedRecordId((current) => (current === recordKey ? null : current))}
                    unstable_pressDelay={0}
                    style={styles.recordPressArea}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordHeaderText}>
                        <Text style={[styles.statusText, getRecordStatusTextStyle(record)]}>
                          {getRecordLabel(record)}
                        </Text>
                        <Text style={styles.recordDate}>
                          {formatTime(record.timeSched)}
                        </Text>
                        <Text style={styles.recordName}>{record.concern}</Text>
                        <Text style={styles.recordMeta}>{record.address}</Text>
                      </View>
                    </View>
                    {record.note ? <Text style={styles.recordMeta}>{record.note}</Text> : null}
                  </Pressable>
                  <View style={styles.recordSideActions}>
                    <Pressable
                      onPress={() => requestDeleteRecord(record)}
                      style={({ pressed }) => [
                        styles.iconActionBtn,
                        pressed && styles.iconActionPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete appointment for ${record.concern}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error || '#D32F2F'} />
                    </Pressable>
                    <Text style={[styles.iconActionLabel, { color: colors.error || '#D32F2F' }]}>Delete</Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : null}

        {!groupedRecords.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No previous records yet.</Text>
          </View>
        ) : null}
      </ScrollView>

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
                title="Delete Record"
                message={`Delete this appointment record for ${pendingDeleteTarget?.concern}? You can undo this later.`}
                actions={[
                  {
                    label: 'Cancel',
                    variant: 'outline',
                    onPress: () => setPendingDeleteTarget(null),
                    style: styles.confirmCancelButton,
                    textStyle: styles.confirmCancelText,
                    pressedStyle: styles.confirmCancelPressed,
                  },
                  {
                    label: 'Delete',
                    variant: 'solid',
                    onPress: confirmDeleteRecord,
                    style: styles.confirmSolidButton,
                    textStyle: styles.confirmSolidText,
                    pressedStyle: styles.confirmSolidPressed,
                  },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <LargePopup
        visible={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        header={
          selectedRecord ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Appointment Details</Text>
                <Text style={styles.detailsAppointmentName}>{selectedRecord.concern}</Text>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
        sheetStyle={styles.appointmentModalSheet}
        headerStyle={styles.appointmentModalHeader}
      >
        {selectedRecord ? (
          <>
            <Text style={styles.stepTitle}>Appointment Details</Text>

            <View style={styles.detailPanel}>
              <HistoryDetailItem label="Concern" value={selectedRecord.concern} />
              <HistoryDetailItem label="Address" value={selectedRecord.address} />
              <View style={styles.detailGrid}>
                <HistoryDetailItem label="Doctor name" value={selectedRecord.doctorName} />
                <HistoryDetailItem label="Contact number" value={selectedRecord.contactNumber} />
              </View>
            </View>

            <View style={styles.schedulePanel}>
              <View style={styles.schedulePanelHeader}>
                <Text style={[styles.statusText, getRecordStatusTextStyle(selectedRecord)]}>
                  {getRecordLabel(selectedRecord)}
                </Text>
              </View>

              <View style={styles.scheduleTileRow}>
                <View style={styles.scheduleTile}>
                  <Text style={styles.scheduleTileLabel}>Date</Text>
                  <Text style={styles.scheduleTileValue}>{formatDate(selectedRecord.dateSched)}</Text>
                </View>
                <View style={styles.scheduleTile}>
                  <Text style={styles.scheduleTileLabel}>Time</Text>
                  <Text style={styles.scheduleTileValue}>{formatTime(selectedRecord.timeSched)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.notesPanel}>
              <HistoryDetailItem label="Notes" value={selectedRecord.note} />
            </View>

            <View style={styles.footerActionsRow}>
              <ActionButton
                label="Close"
                variant="outline"
                onPress={() => setSelectedRecord(null)}
                style={styles.closeButton}
                textStyle={styles.closeButtonText}
                pressedStyle={styles.closeButtonPressed}
              />
            </View>
          </>
        ) : null}
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="appointment" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function BreadcrumbButton({ label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.breadcrumbButton, pressed && styles.pressedControl]}
    >
      <Text style={styles.breadcrumbText}>{label}</Text>
    </Pressable>
  );
}

function DirectoryCard({ title, subtitle, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.directoryCard, pressed && styles.pressedCard]}
    >
      <View style={styles.directoryTextBlock}>
        <Text style={styles.directoryTitle}>{title}</Text>
        {subtitle ? <Text style={styles.directorySubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.directoryChevron}>{'>'}</Text>
    </Pressable>
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
  headerTextWrap: {
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: CONTENT_BOTTOM_PADDING,
    gap: spacing.sm,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  breadcrumbButton: {
    borderWidth: 1,
    borderColor: APPOINTMENT_ACCENT,
    borderRadius: radius.md,
    backgroundColor: '#E9F8F1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  breadcrumbText: {
    ...typography.bodySmall,
    color: APPOINTMENT_ACCENT_TEXT,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  directoryCard: {
    minHeight: moderateScale(64),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  directoryTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  directoryTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  directorySubtitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  directoryChevron: {
    ...typography.body,
    color: colors.bodyMuted,
    fontWeight: '700',
  },
  pressedCard: {
    backgroundColor: '#B7E4C7',
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  pressedControl: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  pressedRecordCard: {
    backgroundColor: '#E9F8F1',
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  recordPressArea: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    padding: spacing.md,
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
  recordSideActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  iconActionLabel: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand,
    textAlign: 'center',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recordHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  recordDate: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '700',
  },
  recordName: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  recordMeta: {
    ...typography.bodySmall,
    color: colors.body,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: colors.success,
  },
  statusTextMissed: {
    color: colors.error,
  },
  statusTextMuted: {
    color: colors.bodyMuted,
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
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmDialog: {
    width: '85%',
    maxWidth: 360,
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  appointmentModalSheet: {
    backgroundColor: '#E5E7EB',
  },
  appointmentModalHeader: {
    backgroundColor: '#E5E7EB',
    borderBottomColor: '#9CA3AF',
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
  detailsAppointmentName: {
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
  schedulePanelTitle: {
    ...typography.body,
    color: colors.title,
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
    borderColor: APPOINTMENT_ACCENT,
  },
  closeButtonText: {
    color: APPOINTMENT_ACCENT_TEXT,
  },
  closeButtonPressed: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  confirmCancelButton: {
    borderColor: APPOINTMENT_ACCENT,
  },
  confirmCancelText: {
    color: APPOINTMENT_ACCENT_TEXT,
  },
  confirmCancelPressed: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  confirmSolidButton: {
    backgroundColor: APPOINTMENT_ACCENT,
    borderColor: APPOINTMENT_ACCENT,
  },
  confirmSolidText: {
    color: colors.surface,
  },
  confirmSolidPressed: {
    backgroundColor: APPOINTMENT_ACCENT_TEXT,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  yearSection: {
    gap: spacing.sm,
  },
  monthSection: {
    gap: spacing.xs,
  },
  daySection: {
    gap: spacing.xs,
  },
  yearTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  monthTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  dayTitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '700',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: FOOTER_NAV_Z_INDEX,
  },
});
