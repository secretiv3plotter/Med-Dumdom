import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_RESERVED_HEIGHT,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, radius, spacing, typography } from '../../../shared/theme';
import NavigationBar from '../../../shared/components/common/NavigationBar';

const SETTINGS_ITEMS = [
  {
    key: 'accessibility',
    title: 'Accessibility',
    subtitle: 'Adjust display and interaction preferences.',
    icon: 'accessibility-outline',
    route: ROUTES.ACCESSIBILITY_SETTINGS,
  },
];

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

export default function SettingsScreen({ navigation }) {
  const returnRoute = navigation?.currentParams?.returnTo || null;

  const [isActive, setIsActive] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canChangePassword = currentPassword.trim().length > 0 && newPassword.trim().length > 0;

  const handlePasswordChange = () => {
    if (!canChangePassword) {
      Alert.alert('Missing details', 'Please enter current and new password.');
      return;
    }

    Alert.alert('Password updated', 'Your password has been changed.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    setIsActive(false);
    Alert.alert('Account deactivated', 'Your account status is now inactive.');
  };

  const onTabNavigate = (tabKey) => {
  const targetRoute = TAB_KEY_TO_ROUTE[tabKey];

  if (targetRoute) {
    navigation?.navigate?.(targetRoute);
  }
};

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.stickyTop}>
      <BackButton
        onPress={() => navigation?.navigate?.(ROUTES.HOME)}
      />
    </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Open the settings screens backed by the current services.</Text>
        </View>

        <View style={styles.sectionCard}>
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed, index < SETTINGS_ITEMS.length - 1 && styles.optionCardDivider]}
              onPress={() => navigation?.navigate?.(item.route)}
            >
              <Ionicons name={item.icon} size={28} color={colors.brandText} />
              <View style={styles.optionTextBlock}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? colors.success : colors.error },
              ]}
            />
            <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Password Change</Text>
          <InputBar
            placeholder="Current password"
            accessibilityLabel="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <InputBar
            placeholder="New password"
            accessibilityLabel="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <ActionButton
            label="Change Password"
            onPress={handlePasswordChange}
            disabled={!canChangePassword}
            style={styles.sectionButton}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Soft Delete Account</Text>
          <Text style={styles.helperText}>
            This will deactivate the app account, not permanently erase it.
          </Text>
          <ActionButton
            label="Delete Account"
            variant="outline"
            onPress={() => setShowDeleteDialog(true)}
            style={styles.sectionButton}
            textStyle={styles.deleteText}
          />
        </View>
      </ScrollView>
        <View style={styles.footerNav}>
          <NavigationBar
            selectedTab="home"
            showPressAlert={false}
            onNavigate={onTabNavigate}
          />
        </View>
      {showDeleteDialog ? (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <DialogBox
              title="Deactivate account?"
              message="Are you sure you want to deactivate your account? This is a soft delete."
              actions={[
                {
                  label: 'Cancel',
                  variant: 'outline',
                  onPress: () => setShowDeleteDialog(false),
                },
                {
                  label: 'Yes',
                  variant: 'solid',
                  onPress: handleDeleteAccount,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  stickyTop: {
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 140,
    gap: spacing.md,
  },
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: -18,
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: colors.title,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...typography.body,
    color: colors.body,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  sectionButton: {
    marginTop: spacing.xs,
    flex: 0,
    alignSelf: 'stretch',
  },
  deleteText: {
    color: colors.error,
  },
  optionCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionCardDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionCardPressed: {
    backgroundColor: '#ECF3F6',
  },
  optionTextBlock: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: colors.brandText,
  },
  optionSubtitle: {
    fontSize: getFontSize(17),
    color: colors.title,
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 50,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
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
});
