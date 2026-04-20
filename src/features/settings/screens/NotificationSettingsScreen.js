import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../shared/components/common/BackButton';
import DurationPicker from '../../../shared/components/common/DurationPicker';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const MIN_TIME_VALUE = 0;
const MAX_TIME_VALUE = 59;
const DEFAULT_MEDICINE_TIME = { hours: 0, minutes: 5 };
const DEFAULT_APPOINTMENT_TIME = { days: 1, hours: 0, minutes: 0 };

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    vibration: true,
    medicineReminders: true,
    appointmentReminders: true,
    medicineOnTime: false,
    appointmentOnTime: false,
    medicineHours: DEFAULT_MEDICINE_TIME.hours,
    medicineMinutes: DEFAULT_MEDICINE_TIME.minutes,
    appointmentDays: DEFAULT_APPOINTMENT_TIME.days,
    appointmentHours: DEFAULT_APPOINTMENT_TIME.hours,
    appointmentMinutes: DEFAULT_APPOINTMENT_TIME.minutes,
  });
  const { height } = useWindowDimensions();
  const contentTopPadding = Math.max(spacing.lg, Math.min(56, Math.round(height * 0.055)));
  const contentBottomPadding = Math.max(136, Math.round(height * 0.19));

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((previousState) => ({
      ...previousState,
      [key]: value,
    }));
  };

  const setOnTime = (sectionKey, enabled) => {
    if (sectionKey === 'medicine') {
      setSettings((previousState) => ({
        ...previousState,
        medicineOnTime: enabled,
        medicineHours: enabled ? 0 : DEFAULT_MEDICINE_TIME.hours,
        medicineMinutes: enabled ? 0 : DEFAULT_MEDICINE_TIME.minutes,
      }));
      return;
    }

    setSettings((previousState) => ({
      ...previousState,
      appointmentOnTime: enabled,
      appointmentDays: enabled ? 0 : DEFAULT_APPOINTMENT_TIME.days,
      appointmentHours: enabled ? 0 : DEFAULT_APPOINTMENT_TIME.hours,
      appointmentMinutes: enabled ? 0 : DEFAULT_APPOINTMENT_TIME.minutes,
    }));
  };

  const medicineTimingLabel = useMemo(
    () => `${settings.medicineHours}h ${settings.medicineMinutes}m`,
    [settings.medicineHours, settings.medicineMinutes],
  );
  const appointmentTimingLabel = useMemo(
    () => `${settings.appointmentDays}d ${settings.appointmentHours}h ${settings.appointmentMinutes}m`,
    [settings.appointmentDays, settings.appointmentHours, settings.appointmentMinutes],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} showLabel={false} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: contentTopPadding,
            paddingBottom: contentBottomPadding,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="notifications-outline" size={28} color={colors.title} />
            <Text style={styles.title}>Notification Settings</Text>
          </View>
          <Text style={styles.subtitle}>Manage how you receive alerts and reminders.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitleWrap}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.title} />
              <Text style={styles.rowTitle}>Vibration</Text>
            </View>
            <ToggleButton value={settings.vibration} onChange={(nextValue) => updateSetting('vibration', nextValue)} size={20} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitleWrap}>
              <Ionicons name="medkit-outline" size={24} color={colors.title} />
              <Text style={styles.rowTitle}>Medicine Reminders</Text>
            </View>
            <ToggleButton
              value={settings.medicineReminders}
              onChange={(nextValue) => updateSetting('medicineReminders', nextValue)}
              size={20}
            />
          </View>

          <View style={styles.timingBlock}>
            <View style={styles.timingHeaderRow}>
              <Text style={styles.timingTitle}>Reminder Timing</Text>
              <Pressable
                onPress={() => setOnTime('medicine', !settings.medicineOnTime)}
                accessibilityRole="button"
                accessibilityLabel="Set medicine reminder to on time"
                accessibilityState={{ selected: settings.medicineOnTime, disabled: !settings.medicineReminders }}
                disabled={!settings.medicineReminders}
                style={[
                  styles.onTimeChip,
                  !settings.medicineReminders && styles.onTimeChipDisabled,
                  settings.medicineOnTime && styles.onTimeChipSelected,
                ]}
              >
                <Text style={[styles.onTimeChipText, settings.medicineOnTime && styles.onTimeChipTextSelected]}>On Time</Text>
              </Pressable>
            </View>
            <Text style={styles.timingSummary}>
              {settings.medicineOnTime ? 'On time (0m before schedule)' : `${medicineTimingLabel} before schedule`}
            </Text>
            <View style={styles.separator} />

            <DurationPicker
              disabled={!settings.medicineReminders || settings.medicineOnTime}
              units={[
                {
                  key: 'medicineHours',
                  label: 'Hours',
                  value: settings.medicineHours,
                  min: MIN_TIME_VALUE,
                  max: MAX_TIME_VALUE,
                  onChange: (nextValue) => updateSetting('medicineHours', nextValue),
                },
                {
                  key: 'medicineMinutes',
                  label: 'Minutes',
                  value: settings.medicineMinutes,
                  min: MIN_TIME_VALUE,
                  max: MAX_TIME_VALUE,
                  onChange: (nextValue) => updateSetting('medicineMinutes', nextValue),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitleWrap}>
              <Ionicons name="calendar-outline" size={24} color={colors.title} />
              <Text style={styles.rowTitle}>Appointment Reminders</Text>
            </View>
            <ToggleButton
              value={settings.appointmentReminders}
              onChange={(nextValue) => updateSetting('appointmentReminders', nextValue)}
              size={20}
            />
          </View>

          <View style={styles.timingBlock}>
            <View style={styles.timingHeaderRow}>
              <Text style={styles.timingTitle}>Reminder Timing</Text>
              <Pressable
                onPress={() => setOnTime('appointment', !settings.appointmentOnTime)}
                accessibilityRole="button"
                accessibilityLabel="Set appointment reminder to on time"
                accessibilityState={{ selected: settings.appointmentOnTime, disabled: !settings.appointmentReminders }}
                disabled={!settings.appointmentReminders}
                style={[
                  styles.onTimeChip,
                  !settings.appointmentReminders && styles.onTimeChipDisabled,
                  settings.appointmentOnTime && styles.onTimeChipSelected,
                ]}
              >
                <Text style={[styles.onTimeChipText, settings.appointmentOnTime && styles.onTimeChipTextSelected]}>On Time</Text>
              </Pressable>
            </View>
            <Text style={styles.timingSummary}>
              {settings.appointmentOnTime ? 'On time (0m before schedule)' : `${appointmentTimingLabel} before schedule`}
            </Text>
            <View style={styles.separator} />

            <DurationPicker
              disabled={!settings.appointmentReminders || settings.appointmentOnTime}
              units={[
                {
                  key: 'appointmentDays',
                  label: 'Days',
                  value: settings.appointmentDays,
                  min: 0,
                  max: 30,
                  onChange: (nextValue) => updateSetting('appointmentDays', nextValue),
                },
                {
                  key: 'appointmentHours',
                  label: 'Hours',
                  value: settings.appointmentHours,
                  min: MIN_TIME_VALUE,
                  max: MAX_TIME_VALUE,
                  onChange: (nextValue) => updateSetting('appointmentHours', nextValue),
                },
                {
                  key: 'appointmentMinutes',
                  label: 'Minutes',
                  value: settings.appointmentMinutes,
                  min: MIN_TIME_VALUE,
                  max: MAX_TIME_VALUE,
                  onChange: (nextValue) => updateSetting('appointmentMinutes', nextValue),
                },
              ]}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="notification" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  stickyTop: {
    position: 'absolute',
    top: spacing.md + spacing.sm,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xxl,
  },
  header: {
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
    marginLeft: 1,
  },
  section: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  timingBlock: {
    gap: spacing.sm,
    marginLeft: 0,
    alignItems: 'center',
  },
  timingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    width: '100%',
  },
  timingTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '500',
  },
  onTimeChip: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  onTimeChipSelected: {
    backgroundColor: colors.brand,
  },
  onTimeChipDisabled: {
    borderColor: colors.border,
    opacity: 0.55,
  },
  onTimeChipText: {
    ...typography.bodySmall,
    color: colors.brand,
    fontWeight: '600',
  },
  onTimeChipTextSelected: {
    color: colors.surface,
  },
  timingSummary: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    width: '100%',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
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
