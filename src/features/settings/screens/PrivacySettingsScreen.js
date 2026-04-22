import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import privacySettingsService from '../../../domain/services/PrivacySettingsService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const CURRENT_PATIENT_ID = 'current-patient';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const PERMISSION_GROUPS = [
  {
    id: 'tracker_access',
    title: 'Tracker access',
    icon: 'stats-chart-outline',
    items: [
      { key: 'medTrackerPermit', label: 'View medication tracker' },
      { key: 'consultTrackerPermit', label: 'View appointment tracker' },
      { key: 'modifyMedTracker', label: 'Modify medication tracker' },
      { key: 'modifyApptTracker', label: 'Modify appointment tracker' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports and sharing',
    icon: 'document-text-outline',
    items: [
      { key: 'viewReportPermit', label: 'View progress report' },
      { key: 'exportMedReportPermit', label: 'Export medication report' },
      { key: 'exportApptReportPermit', label: 'Export appointment report' },
    ],
  },
  {
    id: 'reminders',
    title: 'Reminder access',
    icon: 'notifications-outline',
    items: [
      { key: 'manualCaregiverReminderPermit', label: 'Send manual caregiver reminders' },
    ],
  },
];

export default function PrivacySettingsScreen({ navigation }) {
  const [permissions, setPermissions] = useState(() =>
    privacySettingsService.getPrivacySettings(CURRENT_PATIENT_ID)
  );
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

  const updatePermission = (permissionKey, value) => {
    setPermissions(
      privacySettingsService.updatePrivacySettings(CURRENT_PATIENT_ID, {
        [permissionKey]: value,
      })
    );
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
          <View style={styles.headerTitleRow}>
            <Ionicons name="lock-closed-outline" size={28} color={colors.title} />
            <Text style={styles.title}>Privacy Settings</Text>
          </View>
          <Text style={styles.subtitle}>Manage caregiver access using the permissions defined in the privacy model.</Text>
        </View>

        {PERMISSION_GROUPS.map((group) => (
          <View key={group.id} style={styles.group}>
            <View style={styles.groupTitleRow}>
              <Ionicons name={group.icon} size={24} color={colors.title} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>

            <View style={styles.groupItems}>
              {group.items.map((item, index) => {
                const value = Boolean(permissions[item.key]);
                return (
                  <View key={item.key}>
                    <View style={styles.permissionRow}>
                      <Text style={styles.permissionLabel}>{item.label}</Text>
                      <View style={styles.permissionToggleWrap}>
                        <Text style={styles.permissionValue}>{value ? 'Yes' : 'No'}</Text>
                        <ToggleButton value={value} onChange={(nextValue) => updatePermission(item.key, nextValue)} size={20} />
                      </View>
                    </View>
                    {index < group.items.length - 1 ? <View style={styles.permissionDivider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
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
  group: {
    gap: spacing.md,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  groupItems: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: 0,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  permissionLabel: {
    ...typography.body,
    color: colors.body,
    flex: 1,
    lineHeight: 24,
  },
  permissionToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 88,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  permissionValue: {
    ...typography.button,
    color: colors.title,
    textAlign: 'left',
  },
  permissionDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.75,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
