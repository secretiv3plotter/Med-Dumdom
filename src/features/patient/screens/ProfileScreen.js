import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { ROUTES } from '../../../app/navigation/routes';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import FirebaseSyncService from '../../../sync/FirebaseSyncService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { CancelButton, EditButton } from '../../../shared/components/common/CrudButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import TextCard from '../../../shared/components/common/TextCard';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const FALLBACK_PROFILE = {
  fullName: '',
  profilePicture: '',
  birthDate: null,
  address: '',
};

const toDraft = (profile) => ({
  fullName: profile.fullName || '',
  profilePicture: profile.profilePicture || '',
  birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : '',
  address: profile.address || '',
});

const formatBirthDate = (birthDate) => {
  if (!birthDate) {
    return '--';
  }

  const parsed = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ProfileScreen({ navigation, realm = null }) {
  const returnRoute = navigation?.currentParams?.returnTo || ROUTES.HOME;
  const { textScale } = useTextScale();
  const { firebase, currentUser } = useFirebase();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();
  const profileRepository = useMemo(
    () => (realm ? new RealmUserRepository(realm) : personalProfileService),
    [realm]
  );

  const [profile, setProfile] = useState(() => {
    const currentProfile = profileRepository.getProfile(currentUser.uid);
    if (currentProfile?.fullName || currentProfile?.birthDate || currentProfile?.address) {
      return currentProfile;
    }

    return profileRepository.saveProfile(currentUser.uid, FALLBACK_PROFILE);
  });
  const [draft, setDraft] = useState(() => toDraft(profile));
  const [isEditing, setIsEditing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const [showConfirmLogOut, setShowConfirmLogOut] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [profile.profilePicture]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

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

  const syncDraft = (nextProfile) => {
    const savedProfile = profileRepository.saveProfile(currentUser.uid, nextProfile);
    setProfile(savedProfile);
    setDraft(toDraft(savedProfile));
  };

  const handleChangeProfilePicture = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedImageUri = result.assets[0]?.uri || '';
      if (!selectedImageUri) {
        return;
      }

      setAvatarLoadFailed(false);
      setDraft((current) => ({ ...current, profilePicture: selectedImageUri }));
      if (!isEditing) {
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Unable to update picture', 'Something went wrong while selecting your profile picture.');
    }
  };

  const confirmSaveChanges = () => {
    let parsedBirthDate = null;
    if (draft.birthDate) {
      const parts = String(draft.birthDate).split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          parsedBirthDate = d;
        }
      }
    }

    const nextProfile = {
      fullName: draft.fullName.trim() || FALLBACK_PROFILE.fullName,
      profilePicture: draft.profilePicture?.trim() || '',
      birthDate: parsedBirthDate,
      address: draft.address.trim(),
    };

    syncDraft(nextProfile);
    setShowConfirmSave(false);
    setIsEditing(false);
    setShowSavedDialog(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShowSavedDialog(false);
    }, 3000);
  };

  const displayPicture = (isEditing ? draft.profilePicture : profile.profilePicture)?.trim();
  const hasValidDisplayPicture = Boolean(displayPicture) && !avatarLoadFailed;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.stickyTop, { backgroundColor: colors.pageBg }]}>
          <BackButton onPress={() => navigation?.navigate?.(returnRoute)} />
          {pinHeader ? (
            <View style={styles.headerBlock}>
              <Text style={styles.title}>My Profile</Text>
              <Text style={styles.subtitle}>
                View and manage your personal information.
              </Text>
            </View>
          ) : null}
        </View>

        <ThemedScrollView
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentWithKeyboard : styles.contentWithFooter,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onLayout={footerNav.onLayout}
          onContentSizeChange={footerNav.onContentSizeChange}
          onScroll={footerNav.onScroll}
        >
          {!pinHeader ? (
            <View style={styles.headerBlock}>
              <Text style={styles.title}>My Profile</Text>
              <Text style={styles.subtitle}>
                View and manage your personal information.
              </Text>
            </View>
          ) : null}

          <TextCard cardStyle={styles.profileCardTop}>
            <View style={styles.avatarShell}>
              {hasValidDisplayPicture ? (
                <Image
                  source={{ uri: displayPicture }}
                  style={styles.profileImage}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={54} color={colors.surface} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{profile.fullName || 'Unnamed profile'}</Text>
            <View style={styles.photoPickerRow}>
              <TouchableOpacity
                onPress={handleChangeProfilePicture}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                style={styles.photoPickerValue}
              >
                <Text style={styles.photoPickerValueText}>Change Profile Picture</Text>
              </TouchableOpacity>
            </View>
          </TextCard>

          <TextCard cardStyle={styles.profileCard}>
            <View style={styles.infoTitleRow}>
              <View style={styles.infoTitleGroup}>
                <Text style={styles.infoTitle}>Personal Information</Text>
              </View>
              <View style={styles.editActionWrap}>
                {isEditing ? (
                  <CancelButton
                    onPress={() => setIsEditing(false)}
                    style={styles.editActionButton}
                    circleStyle={styles.editActionCircle}
                    textStyle={styles.editActionText}
                  />
                ) : (
                  <EditButton
                    onPress={() => setIsEditing(true)}
                    iconSize={moderateScale(32)}
                    iconColorOverride={colors.title}
                    style={styles.editActionButton}
                    circleStyle={styles.editActionCircle}
                    textStyle={[styles.editActionText, styles.editTextBlack]}
                  />
                )}
              </View>
            </View>

            {isEditing ? (
              <>
                <Text style={styles.label}>Full name:</Text>
                <InputBar
                  value={draft.fullName}
                  onChangeText={(value) => setDraft((current) => ({ ...current, fullName: value }))}
                  placeholder="Enter full name"
                />

                <NativeDateTimeField
                  label="Birth date"
                  placeholder="Select birth date"
                  accessibilityLabel="Birth date"
                  value={draft.birthDate}
                  onChange={(value) => setDraft((current) => ({ ...current, birthDate: value }))}
                  optional
                />

                <Text style={styles.label}>Address:</Text>
                <InputBar
                  value={draft.address}
                  onChangeText={(value) => setDraft((current) => ({ ...current, address: value }))}
                  placeholder="Enter address"
                />
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Birth date:</Text>
                  <Text style={styles.infoValue}>
                    {formatBirthDate(profile.birthDate)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age:</Text>
                  <Text style={styles.infoValue}>{profile.birthDate ? String(profile.age) : '--'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{profile.address || '--'}</Text>
                </View>
              </>
            )}
          </TextCard>

          {isEditing ? (
            <ActionButton
              label="Save Changes"
              onPress={() => setShowConfirmSave(true)}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          ) : null}

          <Pressable
            onPress={() => setShowConfirmLogOut(true)}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error ?? '#DC2626'} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </ThemedScrollView>

        {!isKeyboardVisible ? (
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
        ) : null}
      </KeyboardAvoidingView>

      {showConfirmSave ? (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmSave(false)}
        >
          <Pressable accessible={false} style={styles.overlay} onPress={() => setShowConfirmSave(false)}>
            <Pressable accessible={false} style={styles.dialogWrap} onPress={() => {}}>
              <DialogBox
                title="Are you Sure?"
                message="You are about to save changes."
                actions={[
                  { label: 'Cancel', variant: 'outline', onPress: () => setShowConfirmSave(false) },
                  { label: 'Confirm Save', variant: 'solid', onPress: confirmSaveChanges },
                ]}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showSavedDialog ? (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.dialogWrap}>
              <DialogBox
                title="Changes saved"
                message=""
                actions={[]}
                cardStyle={styles.savedDialogCard}
                titleStyle={styles.savedDialogTitle}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {showConfirmLogOut ? (
        <Modal
          transparent
          visible={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmLogOut(false)}
        >
          <Pressable accessible={false} style={styles.overlay} onPress={() => setShowConfirmLogOut(false)}>
            <Pressable accessible={false} style={styles.dialogWrap} onPress={() => {}}>
              <DialogBox
                title="Log Out?"
                message="Are you sure you want to log out?"
                actions={[
                  { label: 'Cancel', variant: 'outline', onPress: () => setShowConfirmLogOut(false) },
                  { label: 'Log Out', variant: 'solid', onPress: confirmLogOut },
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
  keyboardWrap: {
    flex: 1,
  },
  stickyTop: {
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  contentWithFooter: {
    paddingBottom: 150,
  },
  contentWithKeyboard: {
    paddingBottom: spacing.xl,
  },
  profileCardTop: {
    backgroundColor: colors.surface,
    borderColor: '#C9D6EA',
    borderWidth: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  avatarShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: '#C9D6EA',
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  name: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  photoPickerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.xs,
  },
  photoPickerValue: {
    backgroundColor: colors.surface,
    width: '72%',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  photoPickerValueText: {
    ...typography.bodySmall,
    color: colors.brandText,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  badge: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 999,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.brandSoft,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  infoTitleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  infoTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    flexShrink: 1,
  },
  editActionWrap: {
    flexShrink: 0,
    alignItems: 'flex-end',
    marginLeft: spacing.xs,
  },
  editActionButton: {
    minWidth: 0,
  },
  editActionCircle: {
    width: 36,
    height: 36,
    paddingBottom: spacing.sm,
  },
  editActionText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginTop: -8,
  },
  editTextBlack: {
    color: colors.title,
  },
  label: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
    width: 82,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.brandText,
    backgroundColor: colors.surface,
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  saveButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    width: 170,
    flex: 0,
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error ?? '#DC2626',
  },
  logoutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.error ?? '#DC2626',
    fontWeight: '600',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogWrap: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  savedDialogCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  savedDialogTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: colors.brandText,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xxs,
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: spacing.xxs,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'left',
  },
});
