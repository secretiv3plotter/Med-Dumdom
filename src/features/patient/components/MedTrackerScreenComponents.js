import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { ScheduleEntryText, StatusTimesSummary } from './MedTrackerDisplayComponents';
import {
  completedScheduleStyle,
  formatDate,
  formatDateTime,
  formatLastTakenMessage,
  formatMedicineMeta,
  getLatestTakenAt,
  getMedicinePreviewState,
  getScheduleMissedDisplayTime,
  getScheduleStatusStyle,
  getSchedulesEarliestToLatest,
  getStatusTimesSummary,
  isUpcomingScheduleTomorrow,
  missedPreviewStyle,
} from '../utils/medTrackerUtils';

const PILL_RADIUS = moderateScale(999);

export function MedicinePreviewCard({ medicine, observedNow, onOpen, onScheduleStatusChange }) {
  const previewState = getMedicinePreviewState(medicine, observedNow);
  const latestTakenAt = getLatestTakenAt(medicine);
  const statusTimesSummary = getStatusTimesSummary(medicine, observedNow);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${medicine.medName} details`}
      unstable_pressDelay={0}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.medicineListItem,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.medicineListHeader}>
        <View style={styles.cardHeaderBlock}>
          <Text style={styles.cardHeaderName}>{medicine.medName}</Text>
          <Text style={styles.cardHeaderMeta}>
            {formatMedicineMeta(medicine)}
          </Text>
        </View>
      </View>

      <StatusTimesSummary summary={statusTimesSummary} />

      <View style={styles.schedulePreviewList}>
        {previewState.type === 'completed' ? <CompletedPreviewCard /> : null}
        {previewState.type === 'missed' ? <MissedPreviewCard /> : null}
        {previewState.type === 'schedules' ? (
          previewState.items.map(({ entry, index, statusStyle }) => (
            <SchedulePreviewCard
              key={`${medicine.medEntryId}-preview-schedule-${index}`}
              entry={entry}
              index={index}
              medicine={medicine}
              observedNow={observedNow}
              statusStyle={statusStyle}
              latestTakenAt={latestTakenAt}
              onScheduleStatusChange={onScheduleStatusChange}
            />
          ))
        ) : null}
      </View>
    </Pressable>
  );
}

function CompletedPreviewCard() {
  return (
    <View
      style={[
        styles.scheduleCard,
        styles.scheduleCardInList,
        { backgroundColor: completedScheduleStyle.bgColor },
      ]}
    >
      <View style={styles.scheduleCardRow}>
        <Text style={styles.scheduleCardTitle}>
          All meds for today have been taken.
        </Text>
        <StatusBadge statusStyle={completedScheduleStyle} />
      </View>
    </View>
  );
}

function MissedPreviewCard() {
  return (
    <View
      style={[
        styles.scheduleCard,
        styles.scheduleCardInList,
        { backgroundColor: missedPreviewStyle.bgColor },
      ]}
    >
      <Text style={[styles.scheduleCardTitle, { color: missedPreviewStyle.textColor }]}>
        You're done for today.
        {'\n'}But you missed some of your meds.
      </Text>
    </View>
  );
}

function SchedulePreviewCard({
  entry,
  index,
  medicine,
  observedNow,
  statusStyle,
  latestTakenAt,
  onScheduleStatusChange,
}) {
  const isTaken = statusStyle.status === 'taken';
  const canSelectStatus = medicine.isScheduleActionAvailable(index, observedNow, observedNow);
  const dayLabel = isUpcomingScheduleTomorrow(medicine, entry, statusStyle, observedNow) ? 'tomorrow' : '';

  return (
    <View
      style={[
        styles.scheduleCard,
        styles.scheduleCardInList,
        { backgroundColor: statusStyle.bgColor },
      ]}
    >
      <View style={styles.scheduleCardRow}>
        <ScheduleEntryText entry={entry} unit={medicine.unit} dayLabel={dayLabel} />
        <StatusBadge statusStyle={statusStyle} />
      </View>

      {isTaken ? (
        <Text style={styles.scheduleMetaText}>
          Taken {formatDateTime(entry.takenAt)}
        </Text>
      ) : null}

      {statusStyle.status === 'upcoming' && latestTakenAt ? (
        <Text style={styles.scheduleMetaText}>
          {formatLastTakenMessage(latestTakenAt)}
        </Text>
      ) : null}

      {canSelectStatus ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label="Taken"
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'taken');
            }}
            variant={entry.status === 'taken' ? 'solid' : 'outline'}
            style={styles.scheduleActionButton}
          />
          <ActionButton
            label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
            variant={entry.status === 'skipped' ? 'solid' : 'outline'}
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'skipped');
            }}
            style={styles.scheduleActionButton}
          />
        </View>
      ) : null}
    </View>
  );
}

export function MedicineDetailsContent({ medicine, observedNow, onScheduleStatusChange }) {
  return (
    <>
      <DetailItem label="Medication name" value={medicine.medName} />
      <DetailItem label="Unit strength" value={medicine.unitStrength || '--'} />
      <DetailItem label="Total daily amount" value={`${medicine.totalDailyAmount} ${medicine.unit}`} />
      <DetailItem label="Start date" value={formatDate(medicine.startDate)} />
      <DetailItem label="End date" value={medicine.endDate ? formatDate(medicine.endDate) : 'Indefinite'} />
      <DetailItem label="Instructions" value={medicine.instructions || '--'} />
      <DetailItem label="Prescriber contact" value={medicine.prescriberContact || '--'} />

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Daily schedule</Text>
        {getSchedulesEarliestToLatest(medicine.dailySched).map(({ entry, index }) => (
          <MedicineDetailsScheduleCard
            key={`${medicine.medEntryId}-schedule-${index}`}
            entry={entry}
            index={index}
            medicine={medicine}
            observedNow={observedNow}
            onScheduleStatusChange={onScheduleStatusChange}
          />
        ))}
      </View>
    </>
  );
}

function MedicineDetailsScheduleCard({ entry, index, medicine, observedNow, onScheduleStatusChange }) {
  const scheduleStatus = getScheduleStatusStyle(medicine, index, observedNow);
  const isTaken = scheduleStatus.status === 'taken';
  const isMissed = scheduleStatus.status === 'missed' || scheduleStatus.status === 'skipped';
  const canSelectStatus = medicine.isScheduleActionAvailable(index, observedNow, observedNow);
  const dayLabel = isUpcomingScheduleTomorrow(medicine, entry, scheduleStatus, observedNow) ? 'tomorrow' : '';
  const missedDisplayTime = isMissed
    ? getScheduleMissedDisplayTime(medicine, entry, index, observedNow)
    : null;

  return (
    <View style={[styles.scheduleCard, { backgroundColor: scheduleStatus.bgColor }]}>
      <View style={styles.scheduleCardRow}>
        <ScheduleEntryText entry={entry} unit={medicine.unit} dayLabel={dayLabel} />
        <StatusBadge statusStyle={scheduleStatus} />
      </View>

      {isTaken ? (
        <Text style={styles.scheduleMetaText}>
          Taken {formatDateTime(entry.takenAt)}
        </Text>
      ) : null}

      {missedDisplayTime ? (
        <Text style={styles.scheduleMetaText}>
          Missed {formatDateTime(missedDisplayTime)}
        </Text>
      ) : null}

      {canSelectStatus ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label="Taken"
            onPress={() => onScheduleStatusChange(medicine, index, 'taken')}
            variant={entry.status === 'taken' ? 'solid' : 'outline'}
            style={styles.scheduleActionButton}
          />
          <ActionButton
            label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
            variant={entry.status === 'skipped' ? 'solid' : 'outline'}
            onPress={() => onScheduleStatusChange(medicine, index, 'skipped')}
            style={styles.scheduleActionButton}
          />
        </View>
      ) : null}
    </View>
  );
}

function StatusBadge({ statusStyle }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: statusStyle.badgeBgColor || statusStyle.bgColor }]}>
      <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
        {statusStyle.label}
      </Text>
    </View>
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

export function SegmentButton({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.segmentButton,
        selected && styles.segmentButtonSelected,
        pressed && styles.pressedControl,
      ]}
    >
      <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  medicineListItem: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressedCard: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  medicineListHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  pressedControl: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
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
  scheduleCardInList: {
    padding: spacing.sm,
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
    flex: 1,
  },
  scheduleMetaText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  scheduleActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  scheduleActionButton: {
    minWidth: moderateScale(82),
    flexGrow: 1,
  },
  segmentButton: {
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  segmentButtonText: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
  },
  segmentButtonTextSelected: {
    color: colors.brandText,
  },
});
