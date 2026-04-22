import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import accessibilitySettingsService from '../../../domain/services/AccessibilitySettingsService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const CURRENT_USER_ID = 'current-user';

const TEXT_SIZE_OPTIONS = ['small', 'medium', 'large'];

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

  const textSizeLabel = useMemo(() => settings.textSizeLevel || 'medium', [settings.textSizeLevel]);

  const setTextSizeLevel = (nextLevel) => {
    setSettings(accessibilitySettingsService.updateTextSizeLevel(CURRENT_USER_ID, nextLevel));
  };

  const toggleSetting = (toggleMethod) => {
    setSettings(accessibilitySettingsService[toggleMethod](CURRENT_USER_ID));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} showLabel={false} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Accessibility Settings</Text>
        <Text style={styles.subtitle}>Adjust the same accessibility options supported by the model layer.</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Text size</Text>
          <View style={styles.textSizeRow}>
            {TEXT_SIZE_OPTIONS.map((option) => (
              <ActionButton
                key={option}
                label={option.charAt(0).toUpperCase() + option.slice(1)}
                variant={textSizeLabel === option ? 'solid' : 'outline'}
                onPress={() => setTextSizeLevel(option)}
                style={styles.textSizeButton}
              />
            ))}
          </View>
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
    paddingTop: 84,
    paddingBottom: 150,
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
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  textSizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  textSizeButton: {
    minWidth: 92,
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
  },
  stickyTop: {
    position: 'absolute',
    top: spacing.md + spacing.sm,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.lg,
  },
});
