import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import NavigationBar from '../components/common/NavigationBar';
import ToggleButton from '../components/common/ToggleButton';
import { ROUTES } from '../constants/routes';
import { colors, spacing, typography } from '../constants/Themes';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const permissionGroups = [
  {
    id: 'viewing',
    title: 'Viewing Permissions',
    icon: 'stats-chart-outline',
    items: [
      { id: 'viewMedication', label: 'View Medication Tracker', defaultValue: false },
      { id: 'viewConsultation', label: 'View Consultation Tracker', defaultValue: true },
    ],
  },
  {
    id: 'editing',
    title: 'Editing Permissions',
    icon: 'create-outline',
    items: [
      { id: 'editMedication', label: 'Modify Medication Tracker', defaultValue: false },
      { id: 'editConsultation', label: 'Modify Consultation Tracker', defaultValue: true },
    ],
  },
  {
    id: 'notifications',
    title: 'Notification Permissions',
    icon: 'notifications-outline',
    items: [
      { id: 'manualReminders', label: 'Send Manual Reminders', defaultValue: false },
      { id: 'manageMedReminders', label: 'Manage Medication Reminders', defaultValue: true },
      { id: 'manageConsultReminders', label: 'Manage Consultation Reminders', defaultValue: true },
    ],
  },
  {
    id: 'reportSharing',
    title: 'Progress Report Sharing',
    icon: 'open-outline',
    items: [
      { id: 'viewReport', label: 'View Progress Report', defaultValue: false },
      { id: 'exportMedicalData', label: 'Export Medical Data', defaultValue: true },
      { id: 'exportConsultData', label: 'Export Consultation Data', defaultValue: false },
    ],
  },
];

const defaultPermissions = permissionGroups.reduce((accumulator, group) => {
  group.items.forEach((item) => {
    accumulator[item.id] = item.defaultValue;
  });
  return accumulator;
}, {});

export default function PrivacySettings({ navigation }) {
  const [permissions, setPermissions] = useState(defaultPermissions);
  const { height } = useWindowDimensions();
  const contentTopPadding = Math.max(spacing.lg, Math.min(56, Math.round(height * 0.055)));
  const contentBottomPadding = Math.max(136, Math.round(height * 0.19));

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const updatePermission = (permissionId, value) => {
    setPermissions((previousState) => ({
      ...previousState,
      [permissionId]: value,
    }));
  };

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
            <Ionicons name="lock-closed-outline" size={28} color={colors.title} />
            <Text style={styles.title}>Privacy Settings</Text>
          </View>
          <Text style={styles.subtitle}>Manage caregiver access</Text>
        </View>

        {permissionGroups.map((group) => (
          <View key={group.id} style={styles.group}>
            <View style={styles.groupTitleRow}>
              <Ionicons name={group.icon} size={24} color={colors.title} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>

            <View style={styles.groupItems}>
              {group.items.map((item) => {
                const value = permissions[item.id];
                return (
                  <View key={item.id} style={styles.permissionRow}>
                    <Text style={styles.permissionLabel}>{item.label}</Text>
                    <View style={styles.permissionToggleWrap}>
                      <Text style={styles.permissionValue}>{value ? 'Yes' : 'No'}</Text>
                      <ToggleButton value={value} onChange={(nextValue) => updatePermission(item.id, nextValue)} size={20} />
                    </View>
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
    gap: spacing.sm,
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
    gap: spacing.sm,
    marginLeft: 0,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  permissionLabel: {
    ...typography.body,
    color: colors.body,
    flex: 1,
  },
  permissionToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minWidth: 78,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  permissionValue: {
    ...typography.button,
    color: colors.title,
    textAlign: 'left',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
