import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_RESERVED_HEIGHT,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import accessibilitySettingsService from '../../../domain/services/AccessibilitySettingsService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import Slider from '@react-native-community/slider';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const CURRENT_USER_ID = 'current-user';

const ACCESSIBILITY_TOGGLES = [
  { key: 'highContrastEnabled', label: 'High contrast', toggle: 'toggleHighContrast' },
  { key: 'reducedMotionEnabled', label: 'Reduced motion', toggle: 'toggleReducedMotion' },
  { key: 'screenReaderSupportEnabled', label: 'Screen reader support', toggle: 'toggleScreenReaderSupport' },
  { key: 'hapticEnabled', label: 'Haptic feedback', toggle: 'toggleHaptic' },
  { key: 'speechToTextEnabled', label: 'Speech to text', toggle: 'toggleSpeechToText' },
  { key: 'assistiveDeviceEnabled', label: 'Assistive device support', toggle: 'toggleAssistiveDevice' },
  { key: 'voiceTypingEnabled', label: 'Voice typing', toggle: 'toggleVoiceTyping' },
  { key: 'colorBlindModeEnabled', label: 'Color blind mode', toggle: 'toggleColorBlindMode' },
  { key: 'easyModeEnabled', label: 'Easy mode', toggle: 'toggleEasyMode' },
  { key: 'darkModeEnabled', label: 'Dark mode', toggle: 'toggleDarkMode' },
];

export default function AccessibilitySettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(() =>
    accessibilitySettingsService.getAccessibilitySettings(CURRENT_USER_ID)
  );

  const [sliderValue, setSliderValue] = useState(1);

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

  const textSizeLevel = useMemo(() => {
    const parsed = Number(settings.textSizeLevel);

    return Number.isNaN(parsed) ? 1 : parsed;
  }, [settings.textSizeLevel]);

  useEffect(() => {
    setSliderValue(textSizeLevel);
  }, [textSizeLevel]);

  const setTextSizeLevel = (nextLevel) => {
    setSettings(
      accessibilitySettingsService.updateTextSizeLevel(
        CURRENT_USER_ID,
        nextLevel
      )
    );
  };

  const toggleSetting = (toggleMethod) => {
    setSettings(accessibilitySettingsService[toggleMethod](CURRENT_USER_ID));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.stickyTop}>
      <BackButton
        onPress={() => navigation?.navigate?.(ROUTES.SETTINGS)}
      />
    </View>

    <View style={styles.headerBlock}>
      <Text style={styles.title}>Accessibility Settings</Text>
      <Text style={styles.subtitle}>Adjust the same accessibility options supported by the model layer.</Text>
     </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Text size</Text>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>A</Text>

            <Text style={styles.sliderValue}>
              {sliderValue.toFixed(1)}x
            </Text>

            <Text style={styles.sliderLabelLarge}>A</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0.8}
            maximumValue={1.5}
            step={0.1}
            value={sliderValue}
            onValueChange={setSliderValue}
            onSlidingComplete={setTextSizeLevel}
            minimumTrackTintColor={colors.brand}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.brand}
          />
        </View>

        

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Accessibility toggles</Text>
          {ACCESSIBILITY_TOGGLES.map((item, index) => (
            <View key={item.key}>
              <ToggleRow
                label={item.label}
                value={Boolean(settings[item.key])}
                onChange={() => toggleSetting(item.toggle)}
              />
              {index < ACCESSIBILITY_TOGGLES.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <ToggleButton value={value} onChange={onChange} size={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 140,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  sectionCard: {
    marginTop: spacing.xxs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.body,
    flex: 1,
  },
  divider: {
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
    elevation: 12,
    backgroundColor: colors.pageBg,
  },
    stickyTop: {
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
  },
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xxs,
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: spacing.xxs,
  },
  sliderHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  },

  sliderLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },

  sliderLabelLarge: {
    ...typography.titleSmall,
    color: colors.title,
  },

  sliderValue: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },

  slider: {
    width: '100%',
    height: 40,
  },

});
