import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../shared/components/common/BackButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import { DeleteButton } from '../../../shared/components/common/CrudButton';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';
const CONTENT_BOTTOM_PADDING = moderateScale(150);
const PILL_RADIUS = moderateScale(999);
const FOOTER_NAV_Z_INDEX = 30;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const capitalize = (value) => String(value || '')
  .trim()
  .replace(/^\w/, (char) => char.toUpperCase());

const normalizeSearchText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\bskip+p?ed\b/g, 'missed skipped skip')
  .replace(/\bskips?\b/g, 'missed skipped skip')
  .replace(/\bmiss(?:ed|es)?\b/g, 'missed skipped skip');

const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  const parsed = value instanceof Date ? value : new Date(`${value}T00:00:00`);
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
  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return text || '--';
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }
  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}, ${parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatDoseWithUnit = (doseSize, unit) => {
  const normalizedUnit = String(unit || '').trim();
  return normalizedUnit ? `${doseSize} ${normalizedUnit}` : String(doseSize);
};

const getTakenAmountForRecord = (record) =>
  (record.dailySchedFinalStatuses || []).reduce(
    (total, entry) => total + (entry.finalStatus === 'taken' ? Number(entry.doseSize || 0) : 0),
    0
  );

const getTakenAmountForRecords = (records) =>
  (records || []).reduce((total, record) => total + getTakenAmountForRecord(record), 0);

const formatTakenAmount = (records, unit, label = 'Taken') =>
  `${label}: ${formatDoseWithUnit(getTakenAmountForRecords(records), unit)}`;

const formatMedicineMeta = (record) => {
  const dailyAmountText = `${record.totalDailyAmount} ${record.unit} per day`;
  return record.unitStrength ? `${record.unitStrength} - ${dailyAmountText}` : dailyAmountText;
};

const buildHistoryRecordSearchText = (record) => {
  const recordDate = getRecordDate(record);
  const recordYear = recordDate.getFullYear();
  const recordMonth = Number.isNaN(recordDate.getTime()) ? '' : monthName(recordDate.getMonth());
  return [
    record.medName,
    record.unitStrength,
    record.unit,
    record.totalDailyAmount,
    record.instructions,
    record.prescriberContact,
    record.historyDate,
    formatDate(record.historyDate),
    recordYear,
    recordMonth,
    formatTakenAmount([record], record.unit, 'taken'),
    ...(record.dailySchedFinalStatuses || []).flatMap((entry) => [
      entry.finalStatus,
      entry.scheduleType,
      entry.doseSize,
      entry.scheduledTime,
      entry.mealContext,
      entry.associatedMeal,
      entry.mealTime,
      formatScheduleText(entry, record.unit),
      formatDateTime(entry.takenAt || entry.skippedAt || entry.resolvedAt),
    ]),
  ].filter((value) => value !== undefined && value !== null).map(normalizeSearchText).join(' ');
};

const formatScheduleText = (entry, unit) => {
  if (entry.scheduleType === 'meal') {
    return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\n${capitalize(entry.mealContext)} ${capitalize(entry.associatedMeal)} at ${formatTime(entry.mealTime)}`;
  }

  return `Take ${formatDoseWithUnit(entry.doseSize, unit)}\nAt ${formatTime(entry.scheduledTime)}`;
};

const getStatusStyle = (status) => {
  if (status === 'taken') {
    return { label: 'Taken', bgColor: '#BFDBFE', textColor: '#1D4ED8' };
  }

  if (status === 'skipped') {
    return { label: 'Skipped', bgColor: '#E5E7EB', textColor: '#B91C1C' };
  }

  return { label: 'Missed', bgColor: '#FED7AA', textColor: '#9A3412' };
};

const toHistoryDate = (historyDate) => {
  const parsed = new Date(`${historyDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthName = (monthIndex) =>
  new Date(2026, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });

const getWeekStart = (date) => {
  const weekStart = new Date(date.getTime());
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const getWeekEnd = (weekStart) => {
  const weekEnd = new Date(weekStart.getTime());
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};

const dateKey = (date) => date.toISOString().slice(0, 10);

const getRecordDate = (record) => toHistoryDate(record.historyDate) ?? new Date(0);

const buildMedGroups = (records) =>
  Object.values(records.reduce((groups, record) => {
    const key = record.medEntryId || record.medName;
    const existingGroup = groups[key] || {
      key,
      medName: record.medName,
      unitStrength: record.unitStrength,
      unit: record.unit,
      totalDailyAmount: record.totalDailyAmount,
      startDate: record.startDate,
      endDate: record.endDate,
      instructions: record.instructions,
      prescriberContact: record.prescriberContact,
      latestDate: record.historyDate,
      records: [],
    };

    existingGroup.records.push(record);
    if (String(record.historyDate || '') > String(existingGroup.latestDate || '')) {
      existingGroup.latestDate = record.historyDate;
      existingGroup.medName = record.medName;
      existingGroup.unitStrength = record.unitStrength;
      existingGroup.unit = record.unit;
      existingGroup.totalDailyAmount = record.totalDailyAmount;
      existingGroup.startDate = record.startDate;
      existingGroup.endDate = record.endDate;
      existingGroup.instructions = record.instructions;
      existingGroup.prescriberContact = record.prescriberContact;
    }

    groups[key] = existingGroup;
    return groups;
  }, {})).sort((firstGroup, secondGroup) =>
    String(secondGroup.latestDate || '').localeCompare(String(firstGroup.latestDate || ''))
  );

const uniqueDescending = (items) => [...new Set(items)].sort((firstItem, secondItem) => secondItem - firstItem);

const groupRecordsByWeek = (records) =>
  Object.values(records.reduce((groups, record) => {
    const recordDate = toHistoryDate(record.historyDate);
    if (!recordDate) {
      return groups;
    }

    const weekStart = getWeekStart(recordDate);
    const key = dateKey(weekStart);
    const existingGroup = groups[key] || {
      key,
      startDate: weekStart,
      endDate: getWeekEnd(weekStart),
      records: [],
    };

    existingGroup.records.push(record);
    groups[key] = existingGroup;
    return groups;
  }, {})).sort((firstWeek, secondWeek) => secondWeek.startDate.getTime() - firstWeek.startDate.getTime());

function OptionCard({ title, subtitle, onPress, onDelete = null }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.optionCard, pressed && styles.pressedCard]}
    >
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onDelete ? (
        <DeleteButton
          onPress={(event) => {
            event?.stopPropagation?.();
            onDelete();
          }}
        />
      ) : null}
    </Pressable>
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

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MedicineDetailsCard({ medicine }) {
  const totalTaken = formatDoseWithUnit(getTakenAmountForRecords(medicine.records), medicine.unit);

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.detailsTitle}>{medicine.medName}</Text>
      <DetailRow label="Unit strength" value={medicine.unitStrength || '--'} />
      <DetailRow label="Total daily amount" value={`${medicine.totalDailyAmount} ${medicine.unit} per day`} />
      <DetailRow label="Start date" value={formatDate(medicine.startDate)} />
      <DetailRow label="End date" value={medicine.endDate ? formatDate(medicine.endDate) : 'Indefinite'} />
      <DetailRow label="Instructions" value={medicine.instructions || '--'} />
      <DetailRow label="Total taken in records" value={totalTaken} />
      <DetailRow label="Prescriber contact" value={medicine.prescriberContact || '--'} />
    </View>
  );
}

