import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import ClickableCard from '../components/common/ClickableCard';
import DashboardHeader from '../components/common/DashboardHeader';
import NavigationBar from '../components/common/NavigationBar';
import { ROUTES } from '../constants/routes';
import { colors, spacing, typography } from '../constants/Themes';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function PatientSpecificDashboard({ navigation }) {
  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyHeader}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
        <DashboardHeader
          firstName="John"
          onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT)}
          onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE)}
          profileImageSource={{ uri: 'https://i.pravatar.cc/224?img=12' }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Patient Dashboard</Text>
        <Text style={styles.subtitle}>Quick access to caregiver permissions and alerts.</Text>
        <ClickableCard
          size="landscape"
          title="Link to Caregiver"
          subtitle="Invite a caregiver to support your care"
          details="Browse available caregivers and send access requests"
          leftSlot={<Ionicons name="people-outline" size={24} color={colors.title} />}
          onPress={() => navigation?.navigate?.(ROUTES.LINK_TO_CAREGIVER)}
          cardStyle={styles.card}
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
        <ClickableCard
          size="landscape"
          title="Privacy Settings"
          subtitle="Manage caregiver access"
          details="Viewing, editing, reminders, and data sharing"
          leftSlot={<Ionicons name="lock-closed-outline" size={24} color={colors.title} />}
          onPress={() => navigation?.navigate?.(ROUTES.PRIVACY_SETTINGS)}
          cardStyle={styles.card}
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
        <ClickableCard
          size="landscape"
          title="Notification Settings"
          subtitle="Control reminders and alert behavior"
          details="Permissions, schedule, duration, and channels"
          leftSlot={<Ionicons name="notifications-outline" size={24} color={colors.title} />}
          onPress={() => navigation?.navigate?.(ROUTES.NOTIFICATION_SETTINGS)}
          cardStyle={styles.card}
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
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
  stickyHeader: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  container: {
    paddingTop: 160,
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.body,
  },
  card: {
    marginTop: spacing.sm,
  },
  cardTitle: {
    color: colors.title,
  },
  cardSubtitle: {
    color: colors.body,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
