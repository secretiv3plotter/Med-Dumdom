import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
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

export default function AccessibilitySettings({ navigation }) {
  const [textSize, setTextSize] = useState('Medium');
  const [toggleHaptic, setToggleHaptic] = useState(false);
  const [toggleSpeechToText, setToggleSpeechToText] = useState(false);
  const [toggleAssistiveDevice, setToggleAssistiveDevice] = useState(false);
  const [toggleVoiceTyping, setToggleVoiceTyping] = useState(false);
  const [toggleBlindMode, setToggleBlindMode] = useState(false);
  const [toggleEasyMode, setToggleEasyMode] = useState(false);

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
        <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Accessibility Settings</Text>
        <Text style={styles.subtitle}>Adjust accessibility preferences for your experience.</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>setTextSize</Text>
          <View style={styles.textSizeRow}>
            <ActionButton
              label="Small"
              variant={textSize === 'Small' ? 'solid' : 'outline'}
              onPress={() => setTextSize('Small')}
            />
            <ActionButton
              label="Medium"
              variant={textSize === 'Medium' ? 'solid' : 'outline'}
              onPress={() => setTextSize('Medium')}
            />
            <ActionButton
              label="Large"
              variant={textSize === 'Large' ? 'solid' : 'outline'}
              onPress={() => setTextSize('Large')}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <ToggleRow label="toggleHaptic" value={toggleHaptic} onChange={setToggleHaptic} />
          <ToggleRow
            label="toggleSpeechToText"
            value={toggleSpeechToText}
            onChange={setToggleSpeechToText}
          />
          <ToggleRow
            label="toggleAssistiveDevice"
            value={toggleAssistiveDevice}
            onChange={setToggleAssistiveDevice}
          />
          <ToggleRow
            label="toggleVoiceTyping"
            value={toggleVoiceTyping}
            onChange={setToggleVoiceTyping}
          />
          <ToggleRow
            label="toggleBlindMode"
            value={toggleBlindMode}
            onChange={setToggleBlindMode}
          />
          <ToggleRow label="toggleEasyMode" value={toggleEasyMode} onChange={setToggleEasyMode} />
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
    gap: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.body,
    flex: 1,
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
