import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { scaleFontSize } from '../../../shared/theme/textScale';
import { ScheduleEntryText } from './MedTrackerDisplayComponents';
import {
  completedScheduleStyle,
  formatDate,
  formatDateTime,
  formatLastTakenMessage,
  formatMedicineMeta,
  getLatestTakenAt,
  getMedicinePreviewState,
  getScheduleDayLabel,
  getScheduleMissedDisplayTime,
  getScheduleStatusStyle,
  getSchedulesEarliestToLatest,
  getStatusTimesSummary,
  isIntervalScheduleEntry,
  formatIntervalMinutes,
  isUpcomingScheduleTomorrow,
  missedPreviewStyle,
  getLastActionMessage,
  getIntervalScheduleTime,
  formatDoseWithUnit,
  getCalculatedDailyAmount,
  formatTime,
} from '../utils/medTrackerUtils';

const PILL_RADIUS = moderateScale(999);

export function MedicinePreviewCard({ medicine, observedNow, onOpen, onScheduleStatusChange }) {
  const previewState = getMedicinePreviewState(medicine, observedNow);
  const latestTakenAt = getLatestTakenAt(medicine);

  const medName = medicine.medName || '';
  const baseFontSize = typography.body?.fontSize || 16;
  let numericBaseFontSize = 16;

  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 16;
  } else {
    numericBaseFontSize = baseFontSize;
  }

  // Dynamic font sizing: scale down long medicine names so they fit on narrower screen viewports
  const dynamicFontSize = medName.length > 14 ? Math.max(11, numericBaseFontSize * 0.82) : numericBaseFontSize;
  const finalFontSize = scaleFontSize(dynamicFontSize);

  return (
    <View style={styles.medicineListItem}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${medicine.medName} details`}
        unstable_pressDelay={0}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.medicineListHeader,
          pressed && styles.pressedHeader,
        ]}
      >
        <View style={styles.cardHeaderBlock}>
          <Text style={[styles.cardHeaderName, { fontSize: finalFontSize }]}>
            {medicine.medName}
          </Text>
          <Text style={styles.cardHeaderMeta}>
            {formatMedicineMeta(medicine)}
          </Text>
        </View>
      </Pressable>

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
    </View>
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
  const tomorrowLabel = isUpcomingScheduleTomorrow(medicine, entry, statusStyle, observedNow) ? 'tomorrow' : '';
  const scheduleDayLabel = getScheduleDayLabel(entry);
  const dayLabel = tomorrowLabel && scheduleDayLabel ? `${tomorrowLabel} (${scheduleDayLabel})` : (scheduleDayLabel || tomorrowLabel);

  const isHourly = !!entry.intervalMinutes;
  const lastActionMessage = isHourly ? getLastActionMessage(medicine) : null;

  return (
    <View
      style={[
        styles.scheduleCard,
        styles.scheduleCardInList,
        { backgroundColor: statusStyle.bgColor },
      ]}
    >
      <View style={styles.scheduleCardRow}>
        <Text style={styles.scheduleCardTitle}>
          Take <Text style={styles.scheduleTextStrong}>{formatDoseWithUnit(entry.doseSize, medicine.unit)}</Text>
        </Text>
        <StatusBadge statusStyle={statusStyle} />
      </View>

      <Text style={styles.scheduleMetaText}>
        At {isHourly ? getIntervalScheduleTime(entry) : formatTime(entry.scheduledTime)}{dayLabel ? ` ${dayLabel}` : ''}
      </Text>

      {!isHourly ? (
        <>
          {isTaken ? (
            <Text style={styles.scheduleMetaText}>
              Taken {formatDateTime(entry.takenAt)}
            </Text>
          ) : null}

          {entry.status === 'skipped' ? (
            <Text style={styles.scheduleMetaText}>
              Skipped {formatDateTime(entry.skippedAt)}
            </Text>
          ) : null}

          {statusStyle.status === 'upcoming' && latestTakenAt ? (
            <Text style={styles.scheduleMetaText}>
              {formatLastTakenMessage(latestTakenAt)}
            </Text>
          ) : null}
        </>
      ) : null}

      {medicine.canRevertSchedule(index, observedNow) ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label="Revert Status"
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'clear');
            }}
            variant="outline"
            style={[styles.revertStatusButton, styles.detailsScheduleActionButton]}
            pressedStyle={styles.revertStatusButtonPressed}
            textStyle={styles.revertStatusButtonText}
            preserveFontSize
          />
        </View>
      ) : canSelectStatus ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
            variant={entry.status === 'skipped' ? 'solid' : 'outline'}
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'skipped');
            }}
            style={styles.skipActionButton}
          />
          <ActionButton
            label="Taken"
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'taken');
            }}
            variant={entry.status === 'taken' ? 'solid' : 'outline'}
            style={styles.takenActionButton}
          />
        </View>
      ) : null}
    </View>
  );
}

export function MedicineDetailsContent({ medicine, observedNow, onScheduleStatusChange }) {
  const intervalEntry = (medicine.dailySched || []).find((entry) => entry.intervalMinutes);
  const sectionLabelText = intervalEntry
    ? `${Number(intervalEntry.intervalMinutes || 0) >= 1440 ? 'Weekly interval' : 'Hourly interval'} schedule (Every ${formatIntervalMinutes(intervalEntry.intervalMinutes)})`
    : (medicine.dailySched || []).some(e => e.monthOfYear)
    ? 'Monthly schedule'
    : (medicine.dailySched || []).some(e => e.dayOfWeek)
    ? 'Weekly schedule'
    : 'Daily schedule';

  return (
    <>
      <DetailItem label="Medication name" value={medicine.medName} />
      <DetailItem label="Total daily amount" value={`${getCalculatedDailyAmount(medicine)} ${medicine.unit}`} />
      <DetailItem label="Start date" value={formatDate(medicine.startDate)} />
      <DetailItem label="End date" value={medicine.endDate ? formatDate(medicine.endDate) : 'Indefinite'} />
      <DetailItem label="Instructions" value={medicine.instructions || '--'} />
      <DetailItem label="Prescriber contact" value={medicine.prescriberContact || '--'} />

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>
          {sectionLabelText}
        </Text>
        {getSchedulesEarliestToLatest(medicine.dailySched).map(({ entry, index }) => (
          <View key={`${medicine.medEntryId}-schedule-${index}`} style={styles.scheduleCardWrapper}>
            <MedicineDetailsScheduleCard
              entry={entry}
              index={index}
              medicine={medicine}
              observedNow={observedNow}
              onScheduleStatusChange={onScheduleStatusChange}
            />
          </View>
        ))}
      </View>
    </>
  );
}

function MedicineDetailsScheduleCard({ entry, index, medicine, observedNow, onScheduleStatusChange }) {
  const scheduleStatus = getScheduleStatusStyle(medicine, index, observedNow);
  const isTaken = scheduleStatus.status === 'taken';
  const isMissed = scheduleStatus.status === 'missed' || scheduleStatus.status === 'skipped';
  const isResolved = entry.status === 'taken' || entry.status === 'skipped';
  const canSelectStatus = medicine.isScheduleActionAvailable(index, observedNow, observedNow);
  const tomorrowLabel = isUpcomingScheduleTomorrow(medicine, entry, scheduleStatus, observedNow) ? 'tomorrow' : '';
  const scheduleDayLabel = getScheduleDayLabel(entry);
  const dayLabel = tomorrowLabel && scheduleDayLabel ? `${tomorrowLabel} (${scheduleDayLabel})` : (scheduleDayLabel || tomorrowLabel);
  const missedDisplayTime = isMissed
    ? getScheduleMissedDisplayTime(medicine, entry, index, observedNow)
    : null;

  return (
    <View style={[
      styles.scheduleCard,
      isResolved ? styles.resolvedScheduleCard : { backgroundColor: scheduleStatus.bgColor },
    ]}>
      <View style={styles.scheduleCardRow}>
        <Text style={styles.scheduleCardTitle}>
          Take <Text style={styles.scheduleTextStrong}>{formatDoseWithUnit(entry.doseSize, medicine.unit)}</Text>
        </Text>
        <StatusBadge statusStyle={scheduleStatus} />
      </View>

      <Text style={styles.scheduleMetaText}>
        At {isIntervalScheduleEntry(entry) ? getIntervalScheduleTime(entry) : formatTime(entry.scheduledTime)}{dayLabel ? ` ${dayLabel}` : ''}
      </Text>

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

      {medicine.canRevertSchedule(index, observedNow) ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label="Revert Status"
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'clear');
            }}
            variant="outline"
            style={[styles.revertStatusButton, styles.detailsScheduleActionButton]}
            pressedStyle={styles.revertStatusButtonPressed}
            textStyle={styles.revertStatusButtonText}
            preserveFontSize
          />
        </View>
      ) : canSelectStatus ? (
        <View style={styles.scheduleActionRow}>
          <ActionButton
            label={entry.status === 'skipped' ? 'Skipped' : 'Skip'}
            variant={entry.status === 'skipped' ? 'solid' : 'outline'}
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'skipped');
            }}
            style={styles.skipActionButton}
          />
          <ActionButton
            label="Taken"
            onPress={(event) => {
              event?.stopPropagation?.();
              onScheduleStatusChange(medicine, index, 'taken');
            }}
            variant={entry.status === 'taken' ? 'solid' : 'outline'}
            style={styles.takenActionButton}
          />
        </View>
      ) : null}
    </View>
  );
}

function StatusBadge({ statusStyle }) {
  const label = statusStyle.label || '';
  const baseFontSize = typography.bodySmall?.fontSize || 12;
  let numericBaseFontSize = 12;

  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 12;
  } else {
    numericBaseFontSize = baseFontSize;
  }

  // Dynamic scale down for long status badge pills (e.g. "Completed", "Skipped")
  const dynamicFontSize = label.length > 7 ? Math.max(9, numericBaseFontSize * 0.82) : numericBaseFontSize;
  const finalFontSize = scaleFontSize(dynamicFontSize);

  return (
    <View style={[styles.statusBadge, { backgroundColor: statusStyle.badgeBgColor || statusStyle.bgColor }]}>
      <Text
        style={[
          styles.statusText,
          { color: statusStyle.textColor, fontSize: finalFontSize }
        ]}
      >
        {label}
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

export function SegmentButton({ label = '', selected, onPress }) {
  const baseFontSize = typography.bodySmall?.fontSize || 12;
  let numericBaseFontSize = 12;

  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 12;
  } else {
    numericBaseFontSize = baseFontSize;
  }

  // Dynamic scale down for segmented button text labels
  const dynamicFontSize = label.length > 8 ? Math.max(9, numericBaseFontSize * 0.82) : numericBaseFontSize;
  const finalFontSize = scaleFontSize(dynamicFontSize);

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
      <Text
        style={[
          styles.segmentButtonText,
          selected && styles.segmentButtonTextSelected,
          { fontSize: finalFontSize }
        ]}
      >
        {label}
      </Text>
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
    gap: spacing.xs,
  },
  pressedCard: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  pressedHeader: {
    opacity: 0.7,
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
    gap: spacing.xxs,
  },
  scheduleCardWrapper: {
    gap: spacing.xs,
  },
  scheduleIntervalNote: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    paddingLeft: spacing.sm,
  },
  scheduleCardInList: {
    padding: spacing.xs,
  },
  resolvedScheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  scheduleCardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  skipActionButton: {
    minWidth: moderateScale(70),
    flexGrow: 1,
  },
  takenActionButton: {
    minWidth: moderateScale(110),
    flexGrow: 2,
  },
  detailsScheduleActionButton: {
    minWidth: moderateScale(82),
    flexGrow: 1,
    flexShrink: 1,
  },
  revertStatusButton: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  revertStatusButtonPressed: {
    backgroundColor: '#FECACA',
    borderColor: '#B91C1C',
  },
  revertStatusButtonText: {
    color: colors.error,
  },
  segmentButton: {
    minHeight: moderateScale(44),
    minWidth: 0,
    flexShrink: 1,
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
    flexShrink: 1,
    textAlign: 'center',
  },
  segmentButtonTextSelected: {
    color: colors.brandText,
  },
  scheduleTextStrong: {
    fontWeight: '700',
  },
});
