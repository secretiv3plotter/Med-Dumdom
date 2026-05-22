import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import TrackerActionCard from '../../../shared/components/common/TrackerActionCard';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import medTrackerService from '../../../domain/services/MedTrackerService';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import PatientIdCard, { formatBirthdate, getWideProfileSpacing } from '../components/PatientIdCard';
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

const STATUS_RANKS = {
  due: 0,
  missed: 1,
  pending: 2,
  upcoming: 3,
  inactive: 4,
};

const actionColor = '#475568';
const headerActionIconSize = moderateScale(30);
const helpIconSize = moderateScale(34);

const parseDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;
  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDashboardDate = (value) => {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const scheduleSortMinutes = (entry) => {
  if (isIntervalScheduleEntry(entry)) return -1;
  const match = String(entry?.scheduledTime || '').match(/^(\d{1,2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.MAX_SAFE_INTEGER;
};

const buildMostDueMedSchedule = (medicines, now) => {
  const candidates = medicines.flatMap((medicine) =>
    (medicine.dailySched || []).map((entry, index) => {
      const statusStyle = getScheduleStatusStyle(medicine, index, now);
      const dayLabel = getScheduleDayLabel(entry, now);
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
  ).filter((item) => !item.isAsNeeded && !['taken', 'skipped', 'completed', 'inactive'].includes(item.status));

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
  const { currentUser } = useFirebase();
  const { colorBlindModeEnabled } = useTextScale();
  const [containerWidth, setContainerWidth] = useState(0);
  const isCompact = containerWidth > 0 && containerWidth < 340;
  const wideProfileSpacing = getWideProfileSpacing(containerWidth);

  const fallbackPatientName = navigation?.currentParams?.patientName || 'Patient';
  const [patientFullName, setPatientFullName] = useState(fallbackPatientName);
  const [patientBirthdate, setPatientBirthdate] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isProfileEmpty, setIsProfileEmpty] = useState(false);
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

  const refreshProfileSummary = () => {
    const profile = activeProfileService.getProfile(currentUser.uid);
    const fullName = String(profile?.fullName || profile?.name || '').trim();
    const birthdate = profile?.birthDate || profile?.birthdate || null;
    const picture = profile?.profilePicture?.trim?.() || '';
    const hasInfo = Boolean(fullName || birthdate || picture);

    setPatientFullName(fullName || fallbackPatientName);
    setPatientBirthdate(birthdate);
    setProfilePictureUrl(picture);
    setIsProfileEmpty(Boolean(profile) && !hasInfo);
  };

  useEffect(() => {
    refreshProfileSummary();

    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      refreshProfileSummary();
    });

    return () => {
      if (typeof unsubscribeFocus === 'function') unsubscribeFocus();
    };
  }, [navigation, activeProfileService, fallbackPatientName]);

  useEffect(() => {
    const intervalId = setInterval(() => setObservedNow(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const profileImageSource = useMemo(
    () => (profilePictureUrl ? { uri: profilePictureUrl } : null),
    [profilePictureUrl]
  );

  const formattedBirthdate = useMemo(() => formatBirthdate(patientBirthdate), [patientBirthdate]);

  const footerNav = useScrollAwareFooterNav();

  const mostDueMedSchedule = useMemo(() => {
    try {
      return buildMostDueMedSchedule(activeMedTrackerService.listMedEntries(currentUser.uid), observedNow);
    } catch (error) {
      console.warn('Failed to load dashboard medicine schedule:', error);
      return null;
    }
  }, [activeMedTrackerService, observedNow]);

  const mostDueAppointment = useMemo(() => {
    try {
      return buildMostDueAppointment(activeApptTrackerService.listApptEntries(currentUser.uid), observedNow);
    } catch (error) {
      console.warn('Failed to load dashboard appointment schedule:', error);
      return null;
    }
  }, [activeApptTrackerService, observedNow]);

  const medContent = useMemo(() => {
    if (!mostDueMedSchedule) return null;
    const { title, subtitle, timeText } = mostDueMedSchedule;
    return [title, subtitle, timeText].filter(Boolean).join('\n');
  }, [mostDueMedSchedule]);

  const apptContent = useMemo(() => {
    if (!mostDueAppointment) return null;
    const { title, subtitle, timeText } = mostDueAppointment;
    return [title, subtitle, timeText].filter(Boolean).join('\n');
  }, [mostDueAppointment]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) navigation?.navigate?.(targetRoute);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.peopleWrapper} pointerEvents="none">
        <Image
          source={colorBlindModeEnabled ? require('../../../assets/pilestone.png') : require('../../../assets/people.png')}
          style={styles.peopleImage}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <View style={styles.topSection} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
        <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
          {isCompact && (
            <View style={[styles.actionRail, styles.actionRailCompact]}>
              <DashboardAction
                label="Settings"
                iconName="settings-outline"
                iconSize={headerActionIconSize}
                isCompact
                onPress={() => navigation?.navigate?.(ROUTES.SETTINGS, { returnTo: ROUTES.HOME })}
              />
              <DashboardAction
                label="Help"
                iconName="help-circle-outline"
                iconSize={helpIconSize}
                isCompact
                onPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME })}
              />
            </View>
          )}

          <PatientIdCard
            name={patientFullName}
            birthdate={formattedBirthdate}
            imageSource={profileImageSource}
            isEmpty={isProfileEmpty}
            isCompact={isCompact}
            wideSpacing={wideProfileSpacing}
            onPress={() => navigation?.navigate?.(ROUTES.PROFILE, { returnTo: ROUTES.HOME })}
          />

          {!isCompact && (
            <View style={styles.actionRail}>
              <DashboardAction
                label="Settings"
                iconName="settings-outline"
                iconSize={headerActionIconSize}
                onPress={() => navigation?.navigate?.(ROUTES.SETTINGS, { returnTo: ROUTES.HOME })}
              />
              <DashboardAction
                label="Help"
                iconName="help-circle-outline"
                iconSize={helpIconSize}
                onPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME })}
              />
            </View>
          )}
        </View>
      </View>

      <ThemedScrollView
        backgroundColor="transparent"
        contentContainerStyle={styles.container}
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        <TrackerActionCard
          medContent={medContent}
          medLabel={mostDueMedSchedule?.label}
          apptContent={apptContent}
          apptLabel={mostDueAppointment?.label}
          onMedPress={() => navigation?.navigate?.(ROUTES.MED_TRACKER)}
          onMedAddPress={() => navigation?.navigate?.(ROUTES.MED_TRACKER, { autoOpenCreate: true })}
          onApptPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER)}
          onApptAddPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER, { autoOpenCreate: true })}
        />
      </ThemedScrollView>

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

function DashboardAction({ iconName, iconSize, label, isCompact = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [
        styles.actionButton,
        isCompact && styles.actionButtonCompact,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <View style={[styles.actionIconWrap, isCompact && styles.actionIconWrapCompact]}>
        <Ionicons name={iconName} size={iconSize} color={actionColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  peopleWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  peopleImage: {
    width: '100%',
    height: '100%',
  },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.pageBg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  headerRowCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionRail: {
    width: moderateScale(72),
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  actionRailCompact: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 0,
    paddingVertical: spacing.xs,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xxs,
    minWidth: moderateScale(56),
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  actionButtonCompact: {
    minWidth: moderateScale(48),
    paddingHorizontal: spacing.xxs,
  },
  actionIconWrap: {
    width: moderateScale(56),
    height: moderateScale(56),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -moderateScale(6),
  },
  actionIconWrapCompact: {
    width: moderateScale(44),
  },
  actionButtonPressed: {
    backgroundColor: '#E6F1F7',
  },
  actionLabel: {
    color: actionColor,
    fontSize: getFontSize(14),
    lineHeight: getLineHeight(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.md,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