function ScheduleStatusCard({ entry, unit, recordId }) {
  const statusStyle = getStatusStyle(entry.finalStatus);
  const resolvedAt = formatDateTime(entry.takenAt || entry.skippedAt || entry.resolvedAt);

  return (
    <View
      key={`${recordId}-${entry.scheduleIndex}`}
      style={[styles.scheduleCard, { backgroundColor: statusStyle.bgColor }]}
    >
      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleText}>{formatScheduleText(entry, unit)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>
      {resolvedAt ? (
        <Text style={styles.scheduleMeta}>{`${statusStyle.label} ${resolvedAt}`}</Text>
      ) : null}
    </View>
  );
}

function DayRecordCard({ record, onDelete = null }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordHeaderText}>
          <Text style={styles.recordDate}>{formatDate(record.historyDate)}</Text>
          <Text style={styles.recordName}>{record.medName}</Text>
          <Text style={styles.recordMeta}>
            {formatMedicineMeta(record)}
          </Text>
          <Text style={styles.recordMeta}>
            {formatTakenAmount([record], record.unit, 'Taken this day')}
          </Text>
        </View>
        {onDelete ? <DeleteButton onPress={() => onDelete(record)} /> : null}
      </View>

      <View style={styles.scheduleList}>
        {record.dailySchedFinalStatuses.map((entry) => (
          <ScheduleStatusCard
            key={`${record.historyId}-${entry.scheduleIndex}`}
            entry={entry}
            unit={record.unit}
            recordId={record.historyId}
          />
        ))}
      </View>
    </View>
  );
}

export default function MedTrackerHistoryScreen({ navigation, realm = null }) {
  const [version, setVersion] = useState(0);
  const [isCleanupMode, setIsCleanupMode] = useState(false);
  const [selectedMedKey, setSelectedMedKey] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Previous Records</Text>
          <Text style={styles.subtitle}>Medicine schedule history from latest to oldest.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="med" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>

      <Modal
        visible={Boolean(pendingDeleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteTarget(null)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setPendingDeleteTarget(null)}>
          <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
            <DialogBox
              title="Delete history records?"
              message={`Are you sure you want to delete ${pendingDeleteTarget?.label || 'these records'}? This will remove ${pendingDeleteTarget?.count || 0} history ${pendingDeleteTarget?.count === 1 ? 'record' : 'records'}.`}
              actions={[
                { label: 'Cancel', variant: 'outline', onPress: () => setPendingDeleteTarget(null) },
                { label: 'Delete', variant: 'solid', onPress: confirmDeleteRecords },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.pageBg,
  },
  headerTextBlock: {
    gap: spacing.xxs,
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
  breadcrumbButton: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  breadcrumbText: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
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
  detailsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailsTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
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
  optionCard: {
    minHeight: moderateScale(64),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  pressedCard: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  pressedControl: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  optionTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  optionSubtitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
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
  scheduleList: {
    gap: spacing.xs,
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scheduleText: {
    ...typography.bodySmall,
    color: colors.body,
    flex: 1,
  },
  scheduleMeta: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  statusBadge: {
    borderRadius: PILL_RADIUS,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
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
    maxWidth: moderateScale(420),
  },
});
