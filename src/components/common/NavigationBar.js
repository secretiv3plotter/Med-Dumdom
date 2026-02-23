import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/Themes';
import AppointmentTrackerButton from '../navigation_bar/AppointmentTrackerButton';
import HomeButton from '../navigation_bar/HomeButton';
import MedTrackerButton from '../navigation_bar/MedTrackerButton';
import NotificationButton from '../navigation_bar/NotificationButton';
import ProgressReportButton from '../navigation_bar/ProgressReportButton';

export default function NavigationBar({
  medDisabled = false,
  appointmentDisabled = false,
  progressDisabled = false,
  notificationsUnread = false,
  selectedTab: selectedTabProp,
  onNavigate,
  showPressAlert = true,
}) {
  const [internalSelectedTab, setInternalSelectedTab] = useState('home');
  const selectedTab = selectedTabProp ?? internalSelectedTab;

  const onTabPress = (tabKey, label) => {
    if (selectedTabProp === undefined) {
      setInternalSelectedTab(tabKey);
    }
    if (showPressAlert) {
      Alert.alert('Navigation', `${label} pressed`);
    }
    onNavigate?.(tabKey);
  };

  return (
    <View style={styles.container}>
      <HomeButton
        variant={selectedTab === 'home' ? 'solid' : 'outline'}
        onPress={() => onTabPress('home', 'Home')}
      />
      <MedTrackerButton
        variant={selectedTab === 'med' ? 'solid' : 'outline'}
        onPress={() => onTabPress('med', 'Med')}
        disabled={medDisabled}
      />
      <AppointmentTrackerButton
        variant={selectedTab === 'appointment' ? 'solid' : 'outline'}
        onPress={() => onTabPress('appointment', 'Appts')}
        disabled={appointmentDisabled}
      />
      <ProgressReportButton
        variant={selectedTab === 'progress' ? 'solid' : 'outline'}
        onPress={() => onTabPress('progress', 'Report')}
        disabled={progressDisabled}
      />
      <NotificationButton
        variant={selectedTab === 'notification' ? 'solid' : 'outline'}
        onPress={() => onTabPress('notification', 'Alerts')}
        showDot={notificationsUnread && selectedTab !== 'notification'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    width: '100%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
    flexDirection: 'row',
  },
});
