import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { colors, getFontSize, getLineHeight, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import {
  formatDate,
  formatTime,
  getApptStatusStyle,
} from '../utils/apptTrackerUtils';

const PILL_RADIUS = moderateScale(999);

export function AppointmentPreviewCard({ appointment, observedNow, onOpen, onStatusChange, muted = false }) {
  const statusStyle = getApptStatusStyle(appointment, observedNow);
  const canSelectStatus = appointment.isScheduleActionAvailable?.(observedNow, observedNow);

  const concern = appointment.concern || '';
  const baseFontSize = typography.body?.fontSize || 16;
  let numericBaseFontSize = 16;

  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 16;
  } else {
    numericBaseFontSize = baseFontSize;
  }

  // Dynamic scale down for long appointment concerns so they never wrap/crop on narrow viewports
  const dynamicFontSize = concern.length > 14 ? Math.max(11, numericBaseFontSize * 0.82) : numericBaseFontSize;
  const finalFontSize = getFontSize(dynamicFontSize);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${appointment.concern} details`}
      unstable_pressDelay={0}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.appointmentListItem,
        muted && styles.mutedAppointmentListItem,
        pressed && (muted ? styles.pressedMutedCard : styles.pressedCard),
      ]}
    >
      <View style={styles.appointmentListHeader}>
        <View style={styles.cardHeaderBlock}>
          <Text 
            style={[styles.cardHeaderName, { fontSize: finalFontSize }]} 
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {appointment.concern}
          </Text>
          <Text style={styles.cardHeaderMeta} numberOfLines={1}>
            {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
          </Text>
          <Text style={styles.cardHeaderMeta} numberOfLines={1}>{appointment.address}</Text>
        </View>
        <StatusBadge statusStyle={statusStyle} />
      </View>

      {canSelectStatus && !appointment.isCompleted && !appointment.isSkipped ? (
        <View style={styles.appointmentFooter}>
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
    </Pressable>
  );
}

export function AppointmentDetailsContent({ appointment, observedNow, onStatusChange, muted = false }) {
  const statusStyle = getApptStatusStyle(appointment, observedNow);
  const canSelectStatus = appointment.isScheduleActionAvailable?.(observedNow, observedNow);
  const isResolved = appointment.isCompleted || appointment.isSkipped;

  return (
    <>
      <View style={[
        styles.scheduleCard,
        muted ? styles.mutedScheduleCard : { backgroundColor: statusStyle.bgColor },
      ]}>
        <View style={styles.scheduleCardRow}>
          <View style={styles.scheduleTextBlock}>
            <Text style={styles.scheduleCardTitle}>Appointment schedule</Text>
            <Text style={styles.scheduleMetaText}>
              {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
            </Text>
          </View>
          <StatusBadge statusStyle={statusStyle} />
        </View>

        {muted && isResolved ? (
          <View style={styles.scheduleActionRow}>
            <ActionButton
              label="Revert Status"
              onPress={() => onStatusChange(appointment, 'clear')}
              variant="outline"
              style={[styles.scheduleActionButton, styles.revertStatusButton]}
              textStyle={styles.revertStatusButtonText}
              preserveFontSize
            />
          </View>
        ) : canSelectStatus && !isResolved ? (
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
  const label = statusStyle.label || '';
  const baseFontSize = typography.bodySmall?.fontSize || 12;
  let numericBaseFontSize = 12;

  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 12;
  } else {
    numericBaseFontSize = baseFontSize;
  }

  // Dynamic scale down for long status badge labels inside appointment preview cards
  const dynamicFontSize = label.length > 7 ? Math.max(9, numericBaseFontSize * 0.82) : numericBaseFontSize;
  const finalFontSize = getFontSize(dynamicFontSize);

  return (
    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
      <Text 
        style={[
          styles.statusText, 
          { color: statusStyle.textColor, fontSize: finalFontSize }
        ]} 
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {label}
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
  mutedAppointmentListItem: {
    backgroundColor: '#E5E7EB',
    borderColor: '#CBD5E1',
  },
  pressedCard: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  pressedMutedCard: {
    backgroundColor: '#D1D5DB',
    borderColor: '#94A3B8',
  },
  appointmentListHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  appointmentFooter: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  scheduleCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  mutedScheduleCard: {
    backgroundColor: '#E5E7EB',
    borderColor: colors.border,
  },
  scheduleCardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexShrink: 1,
  },
  revertStatusButton: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  revertStatusButtonText: {
    color: colors.error,
  },
});
