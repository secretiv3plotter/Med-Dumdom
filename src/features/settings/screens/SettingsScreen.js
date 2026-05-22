import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, radius, spacing, typography } from '../../../shared/theme';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import { scaleLayoutValue, useTextScale } from '../../../shared/theme/textScale';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import FirebaseSyncService from '../../../sync/FirebaseSyncService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';

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

export default function SettingsScreen({ navigation, realm = null }) {
  const returnRoute = navigation?.currentParams?.returnTo || null;
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();
  const { firebase } = useFirebase();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfirmLogOut, setShowConfirmLogOut] = useState(false);
  const [showConfirmPasswordChange, setShowConfirmPasswordChange] = useState(false);

  const confirmLogOut = async () => {
    setShowConfirmLogOut(false);
    if (firebase?.db && realm) {
      try {
        const userId = firebase.auth?.currentUser?.uid;
        if (userId) {
          const syncService = new FirebaseSyncService({
            firestoreDb: firebase.db,
            medRepository: new RealmMedTrackerRepository(realm),
            apptRepository: new RealmApptTrackerRepository(realm),
            medUnitRepository: new RealmMedUnitRepository(realm),
            userRepository: new RealmUserRepository(realm),
            settingsRepository: new RealmSettingsPreferenceRepository(realm),
          });
          await syncService.syncAll(userId);
        }
      } catch (syncErr) {
        console.error('Pre-logout sync failed, logging out anyway:', syncErr);
      }
    }
    if (realm && typeof realm.flush === 'function') {
      await realm.flush();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('_med_dumdom_secure_db_');
    }
    if (realm && typeof realm.clearCollections === 'function') {
      realm.clearCollections();
    }
    if (firebase?.auth) {
      await signOut(firebase.auth);
    }
  };

  const canChangePassword = currentPassword.trim().length > 0 && newPassword.trim().length > 0;

  const handlePasswordChange = async () => {
    if (!canChangePassword) {
      Alert.alert('Missing details', 'Please enter current and new password.');
      return;
    }

    const user = firebase?.auth?.currentUser;
    if (!user?.email) {
      Alert.alert('Error', 'No authenticated user found.');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword.trim());
      Alert.alert('Password updated', 'Your password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Incorrect password', 'The current password you entered is wrong.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak password', 'New password must be at least 6 characters.');
      } else {
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(false);
    const user = firebase?.auth?.currentUser;
    if (!user) {
      Alert.alert('Error', 'No authenticated user found.');
      return;
    }

    try {
      await setDoc(
        doc(firebase.db, 'users', user.uid),
        { isDeleted: true, deletedAt: serverTimestamp() },
        { merge: true },
      );

      if (realm && typeof realm.flush === 'function') await realm.flush();
      if (typeof localStorage !== 'undefined') localStorage.removeItem('_med_dumdom_secure_db_');
      if (realm && typeof realm.clearCollections === 'function') realm.clearCollections();

      await signOut(firebase.auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];

    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.stickyTop, { backgroundColor: colors.pageBg }]}>
        <BackButton onPress={() => navigation?.navigate?.(ROUTES.HOME)} />
      </View>

      {pinHeader ? (
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and app preferences.</Text>
        </View>
      ) : null}

      <ThemedScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        {!pinHeader ? (
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your account and app preferences.</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
              styles.optionCardDivider,
              {
                paddingVertical: scaleLayoutValue(spacing.xxs),
              },
            ]}
            onPress={() => setShowConfirmLogOut(true)}
            accessibilityRole="button"
            accessibilityLabel="Log out of your account"
          >
            <Ionicons name="log-out-outline" size={scaleLayoutValue(28)} color={colors.error ?? '#DC2626'} />
            <View style={[styles.optionTextBlock, { gap: scaleLayoutValue(2) }]}>
              <Text style={[styles.optionTitle, styles.logoutOptionTitle]}>Log Out</Text>
              <Text style={[styles.optionSubtitle, { marginBottom: spacing.sm }]}>Sign out of your account.</Text>
            </View>
          </Pressable>
          {SETTINGS_ITEMS.map((item, index) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
                index < SETTINGS_ITEMS.length - 1 && styles.optionCardDivider,
                {
                  paddingVertical: scaleLayoutValue(spacing.xxs),
                  gap: scaleLayoutValue(spacing.lg),
                },
              ]}
              onPress={() => navigation?.navigate?.(item.route)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}. ${item.subtitle}`}
            >
              <Ionicons name={item.icon} size={scaleLayoutValue(28)} color={colors.brandText} />
              <View style={[styles.optionTextBlock, { gap: scaleLayoutValue(2) }]}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
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
            variant="outline"
            onPress={() => setShowConfirmPasswordChange(true)}
            disabled={!canChangePassword}
            style={styles.sectionButton}
            textStyle={styles.deleteText}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delete Account</Text>
          <Text style={styles.helperText}>
            You can undo this later if you need access again.
          </Text>
          <ActionButton
            label="Delete Account"
            variant="outline"
            onPress={() => setShowDeleteDialog(true)}
            style={styles.sectionButton}
            textStyle={styles.deleteText}
          />
        </View>
      </ThemedScrollView>
      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[
          styles.footerNav,
          { backgroundColor: colors.pageBg, opacity: footerNav.isVisible ? 1 : 0 },
        ]}
      >
        <NavigationBar
          selectedTab="home"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
      </View>
      {showConfirmLogOut ? (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          accessibilityViewIsModal
          onRequestClose={() => setShowConfirmLogOut(false)}
        >
          <Pressable accessible={false} style={styles.dialogOverlay} onPress={() => setShowConfirmLogOut(false)}>
            <Pressable accessible={false} style={styles.dialogContainer} onPress={() => {}}>
              <DialogBox
                title="Log Out?"
                message="Are you sure you want to log out?"
                actions={[
                  {
                    label: 'Cancel',
                    accessibilityLabel: 'Cancel log out',
                    variant: 'outline',
                    onPress: () => setShowConfirmLogOut(false),
                  },
                  {
                    label: 'Log Out',
                    accessibilityLabel: 'Confirm log out',
                    variant: 'solid',
                    onPress: confirmLogOut,
                  },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showDeleteDialog ? (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          accessibilityViewIsModal
          onRequestClose={() => setShowDeleteDialog(false)}
        >
          <Pressable accessible={false} style={styles.dialogOverlay} onPress={() => setShowDeleteDialog(false)}>
            <Pressable accessible={false} style={styles.dialogContainer} onPress={() => {}}>
              <DialogBox
                title="Delete Account?"
                message="Are you sure you want to delete your account? This cannot be undone."
                actions={[
                  {
                    label: 'Cancel',
                    accessibilityLabel: 'Cancel account deletion',
                    variant: 'outline',
                    onPress: () => setShowDeleteDialog(false),
                  },
                  {
                    label: 'Delete',
                    accessibilityLabel: 'Confirm account deletion',
                    variant: 'solid',
                    onPress: handleDeleteAccount,
                  },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showConfirmPasswordChange ? (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          accessibilityViewIsModal
          onRequestClose={() => setShowConfirmPasswordChange(false)}
        >
          <Pressable accessible={false} style={styles.dialogOverlay} onPress={() => setShowConfirmPasswordChange(false)}>
            <Pressable accessible={false} style={styles.dialogContainer} onPress={() => {}}>
              <DialogBox
                title="Change Password?"
                message="Are you sure you want to change your password?"
                actions={[
                  {
                    label: 'Cancel',
                    accessibilityLabel: 'Cancel password change',
                    variant: 'outline',
                    onPress: () => setShowConfirmPasswordChange(false),
                  },
                  {
                    label: 'Confirm',
                    accessibilityLabel: 'Confirm password change',
                    variant: 'solid',
                    onPress: () => { setShowConfirmPasswordChange(false); handlePasswordChange(); },
                  },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxs,
    paddingBottom: 140,
    gap: spacing.xxs,
  },
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xxs,
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: spacing.xxs,
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
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,

    elevation: 3,
  },
  sectionTitle: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: colors.title,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  sectionButton: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
  deleteText: {
    color: colors.error,
  },
  optionCard: {
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
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
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: colors.brandText,
  },
  logoutOptionTitle: {
    color: colors.error ?? '#DC2626',
  },
  optionSubtitle: {
    fontSize: getFontSize(16),
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
