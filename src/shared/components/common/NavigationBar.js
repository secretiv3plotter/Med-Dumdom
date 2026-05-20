import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import AppointmentTrackerButton from '../navigation/AppointmentTrackerButton';
import HomeButton from '../navigation/HomeButton';
import MedTrackerButton from '../navigation/MedTrackerButton';
import { useTextScale } from '../../theme/textScale';

export default function NavigationBar({
  medDisabled = false,
  appointmentDisabled = false,
  selectedTab: selectedTabProp,
  onNavigate,
  showPressAlert = true,
  hidden = false,
}) {
  const { darkModeEnabled } = useTextScale();
  const [internalSelectedTab, setInternalSelectedTab] = useState('home');
  const selectedTab = selectedTabProp ?? internalSelectedTab;
  const hiddenProgress = useRef(new Animated.Value(hidden ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(hiddenProgress, {
      toValue: hidden ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [hidden, hiddenProgress]);

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
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      style={[
        styles.animatedWrap,
        {
          opacity: hiddenProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateY: hiddenProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 96],
              }),
            },
          ],
        },
      ]}
    >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrap: {
    width: '100%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
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
