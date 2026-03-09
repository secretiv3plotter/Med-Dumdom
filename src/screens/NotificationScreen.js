import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import ClickableCard from '../components/common/ClickableCard';
import NavigationBar from '../components/common/NavigationBar';
import { ROUTES } from '../constants/routes';
import { colors, spacing, typography } from '../constants/Themes';

const TOP_OVERLAY_HEIGHT = 100;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Medication Reminder',
    body: "It's almost time to take your 8:00 AM medication dose.",
    footer: 'Today, 7:45 AM',
  },
  {
    id: 'notif-2',
    title: 'Appointment Update',
    body: 'Your check-up with Dr. Santos is scheduled for tomorrow at 10:30 AM.',
    footer: 'Today, 6:20 AM',
  },
  {
    id: 'notif-3',
    title: 'Progress Alert',
    body: "You've completed all medication logs for this week.",
    footer: 'Yesterday, 8:10 PM',
  },
  {
    id: 'notif-4',
    title: 'System Notice',
    body: 'New health tips are available in your dashboard feed.',
    footer: 'Yesterday, 3:05 PM',
  },
  {
    id: 'notif-5',
    title: 'Hydration Check',
    body: 'Log your water intake for the afternoon.',
    footer: 'Yesterday, 1:30 PM',
  },
  {
    id: 'notif-6',
    title: 'Medication Reminder',
    body: "Don't forget your evening dose at 8:00 PM.",
    footer: 'Monday, 7:45 PM',
  },
  {
    id: 'notif-7',
    title: 'Appointment Reminder',
    body: 'You have a lab visit in 2 days at 9:00 AM.',
    footer: 'Monday, 9:15 AM',
  },
  {
    id: 'notif-8',
    title: 'Streak Milestone',
    body: 'Great work. You have logged medication for 10 days straight.',
    footer: 'Sunday, 8:05 PM',
  },
  {
    id: 'notif-9',
    title: 'Profile Tip',
    body: 'Add your emergency contact for better account safety.',
    footer: 'Sunday, 4:40 PM',
  },
  {
    id: 'notif-10',
    title: 'Sleep Reminder',
    body: 'Set your preferred bedtime notification in settings.',
    footer: 'Saturday, 10:10 PM',
  },
  {
    id: 'notif-11',
    title: 'Medication Supply',
    body: 'Your current medication may run out in 3 days.',
    footer: 'Saturday, 7:20 AM',
  },
  {
    id: 'notif-12',
    title: 'Weekly Summary',
    body: 'Your adherence report for this week is ready.',
    footer: 'Friday, 6:00 PM',
  },
];

export default function NotificationScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.backButtonWrap}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>All notification updates appear here.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {PLACEHOLDER_NOTIFICATIONS.map((item) => (
            <ClickableCard
              key={item.id}
              title={item.title}
              subtitle={item.body}
              details={item.footer}
              size="landscape"
              variant="solid"
              onPress={() => {}}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar
          selectedTab="notification"
          showPressAlert={false}
          onNavigate={onTabNavigate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: TOP_OVERLAY_HEIGHT,
    paddingBottom: 150,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'left',
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'left',
  },
  list: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  stickyTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: TOP_OVERLAY_HEIGHT,
  },
  backButtonWrap: {
    alignSelf: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
