import { StyleSheet, Text, View } from 'react-native';
import { colors, moderateScale, typography, spacing } from '../../../shared/theme';
import { formatDoseWithUnit, formatIntervalMinutes, formatTime, getIntervalScheduleTime, isIntervalScheduleEntry } from '../utils/medTrackerUtils';

export function ScheduleEntryText({ entry, unit = '', dayLabel = '' }) {
  const isInterval = isIntervalScheduleEntry(entry);
  const scheduleDayLabel = dayLabel ? ` ${dayLabel}` : '';
  const scheduleTimeText = isInterval
    ? getIntervalScheduleTime(entry)
    : formatTime(entry.scheduledTime);

  return (
    <Text style={styles.scheduleCardTitle}>
      Take <Text style={styles.scheduleTextStrong}>{formatDoseWithUnit(entry.doseSize, unit)}</Text>
      {'\n'}At{' '}
      <Text style={styles.scheduleTextStrong}>{scheduleTimeText}</Text>{scheduleDayLabel}
      {isInterval ? (
        <>
          {'\n'}Every <Text style={styles.scheduleTextStrong}>{formatIntervalMinutes(entry.intervalMinutes)}</Text>
        </>
      ) : null}
    </Text>
  );
}

function TimeListText({ items, variant = 'taken' }) {
  if (!items.length) {
    return null;
  }

  const timeStyle = variant === 'missed' ? styles.summaryMissedTimeText : styles.summaryTakenTimeText;
  return items.map((item, index) => (
    <Text key={`${item.timeText}-${index}`} style={styles.summaryTimeItem}>
      {'• '}
      <Text style={timeStyle}>{item.timeText}</Text>
    </Text>
  ));
}

function StatusTimesColumn({ title, items, variant }) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.summaryColumn}>
      <Text style={styles.summaryColumnTitle}>{title}</Text>
      <TimeListText items={items} variant={variant} />
    </View>
  );
}

export function StatusTimesSummary({ summary }) {
  if (!summary.taken.length && !summary.missed.length) {
    return null;
  }

  return (
    <View style={styles.statusTimesSummary}>
      <Text style={styles.summaryTitle}>Today so far,</Text>
      <View style={styles.summaryColumnRow}>
        <StatusTimesColumn title="Taken at" items={summary.taken} variant="taken" />
        <StatusTimesColumn title="Missed at" items={summary.missed} variant="missed" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleCardTitle: {
    ...typography.bodySmall,
    color: colors.body,
    flex: 1,
  },
  scheduleTextStrong: {
    fontWeight: '700',
  },
  statusTimesSummary: {
    gap: spacing.xxs,
  },
  summaryTitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  summaryColumnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  summaryColumn: {
    width: moderateScale(75),
    maxWidth: '48%',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  summaryColumnTitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  summaryTimeItem: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  summaryTakenTimeText: {
    fontWeight: '700',
    color: '#15803D',
  },
  summaryMissedTimeText: {
    fontWeight: '700',
    color: '#B91C1C',
  },
});
