import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../../app/navigation/routes';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import BackButton from '../../../shared/components/common/BackButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import { DeleteButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';

const normalizeSearchText = (value) => String(value || '').trim().toLowerCase();

const formatDate = (dateString) => {
  if (!dateString) {
    return '--';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeString) => {
  if (!timeString) {
    return '--';
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

export default function AppointmentTrackerHistoryScreen({ navigation, realm = null }) {
  const [version, setVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteTarget, setPendingDeleteTarget] = useState(null);

  const activeApptTrackerService = useMemo(
    () => (realm ? new RealmApptTrackerRepository(realm) : apptTrackerService),
    [realm],
  );

  const records = useMemo(
    () => activeApptTrackerService.listPreviousApptRecords(CURRENT_USER_ID).map(normalizeRecord).filter(Boolean),
    [activeApptTrackerService, version]
  );

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
    setPendingDeleteTarget(null);
    setVersion((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER)} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Previous Records</Text>
          <Text style={styles.subtitle}>Completed, missed, and deleted appointments.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <InputBar
          placeholder="Search previous records"
          accessibilityLabel="Search previous records"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoComplete="off"
        />

        {filteredRecords.length ? filteredRecords.map((record) => (
          <View key={record.historyId || record.apptEntryId} style={styles.recordCard}>
            <View style={styles.recordCardBody}>
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderText}>
                  <Text style={styles.recordDate}>
                    {`${formatDate(record.dateSched)} at ${formatTime(record.timeSched)}`}
                  </Text>
                  <Text style={styles.recordName}>{record.concern}</Text>
                  <Text style={styles.recordMeta}>{record.address}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getRecordLabel(record)}</Text>
                </View>
              </View>
              <Text style={styles.recordMeta}>{`Doctor: ${record.doctorName || '--'}`}</Text>
              <Text style={styles.recordMeta}>{`Contact: ${record.contactNumber || '--'}`}</Text>
              {record.note ? <Text style={styles.recordMeta}>{record.note}</Text> : null}
            </View>
            <DeleteButton
              onPress={() => requestDeleteRecord(record)}
              accessibilityLabel={`Delete appointment for ${record.concern}`}
            />
          </View>
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No previous records yet.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(pendingDeleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteTarget(null)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setPendingDeleteTarget(null)}>
          <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
            <DialogBox
              title="Delete Record"
              message={`Delete this appointment record for ${pendingDeleteTarget?.concern}? This action cannot be undone.`}
              actions={[
                { label: 'Cancel', variant: 'outline', onPress: () => setPendingDeleteTarget(null) },
                { label: 'Delete', variant: 'solid', onPress: confirmDeleteRecord },
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
    padding: spacing.lg,
    gap: spacing.sm,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordCardBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
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
  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#E9F8EF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
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
    maxWidth: 400,
  },
});
