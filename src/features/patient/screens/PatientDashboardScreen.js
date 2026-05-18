import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import accessibilitySettingsService from '../../../domain/services/AccessibilitySettingsService';
import medTrackerService from '../../../domain/services/MedTrackerService';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';
import {
  formatDoseWithUnit,
  formatTime,
  getIntervalScheduleTime,
  getScheduleDayLabel,
  getScheduleStatusStyle,
  isAsNeededScheduleEntry,
  isIntervalScheduleEntry,
} from '../utils/medTrackerUtils';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const CURRENT_USER_ID = 'current-user';

const STATUS_RANKS = {
  due: 0,
  missed: 1,
  pending: 2,
  upcoming: 3,
};

const parseDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDashboardDate = (value) => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const scheduleSortMinutes = (entry) => {
  if (isIntervalScheduleEntry(entry)) {
    return -1;
  }

  const match = String(entry?.scheduledTime || '').match(/^(\d{1,2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.MAX_SAFE_INTEGER;
};

const buildMostDueMedSchedule = (medicines, now) => {
  const candidates = medicines.flatMap((medicine) =>
    (medicine.dailySched || []).map((entry, index) => {
      const statusStyle = getScheduleStatusStyle(medicine, index, now);
      const dayLabel = getScheduleDayLabel(entry);
      const scheduleTime = isIntervalScheduleEntry(entry)
        ? getIntervalScheduleTime(entry, now)
        : formatTime(entry.scheduledTime);

      return {
        isAsNeeded: isAsNeededScheduleEntry(entry),
        status: statusStyle.status,
        label: statusStyle.label,
        title: medicine.medName,
        subtitle: `Take ${formatDoseWithUnit(entry.doseSize, medicine.unit)}`,
        timeText: `${scheduleTime}${dayLabel ? ` ${dayLabel}` : ''}`,
        rank: STATUS_RANKS[statusStyle.status] ?? 99,
        sortMinutes: scheduleSortMinutes(entry),
      };
    })
  ).filter((item) => !item.isAsNeeded && !['taken', 'skipped', 'completed'].includes(item.status));

  return candidates.sort((left, right) =>
    left.rank - right.rank ||
    left.sortMinutes - right.sortMinutes ||
    left.title.localeCompare(right.title)
  )[0] || null;
};

const buildMostDueAppointment = (appointments, now) => {
  const candidates = appointments
    .filter((appointment) => !appointment.isCompleted && !appointment.isSkipped)
    .map((appointment) => {
      const scheduledAt = typeof appointment.getScheduledDateTime === 'function'
        ? appointment.getScheduledDateTime()
        : parseDateTime(appointment.dateSched, appointment.timeSched);
      const status = typeof appointment.getStatus === 'function'
        ? appointment.getStatus(now, now)
        : (() => {
            const isMissed = Boolean(scheduledAt && scheduledAt < now);
            const isDue = Boolean(scheduledAt && scheduledAt <= now);
            return isDue && !isMissed ? 'due' : isMissed ? 'missed' : 'upcoming';
          })();

      return {
        status,
        label: status === 'due' ? 'Due' : status === 'missed' ? 'Missed' : status === 'pending' ? 'Pending' : 'Upcoming',
        title: appointment.concern,
        subtitle: appointment.address,
        timeText: `${formatDashboardDate(appointment.dateSched)} at ${formatTime(appointment.timeSched).replace('--', '')}`,
        rank: STATUS_RANKS[status] ?? 99,
        scheduledAt,
      };
    });

  return candidates.sort((left, right) =>
    left.rank - right.rank ||
    (left.scheduledAt?.getTime?.() || 0) - (right.scheduledAt?.getTime?.() || 0) ||
    left.title.localeCompare(right.title)
  )[0] || null;
};

export default function PatientDashboardScreen({ navigation, realm = null }) {
  const fallbackPatientName = navigation?.currentParams?.patientName || 'Patient';
  const [patientFirstName, setPatientFirstName] = useState(fallbackPatientName);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [textSizeLevel, setTextSizeLevel] = useState(1);
  const [observedNow, setObservedNow] = useState(() => new Date());

  const activeMedTrackerService = useMemo(
    () => (realm ? new RealmMedTrackerRepository(realm) : medTrackerService),
    [realm],
  );
  const activeApptTrackerService = useMemo(
    () => (realm ? new RealmApptTrackerRepository(realm) : apptTrackerService),
    [realm],
  );
  const activeProfileService = useMemo(
    () => (realm ? new RealmUserRepository(realm) : personalProfileService),
    [realm],
  );
  const activeSettingsService = useMemo(
    () => (realm ? new RealmSettingsPreferenceRepository(realm) : accessibilitySettingsService),
    [realm],
  );

  const refreshProfileSummary = () => {
    const profile = activeProfileService.getProfile(CURRENT_USER_ID);
    const firstName = String(profile?.fullName || '')
      .trim()
      .split(/\s+/)[0];

    setPatientFirstName(firstName || fallbackPatientName);
    setProfilePictureUrl(profile?.profilePicture?.trim?.() || '');
  };

  const refreshAccessibilitySettings = () => {
    const settings = activeSettingsService.getAccessibilitySettings(CURRENT_USER_ID);
    const nextTextSizeLevel = Number(settings?.textSizeLevel);
    setTextSizeLevel(Number.isNaN(nextTextSizeLevel) ? 1 : nextTextSizeLevel);
  };

  useEffect(() => {
    refreshProfileSummary();
    refreshAccessibilitySettings();

    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      refreshProfileSummary();
      refreshAccessibilitySettings();
    });

    return () => {
      if (typeof unsubscribeFocus === 'function') {
        unsubscribeFocus();
      }
    };
  }, [navigation, activeProfileService, activeSettingsService, fallbackPatientName]);

  useEffect(() => {
    const intervalId = setInterval(() => setObservedNow(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const shouldSplitProgramName = textSizeLevel > 1;
  const patientPossessive = patientFirstName.endsWith('s')
    ? `${patientFirstName}'`
    : `${patientFirstName}'s`;

  const profileImageSource = useMemo(
    () => (profilePictureUrl ? { uri: profilePictureUrl } : null),
    [profilePictureUrl]
  );
  const footerNav = useScrollAwareFooterNav();
  const mostDueMedSchedule = useMemo(() => {
    try {
      return buildMostDueMedSchedule(activeMedTrackerService.listMedEntries(CURRENT_USER_ID), observedNow);
    } catch (error) {
      console.warn('Failed to load dashboard medicine schedule:', error);
      return null;
    }
  }, [activeMedTrackerService, observedNow]);

  const mostDueAppointment = useMemo(() => {
    try {
      return buildMostDueAppointment(activeApptTrackerService.listApptEntries(CURRENT_USER_ID), observedNow);
    } catch (error) {
      console.warn('Failed to load dashboard appointment schedule:', error);
      return null;
    }
  }, [activeApptTrackerService, observedNow]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../../../assets/meddumdom banner (1).png')}
        resizeMode="cover"
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
      >
      <View style={styles.bgOverlay} />
      <View style={styles.topSection}>
        <DashboardHeader
          onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME })}
          onSettingsPress={() => navigation?.navigate?.(ROUTES.SETTINGS, { returnTo: ROUTES.HOME })}
          onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE, { returnTo: ROUTES.HOME })}
          profileImageSource={profileImageSource}
          leftGroupStyle={styles.profileContainer}
          profileContent={
            <View style={styles.profileTitleBlock}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.patientTitle}>
                {patientPossessive}
              </Text>
              <Text style={styles.patientProgram}>
                {shouldSplitProgramName ? 'Med\ndumdom' : 'Meddumdom'}
              </Text>
            </View>
          }
          style={styles.header}
        />
      </View>

      <ThemedScrollView
        transparentBackground
        style={styles.transparentScroll}
        contentContainerStyle={styles.container}
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        <View style={styles.dueGrid}>
          <DueScheduleCard
            title="Next medicine"
            emptyTitle="No medicines scheduled"
            emptySubtitle="Add one to get reminders."
            iconName="medkit-outline"
            emptyIconName="notifications-outline"
            ctaLabel="Add medicine"
            item={mostDueMedSchedule}
            onPress={() => navigation?.navigate?.(ROUTES.MED_TRACKER)}
          />
          <DueScheduleCard
            title="Next appointment"
            emptyTitle="No appointments yet"
            emptySubtitle="Add one so you never miss it."
            iconName="calendar-outline"
            emptyIconName="time-outline"
            ctaLabel="Add appointment"
            item={mostDueAppointment}
            onPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER)}
          />
        </View>
      </ThemedScrollView>
      </ImageBackground>

      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[styles.footerNav, { opacity: footerNav.isVisible ? 1 : 0 }]}
      >
        <NavigationBar
          selectedTab="home"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
      </View>
    </SafeAreaView>
  );
}

