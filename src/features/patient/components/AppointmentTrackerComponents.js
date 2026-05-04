import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import {
  formatDate,
  formatIsoDateTime,
  formatIsoTime,
  formatTime,
  getApptStatusStyle,
} from '../utils/apptTrackerUtils';

const PILL_RADIUS = moderateScale(999);

export function AppointmentPreviewCard({ appointment, observedNow, onOpen, onStatusChange }) {
  const statusStyle = getApptStatusStyle(appointment, observedNow);
  const canSelectStatus = appointment.isScheduleActionAvailable?.(observedNow, observedNow);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${appointment.concern} details`}
      unstable_pressDelay={0}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.appointmentListItem,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.appointmentListHeader}>
        <View style={styles.cardHeaderBlock}>
          <Text style={styles.cardHeaderName}>{appointment.concern}</Text>
          <Text style={styles.cardHeaderMeta}>
            {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
          </Text>
          <Text style={styles.cardHeaderMeta}>{appointment.address}</Text>
        </View>
        <StatusBadge statusStyle={statusStyle} />
      </View>

      <View style={[styles.scheduleCard, { backgroundColor: statusStyle.bgColor }]}>
        <View style={styles.scheduleCardRow}>
          <View style={styles.scheduleTextBlock}>
            <Text style={styles.scheduleCardTitle}>Appointment schedule</Text>
            <Text style={styles.scheduleMetaText}>
              {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
            </Text>
          </View>
          <StatusBadge statusStyle={statusStyle} />
        </View>

        {canSelectStatus ? (
          <View style={styles.scheduleActionRow}>
            <ActionButton
              label="Done"
              onPress={(event) => {
                event?.stopPropagation?.();
                onStatusChange(appointment, 'completed');
              }}
              variant="outline"
              style={styles.scheduleActionButton}
            />
            <ActionButton
              label="Skip"
              onPress={(event) => {
                event?.stopPropagation?.();
                onStatusChange(appointment, 'skipped');
              }}
              variant="outline"
              style={styles.scheduleActionButton}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function AppointmentDetailsContent({ appointment, observedNow, onStatusChange }) {
  const statusStyle = getApptStatusStyle(appointment, observedNow);
  const canSelectStatus = appointment.isScheduleActionAvailable?.(observedNow, observedNow);

  return (
    <>
      <View style={[styles.scheduleCard, { backgroundColor: statusStyle.bgColor }]}>
        <View style={styles.scheduleCardRow}>
          <View style={styles.scheduleTextBlock}>
            <Text style={styles.scheduleCardTitle}>Appointment schedule</Text>
            <Text style={styles.scheduleMetaText}>
              {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
            </Text>
          </View>
          <StatusBadge statusStyle={statusStyle} />
        </View>

        {appointment.completedAt ? (
          <Text style={styles.scheduleMetaText}>
            Completed {`${formatIsoTime(appointment.completedAt)}, ${formatIsoDateTime(appointment.completedAt)}`}
          </Text>
        ) : null}

        {appointment.skippedAt ? (
          <Text style={styles.scheduleMetaText}>
            Skipped {`${formatIsoTime(appointment.skippedAt)}, ${formatIsoDateTime(appointment.skippedAt)}`}
          </Text>
        ) : null}

        {canSelectStatus ? (
          <View style={styles.scheduleActionRow}>
            <ActionButton
              label="Done"
              onPress={() => onStatusChange(appointment, 'completed')}
              variant="outline"
              style={styles.scheduleActionButton}
            />
            <ActionButton
              label="Skip"
              onPress={() => onStatusChange(appointment, 'skipped')}
              variant="outline"
              style={styles.scheduleActionButton}
            />
          </View>
        ) : null}
      </View>
    </>
  );
}

function StatusBadge({ statusStyle }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
      <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
        {statusStyle.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appointmentListItem: {
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
  appointmentListHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardHeaderBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
    paddingRight: spacing.sm,
  },
  cardHeaderName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
  },
  cardHeaderMeta: {
    ...typography.bodySmall,
    color: colors.body,
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
  scheduleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  scheduleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scheduleTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  scheduleCardTitle: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '700',
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
});
