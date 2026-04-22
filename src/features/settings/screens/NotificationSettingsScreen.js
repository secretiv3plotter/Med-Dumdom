import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import DurationPicker from '../../../shared/components/common/DurationPicker';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import notifSettingsService from '../../../domain/services/NotifSettingsService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const minutesToDurationParts = (value) => {
  const totalMinutes = Math.max(0, Number(value) || 0);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
};

const durationPartsToMinutes = ({ days = 0, hours = 0, minutes = 0 }) =>
  Number(days || 0) * 24 * 60 + Number(hours || 0) * 60 + Number(minutes || 0);

const toEditableDraft = (settings) => ({
  vibrationEnabled: settings.vibrationEnabled,
  medRemindersEnabled: settings.medRemindersEnabled,
  apptRemindersEnabled: settings.apptRemindersEnabled,
  medReminderTime:
    settings.medReminderTime === null || settings.medReminderTime === undefined
      ? ''
      : String(settings.medReminderTime),
  apptReminderTime:
    settings.apptReminderTime === null || settings.apptReminderTime === undefined
      ? ''
      : String(settings.apptReminderTime),
  medSnoozeDuration:
    settings.medSnoozeDuration === null || settings.medSnoozeDuration === undefined
      ? ''
      : String(settings.medSnoozeDuration),
  apptSnoozeDuration:
    settings.apptSnoozeDuration === null || settings.apptSnoozeDuration === undefined
      ? ''
      : String(settings.apptSnoozeDuration),
});

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(() => notifSettingsService.getSettings(CURRENT_USER_ID));
  const [draft, setDraft] = useState(() => toEditableDraft(settings));
  const [statusMessage, setStatusMessage] = useState('');
  const { height } = useWindowDimensions();
  const contentTopPadding = Math.max(spacing.lg, Math.min(56, Math.round(height * 0.055)));
  const contentBottomPadding = Math.max(136, Math.round(height * 0.19));

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const syncToggle = (key, toggleMethod) => {
    const nextValue = !draft[key];
    const nextSettings = notifSettingsService[toggleMethod](CURRENT_USER_ID);
    setSettings(nextSettings);
    setDraft((current) => ({ ...current, [key]: nextValue }));
  };

  const saveFields = () => {
    let nextSettings = notifSettingsService.getSettings(CURRENT_USER_ID);

    if (draft.medReminderTime !== String(nextSettings.medReminderTime ?? '')) {
      nextSettings = notifSettingsService.updateMedReminderTime(CURRENT_USER_ID, draft.medReminderTime || null);
    }

    if (draft.apptReminderTime !== String(nextSettings.apptReminderTime ?? '')) {
      nextSettings = notifSettingsService.updateApptReminderTime(CURRENT_USER_ID, draft.apptReminderTime || null);
    }

    const nextMedSnooze = draft.medSnoozeDuration.trim();
    const normalizedMedSnooze = nextMedSnooze === '' ? null : Number(nextMedSnooze);
    if ((nextSettings.medSnoozeDuration ?? null) !== normalizedMedSnooze) {
      nextSettings = notifSettingsService.updateMedSnoozeDuration(CURRENT_USER_ID, normalizedMedSnooze);
    }

    const nextApptSnooze = draft.apptSnoozeDuration.trim();
    const normalizedApptSnooze = nextApptSnooze === '' ? null : Number(nextApptSnooze);
    if ((nextSettings.apptSnoozeDuration ?? null) !== normalizedApptSnooze) {
      nextSettings = notifSettingsService.updateApptSnoozeDuration(CURRENT_USER_ID, normalizedApptSnooze);
    }

    if (draft.vibrationEnabled !== nextSettings.vibrationEnabled) {
      nextSettings = notifSettingsService.toggleVibration(CURRENT_USER_ID);
    }

    if (draft.medRemindersEnabled !== nextSettings.medRemindersEnabled) {
      nextSettings = notifSettingsService.toggleMedReminders(CURRENT_USER_ID);
    }

    if (draft.apptRemindersEnabled !== nextSettings.apptRemindersEnabled) {
      nextSettings = notifSettingsService.toggleApptReminders(CURRENT_USER_ID);
    }

    setSettings(nextSettings);
    setDraft(toEditableDraft(nextSettings));
    setStatusMessage('Notification settings saved');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} showLabel={false} />
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
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>Match the reminder options defined in the notification model.</Text>
        </View>

        <SettingCard title="Vibration">
          <ToggleRow
            label="Enable vibration"
            value={draft.vibrationEnabled}
            onChange={() => syncToggle('vibrationEnabled', 'toggleVibration')}
          />
        </SettingCard>

        <SettingCard title="Medication reminders">
          <ToggleRow
            label="Enable medication reminders"
            value={draft.medRemindersEnabled}
            onChange={() => syncToggle('medRemindersEnabled', 'toggleMedReminders')}
          />
          <FieldLabel label="Lead time in minutes before the schedule" />
          <TextInput
            value={draft.medReminderTime}
            onChangeText={(value) => updateDraft('medReminderTime', value.replace(/[^\d]/g, ''))}
            placeholder="5"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            style={styles.textInput}
          />
          <FieldLabel label="Snooze in minutes" />
          <TextInput
            value={draft.medSnoozeDuration}
            onChangeText={(value) => updateDraft('medSnoozeDuration', value.replace(/[^\d]/g, ''))}
            placeholder="10"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            style={styles.textInput}
          />
        </SettingCard>

        <SettingCard title="Appointment reminders">
          <ToggleRow
            label="Enable appointment reminders"
            value={draft.apptRemindersEnabled}
            onChange={() => syncToggle('apptRemindersEnabled', 'toggleApptReminders')}
          />
          <FieldLabel label="Lead time before the schedule" />
          <DurationPicker
            units={[
              {
                key: 'days',
                label: 'Days',
                value: minutesToDurationParts(draft.apptReminderTime).days,
                min: 0,
                max: 30,
                maxLength: 2,
                onChange: (nextDays) => {
                  const current = minutesToDurationParts(draft.apptReminderTime);
                  updateDraft(
                    'apptReminderTime',
                    String(durationPartsToMinutes({ ...current, days: nextDays }))
                  );
                },
              },
              {
                key: 'hours',
                label: 'Hours',
                value: minutesToDurationParts(draft.apptReminderTime).hours,
                min: 0,
                max: 23,
                maxLength: 2,
                onChange: (nextHours) => {
                  const current = minutesToDurationParts(draft.apptReminderTime);
                  updateDraft(
                    'apptReminderTime',
                    String(durationPartsToMinutes({ ...current, hours: nextHours }))
                  );
                },
              },
              {
                key: 'minutes',
                label: 'Minutes',
                value: minutesToDurationParts(draft.apptReminderTime).minutes,
                min: 0,
                max: 59,
                maxLength: 2,
                onChange: (nextMinutes) => {
                  const current = minutesToDurationParts(draft.apptReminderTime);
                  updateDraft(
                    'apptReminderTime',
                    String(durationPartsToMinutes({ ...current, minutes: nextMinutes }))
                  );
                },
              },
            ]}
          />
          <FieldLabel label="Snooze duration" />
          <DurationPicker
            units={[
              {
                key: 'snooze-days',
                label: 'Days',
                value: minutesToDurationParts(draft.apptSnoozeDuration).days,
                min: 0,
                max: 30,
                maxLength: 2,
                onChange: (nextDays) => {
                  const current = minutesToDurationParts(draft.apptSnoozeDuration);
                  updateDraft(
                    'apptSnoozeDuration',
                    String(durationPartsToMinutes({ ...current, days: nextDays }))
                  );
                },
              },
              {
                key: 'snooze-hours',
                label: 'Hours',
                value: minutesToDurationParts(draft.apptSnoozeDuration).hours,
                min: 0,
                max: 23,
                maxLength: 2,
                onChange: (nextHours) => {
                  const current = minutesToDurationParts(draft.apptSnoozeDuration);
                  updateDraft(
                    'apptSnoozeDuration',
                    String(durationPartsToMinutes({ ...current, hours: nextHours }))
                  );
                },
              },
              {
                key: 'snooze-minutes',
                label: 'Minutes',
                value: minutesToDurationParts(draft.apptSnoozeDuration).minutes,
                min: 0,
                max: 59,
                maxLength: 2,
                onChange: (nextMinutes) => {
                  const current = minutesToDurationParts(draft.apptSnoozeDuration);
                  updateDraft(
                    'apptSnoozeDuration',
                    String(durationPartsToMinutes({ ...current, minutes: nextMinutes }))
                  );
                },
              },
            ]}
          />
        </SettingCard>

        <View style={styles.saveWrap}>
          <ActionButton label="Save Changes" variant="solid" onPress={saveFields} />
          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="notification" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function SettingCard({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <View style={styles.rowHeader}>
      <Text style={styles.rowTitle}>{label}</Text>
      <ToggleButton value={value} onChange={onChange} size={20} />
    </View>
  );
}

function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
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
    gap: spacing.lg,
  },
  header: {
    gap: 2,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    color: colors.body,
    flex: 1,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.body,
  },
  saveWrap: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  statusMessage: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
