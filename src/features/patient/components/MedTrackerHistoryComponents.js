import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import {
  formatDate,
  formatDateTime,
  formatDoseWithUnit,
  formatMedicineMeta,
  formatScheduleText,
  formatTakenAmount,
  getStatusStyle,
  getTakenAmountForRecords,
  getCalculatedDailyAmountForRecord,
} from '../utils/medTrackerHistoryUtils';

const PILL_RADIUS = moderateScale(999);

export function OptionCard({ title, subtitle, onPress, onDelete = null }) {
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
        <SmallDeleteAction
          onPress={(event) => {
            event?.stopPropagation?.();
            onDelete();
          }}
        />
      ) : null}
    </Pressable>
  );
}

export function BreadcrumbButton({ label, onPress }) {
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

export function MedicineDetailsCard({ medicine }) {
  const totalTaken = formatDoseWithUnit(getTakenAmountForRecords(medicine.records), medicine.unit);
  const firstRecord = medicine.records?.[0] || medicine;
  const calculatedDailyAmount = getCalculatedDailyAmountForRecord(firstRecord);

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.detailsTitle}>{medicine.medName}</Text>
      <DetailRow label="Unit strength" value={medicine.unitStrength || '--'} />
      <DetailRow label="Total daily amount" value={`${calculatedDailyAmount} ${medicine.unit} per day`} />
      <DetailRow label="Start date" value={formatDate(medicine.startDate)} />
      <DetailRow label="End date" value={medicine.endDate ? formatDate(medicine.endDate) : 'Indefinite'} />
      <DetailRow label="Instructions" value={medicine.instructions || '--'} />
      <DetailRow label="Total taken in records" value={totalTaken} />
      <DetailRow label="Prescriber contact" value={medicine.prescriberContact || '--'} />
    </View>
  );
}

function ScheduleStatusCard({ entry, unit, recordId, onPress = null }) {
  const statusStyle = getStatusStyle(entry.finalStatus);
  const resolvedAt = formatDateTime(entry.takenAt || entry.skippedAt || entry.resolvedAt);
  const cardContent = (
    <>
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
    </>
  );

  if (!onPress) {
    return (
      <View
        key={`${recordId}-${entry.scheduleIndex}`}
        style={[styles.scheduleCard, { backgroundColor: statusStyle.bgColor }]}
      >
        {cardContent}
      </View>
    );
  }

  return (
    <Pressable
      key={`${recordId}-${entry.scheduleIndex}`}
      accessibilityRole="button"
      accessibilityLabel={`View ${statusStyle.label} medicine schedule record`}
      unstable_pressDelay={0}
      onPress={() => onPress(entry)}
      style={({ pressed }) => [
        styles.scheduleCard,
        { backgroundColor: statusStyle.bgColor },
        pressed && styles.pressedScheduleCard,
      ]}
    >
      {cardContent}
    </Pressable>
  );
}

export function DayRecordCard({ record, onDelete = null, onSchedulePress = null }) {
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
        {onDelete ? <SmallDeleteAction onPress={() => onDelete(record)} /> : null}
      </View>

      <View style={styles.scheduleList}>
        {record.dailySchedFinalStatuses.map((entry) => (
          <ScheduleStatusCard
            key={`${record.historyId}-${entry.scheduleIndex}`}
            entry={entry}
            unit={record.unit}
            recordId={record.historyId}
            onPress={onSchedulePress ? (scheduleEntry) => onSchedulePress(record, scheduleEntry) : null}
          />
        ))}
      </View>
    </View>
  );
}

function SmallDeleteAction({ onPress }) {
  return (
    <View style={styles.smallDeleteWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete"
        unstable_pressDelay={0}
        onPress={onPress}
        style={({ pressed }) => [
          styles.smallDeleteButton,
          pressed && styles.smallDeleteButtonPressed,
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error || '#D32F2F'} />
      </Pressable>
      <Text style={styles.smallDeleteLabel}>Delete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  pressedScheduleCard: {
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
  smallDeleteWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  smallDeleteButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  smallDeleteButtonPressed: {
    backgroundColor: '#E2E8F0',
  },
  smallDeleteLabel: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
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
});