function DueScheduleCard({
  title,
  item,
  onPress,
  iconName,
  emptyIconName,
  emptyTitle,
  emptySubtitle,
  ctaLabel,
}) {
  return (
    <View style={styles.dueCard}>
      <View style={styles.dueCardTopRow}>
        <View style={styles.dueCardIconChip}>
          <Ionicons name={iconName} size={20} color={colors.brand} />
        </View>
        <Text style={styles.dueCardTitle}>{title}</Text>
      </View>

      <View style={styles.dueCardPanel}>
        {item ? (
          <>
            <View style={styles.dueCardHeaderRow}>
              <Text style={styles.dueCardName}>{item.title}</Text>
              <Text style={[styles.dueBadge, item.status === 'missed' && styles.dueBadgeMissed]}>
                {item.label}
              </Text>
            </View>
            <Text style={styles.dueCardSubtitle}>{item.subtitle}</Text>
            <Text style={styles.dueCardTime}>{item.timeText}</Text>
          </>
        ) : (
          <View style={styles.emptyPanel}>
            <Ionicons name={emptyIconName} size={36} color={colors.bodyMuted} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${ctaLabel}`}
        unstable_pressDelay={0}
        onPress={onPress}
        style={({ pressed }) => [styles.dueActionButton, pressed && styles.dueActionButtonPressed]}
      >
        <Text style={styles.dueActionText}>+  {ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  bgImage: {
    flex: 1,
  },
  bgImageStyle: {
    opacity: 0.9,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pageBg,
    opacity: 0.5,
  },
  transparentScroll: {
    backgroundColor: 'transparent',
  },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
    gap: spacing.xs,
  },
  header: {
    borderBottomWidth: 0,
  },
  profileTitleBlock: {
    flexShrink: 1,
    flex: 1,
    gap: spacing.xxs,
  },
  profileContainer: {
    flex: 1,
    flexShrink: 1,
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 158,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    gap: spacing.sm,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 170,
    gap: spacing.md,
  },
  dueGrid: {
    marginTop: 0,
    gap: spacing.md,
  },
  dueCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dueCardTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  dueCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dueCardIconChip: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  dueCardPanel: {
    minHeight: moderateScale(140),
    borderRadius: radius.md,
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dueCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dueCardName: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  dueCardSubtitle: {
    ...typography.bodySmall,
    color: colors.body,
  },
  dueCardTime: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '700',
  },
  dueBadge: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
    backgroundColor: colors.brandSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    overflow: 'hidden',
  },
  dueBadgeMissed: {
    color: colors.error,
    backgroundColor: '#FEE2E2',
  },
  emptyPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  dueActionButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dueActionButtonPressed: {
    backgroundColor: colors.brandText,
  },
  dueActionText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
  patientTitle: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(24),
  },
  patientProgram: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(24),
    width: '100%',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
