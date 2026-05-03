import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import AppointmentTrackerButton from '../navigation/AppointmentTrackerButton';
import HomeButton from '../navigation/HomeButton';
import MedTrackerButton from '../navigation/MedTrackerButton';

export default function NavigationBar({
  medDisabled = false,
  appointmentDisabled = false,
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
      <MedTrackerButton
        variant={selectedTab === 'med' ? 'solid' : 'outline'}
        onPress={() => onTabPress('med', 'Med')}
        disabled={medDisabled}
      />
      <HomeButton
        variant={selectedTab === 'home' ? 'solid' : 'outline'}
        onPress={() => onTabPress('home', 'Home')}
      />
      <AppointmentTrackerButton
        variant={selectedTab === 'appointment' ? 'solid' : 'outline'}
        onPress={() => onTabPress('appointment', 'Appts')}
        disabled={appointmentDisabled}
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
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    flexDirection: 'row',
  },
});
