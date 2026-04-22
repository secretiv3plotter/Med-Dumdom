import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import reminderService from '../../../domain/services/ReminderService';
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

const formatDateTime = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '--';
  }

  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getReminderDate = (item) => {
  const value = item?.dueAt || item?.createdAt || null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
};

const formatTimeAgo = (value, now = new Date()) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '--';
  }

  const seconds = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return `${Math.floor(seconds / 604800)}w ago`;
};

const getReminderStatusLabel = (item) => {
  if (item?.type === 'medication') {
    const isTaken = item?.status === 'completed' || item?.sourceEntry?.isTaken === true;
    return isTaken ? 'Taken' : 'Not taken';
  }

  if (item?.type === 'appointment') {
    const isCompleted = item?.status === 'completed' || item?.sourceEntry?.isCompleted === true;
    return isCompleted ? 'Completed' : 'Not completed';
  }

  return 'Pending';
};

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

  const notifications = useMemo(() => {
    return reminderService
      .getNotificationFeed(CURRENT_USER_ID)
      .filter((item) => item.type === 'medication' || item.type === 'appointment')
      .sort((left, right) => {
        const leftTime = getReminderDate(left)?.getTime?.() ?? 0;
        const rightTime = getReminderDate(right)?.getTime?.() ?? 0;
        return rightTime - leftTime;
      });
  }, []);

  const handleNotificationPress = (type) => {
    if (type === 'medication') {
      navigation?.navigate?.(ROUTES.MED_TRACKER);
      return;
    }

    if (type === 'appointment') {
      navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER);
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
          <Text style={styles.subtitle}>Scheduled medication and appointment reminders.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {notifications.length ? (
            notifications.map((item) => (
              <Pressable
                key={item.reminderId}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => handleNotificationPress(item.type)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardType}>{item.type}</Text>
                </View>
                <Text style={styles.cardBody}>{item.message}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardFooter}>{formatDateTime(getReminderDate(item))}</Text>
                  <Text style={styles.cardTimeAgo}>{formatTimeAgo(getReminderDate(item))}</Text>
                </View>
                <Text style={styles.cardStatus}>{getReminderStatusLabel(item)}</Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Scheduled medication and appointment reminders will appear here.
              </Text>
            </View>
          )}
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
  content: {
    padding: spacing.lg,
    paddingTop: 100,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    flex: 1,
  },
  cardType: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardBody: {
    ...typography.body,
    color: colors.body,
  },
  cardFooter: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cardTimeAgo: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
  },
  cardStatus: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardPressed: {
    opacity: 0.85,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
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
    minHeight: 100,
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
