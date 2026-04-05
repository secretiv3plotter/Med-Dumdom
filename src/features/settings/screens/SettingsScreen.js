import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

export default function SettingsScreen({ navigation }) {
  const [isActive, setIsActive] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canChangePassword =
    currentPassword.trim().length > 0 && newPassword.trim().length > 0;

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
    Alert.alert('Account deleted', 'Your account status is now inactive.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Settings</Text>
          </View>
          <Text style={styles.subtitle}>Manage your account and preferences.</Text>
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
          <Text style={styles.sectionTitle}>Delete Account</Text>
          <Text style={styles.helperText}>
            This action cannot be undone.
          </Text>
          <ActionButton
            label="Delete Account"
            variant="outline"
            onPress={() => setShowDeleteDialog(true)}
            style={styles.sectionButton}
            textStyle={styles.deleteText}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.stackedTabBars}>
            <View style={styles.optionItem}>
              <Pressable
                style={styles.optionCard}
                onPress={() => navigation?.navigate?.(ROUTES.NOTIFICATION_SETTINGS)}
              >
                <Ionicons name="notifications-outline" size={28} color={colors.brandText} />
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>Notifications</Text>
                  <Text style={styles.optionSubtitle}>Manage reminders and app alerts.</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.optionItem}>
              <Pressable
                style={styles.optionCard}
                onPress={() => navigation?.navigate?.(ROUTES.PRIVACY_SETTINGS)}
              >
                <Ionicons name="shield-checkmark-outline" size={28} color={colors.brandText} />
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>Privacy Settings</Text>
                  <Text style={styles.optionSubtitle}>Control data visibility and permissions.</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.optionItem}>
              <Pressable
                style={styles.optionCard}
                onPress={() => navigation?.navigate?.(ROUTES.ACCESSIBILITY_SETTINGS)}
              >
                <Ionicons name="accessibility-outline" size={28} color={colors.brandText} />
                <View style={styles.optionTextBlock}>
                  <Text style={styles.optionTitle}>Accessibility</Text>
                  <Text style={styles.optionSubtitle}>Adjust display and interaction preferences.</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {showDeleteDialog ? (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <DialogBox
              title="Delete account?"
              message="Are you sure you want to delete your account?"
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
    position: 'absolute',
    top: spacing.md + spacing.sm,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 84,
    paddingBottom: 40,
    gap: spacing.md,
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
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
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
  stackedTabBars: {
    gap: spacing.sm,
  },
  optionItem: {
    gap: spacing.xs,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.lg,
    backgroundColor: '#ECF3F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionTextBlock: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brandText,
  },
  optionSubtitle: {
    fontSize: 17,
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
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
