import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ROUTES } from '../../../app/navigation/routes';
import BackButton from '../../../shared/components/common/BackButton';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import {
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { EditButton } from '../../../shared/components/common/CrudButton';
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
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingPicture, setPendingPicture] = useState(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
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
      setPendingPicture(selectedImageUri);
    } catch (error) {
      Alert.alert('Unable to update picture', 'Something went wrong while selecting your profile picture.');
    }
  };

  const savePicture = async () => {
    if (!pendingPicture) return;
    setIsSaving(true);
    let resolvedUrl = pendingPicture;
    if (!resolvedUrl.startsWith('https://') && firebase?.storage && currentUser?.uid) {
      try {
        const blob = await fetch(resolvedUrl).then((r) => r.blob());
        const storageRef = ref(firebase.storage, `users/${currentUser.uid}/profile_picture`);
        await uploadBytes(storageRef, blob);
        resolvedUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Profile picture upload failed:', err);
        Alert.alert('Upload failed', 'Could not upload your profile picture. Please try again.');
        setIsSaving(false);
        return;
      }
    }
    const savedProfile = profileRepository.saveProfile(currentUser.uid, {
      ...profile,
      profilePicture: resolvedUrl,
    });
    setProfile(savedProfile);
    setDraft(toDraft(savedProfile));
    setPendingPicture(null);
    setIsSaving(false);
  };

  const cancelPicture = () => {
    setPendingPicture(null);
    setAvatarLoadFailed(false);
  };

  const confirmSaveChanges = async () => {
    setShowConfirmSave(false);
    setIsSaving(true);

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
      profilePicture: profile.profilePicture?.trim() || '',
      birthDate: parsedBirthDate,
      address: draft.address.trim(),
    };

    syncDraft(nextProfile);
    setIsEditing(false);
    setIsSaving(false);
  };

  const committedAvatarSource = useMemo(
    () => (profile.profilePicture?.trim() ? { uri: profile.profilePicture.trim() } : null),
    [profile.profilePicture]
  );
  const pendingAvatarSource = useMemo(
    () => (pendingPicture ? { uri: pendingPicture } : null),
    [pendingPicture]
  );
  const avatarSource = pendingAvatarSource ?? committedAvatarSource;
  const displayPicture = avatarSource?.uri ?? null;
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
                  source={avatarSource}
                  style={styles.profileImage}
                  onError={() => setAvatarLoadFailed(true)}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={profile.fullName ? `${profile.fullName}'s profile picture` : 'Profile picture'}
                />
              ) : (
                <View
                  style={styles.avatarPlaceholder}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Ionicons name="person" size={54} color={colors.surface} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{profile.fullName || 'Unnamed profile'}</Text>
            <View style={styles.photoPickerRow}>
              {pendingPicture ? (
                <View style={styles.pictureSaveRow}>
                  <Pressable
                    onPress={cancelPicture}
                    disabled={isSaving}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel profile picture change"
                    accessibilityHint="Discards the selected image and keeps your current picture"
                    accessibilityState={{ disabled: isSaving }}
                    style={({ pressed }) => [
                      styles.pictureActionButton,
                      styles.pictureCancelButton,
                      pressed && styles.pictureCancelButtonPressed,
                      isSaving && styles.pictureActionDisabled,
                    ]}
                  >
                    <Text style={[styles.pictureActionText, styles.pictureCancelText]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={savePicture}
                    disabled={isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={isSaving ? 'Saving profile picture' : 'Save profile picture'}
                    accessibilityHint="Uploads and saves the selected image to your profile"
                    accessibilityState={{ disabled: isSaving }}
                    style={({ pressed }) => [
                      styles.pictureActionButton,
                      styles.pictureSaveButton,
                      pressed && styles.pictureSaveButtonPressed,
                      isSaving && styles.pictureActionDisabled,
                    ]}
                  >
                    <Text style={[styles.pictureActionText, styles.pictureSaveText]}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleChangeProfilePicture}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile picture"
                  accessibilityHint="Opens your photo library to pick a new image"
                  style={({ pressed }) => [
                    styles.photoPickerValue,
                    pressed && styles.photoPickerValuePressed,
                  ]}
                >
                  <Text style={styles.photoPickerValueText}>Change Profile Picture</Text>
                </Pressable>
              )}
            </View>
          </TextCard>

          <TextCard cardStyle={styles.profileCard}>
            <View style={styles.infoTitleRow}>
              <View style={styles.infoTitleGroup}>
                <Text style={styles.infoTitle} accessibilityRole="header">Personal Information</Text>
              </View>
              {!isEditing ? (
                <View style={styles.editActionWrap}>
                  <EditButton
                    onPress={() => setIsEditing(true)}
                    iconSize={moderateScale(32)}
                    iconColorOverride={colors.title}
                    style={styles.editActionButton}
                    circleStyle={styles.editActionCircle}
                    textStyle={[styles.editActionText, styles.editTextBlack]}
                  />
                </View>
              ) : null}
            </View>

            {isEditing ? (
              <>
                <Text style={styles.label}>Full name:</Text>
                <InputBar
                  value={draft.fullName}
                  onChangeText={(value) => setDraft((current) => ({ ...current, fullName: value }))}
                  placeholder="Enter full name"
                  accessibilityLabel="Full name"
                  accessibilityHint="Type your full name"
                />

                <Text style={styles.label}>Birth date:</Text>
                <NativeDateTimeField
                  placeholder="Select birth date"
                  accessibilityLabel="Birth date"
                  value={draft.birthDate}
                  onChange={(value) => setDraft((current) => ({ ...current, birthDate: value }))}
                  optional
                  maximumDate={new Date()}
                />

                <Text style={styles.label}>Address:</Text>
                <InputBar
                  value={draft.address}
                  onChangeText={(value) => setDraft((current) => ({ ...current, address: value }))}
                  placeholder="Enter address"
                  accessibilityLabel="Address"
                  accessibilityHint="Type your home address"
                />
              </>
            ) : (
              <>
                <View accessible accessibilityLabel={`Full name: ${profile.fullName || 'not set'}`} style={styles.infoRow}>
                  <Text accessible={false} style={styles.infoLabel}>Full name:</Text>
                  <Text accessible={false} style={[styles.infoValue, !profile.fullName && styles.infoValueEmpty]}>
                    {profile.fullName || ' '}
                  </Text>
                </View>
                <View accessible accessibilityLabel={`Birth date: ${profile.birthDate ? formatBirthDate(profile.birthDate) : 'not set'}`} style={styles.infoRow}>
                  <Text accessible={false} style={styles.infoLabel}>Birth date:</Text>
                  <Text accessible={false} style={[styles.infoValue, !profile.birthDate && styles.infoValueEmpty]}>
                    {profile.birthDate ? formatBirthDate(profile.birthDate) : ' '}
                  </Text>
                </View>
                <View accessible accessibilityLabel={`Age: ${profile.birthDate ? String(profile.age) : 'not set'}`} style={styles.infoRow}>
                  <Text accessible={false} style={styles.infoLabel}>Age:</Text>
                  <Text accessible={false} style={[styles.infoValue, !profile.birthDate && styles.infoValueEmpty]}>
                    {profile.birthDate ? String(profile.age) : ' '}
                  </Text>
                </View>
                <View accessible accessibilityLabel={`Address: ${profile.address || 'not set'}`} style={styles.infoRow}>
                  <Text accessible={false} style={styles.infoLabel}>Address:</Text>
                  <Text accessible={false} style={[styles.infoValue, !profile.address && styles.infoValueEmpty]}>
                    {profile.address || ' '}
                  </Text>
                </View>
              </>
            )}
          </TextCard>

          {isEditing ? (
            <View style={styles.editButtonRow}>
              <Pressable
                onPress={() => setIsEditing(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
                accessibilityHint="Discards your unsaved changes to personal information"
                style={({ pressed }) => [
                  styles.editRowButton,
                  styles.cancelEditButton,
                  pressed && styles.cancelEditButtonPressed,
                ]}
              >
                <Text style={[styles.editRowButtonText, styles.cancelEditButtonText]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowConfirmSave(true)}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
                accessibilityHint="Opens a confirmation dialog before saving your personal information"
                style={({ pressed }) => [
                  styles.editRowButton,
                  styles.saveEditButton,
                  pressed && styles.saveEditButtonPressed,
                ]}
              >
                <Text style={[styles.editRowButtonText, styles.saveEditButtonText]}>Save</Text>
              </Pressable>
            </View>
          ) : null}

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
          accessibilityViewIsModal
          onRequestClose={() => setShowConfirmSave(false)}
        >
          <Pressable accessible={false} style={styles.overlay} onPress={() => setShowConfirmSave(false)}>
            <Pressable accessible={false} style={styles.dialogWrap} onPress={() => {}}>
              <DialogBox
                title="Are you Sure?"
                message="You are about to save changes."
                actions={[
                  {
                    label: 'Cancel',
                    accessibilityLabel: 'Cancel saving profile changes',
                    variant: 'outline',
                    onPress: () => setShowConfirmSave(false),
                  },
                  {
                    label: isSaving ? 'Saving...' : 'Confirm Save',
                    accessibilityLabel: 'Confirm saving profile changes',
                    variant: 'solid',
                    onPress: confirmSaveChanges,
                    disabled: isSaving,
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
  photoPickerValuePressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
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
  pictureSaveRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  pictureActionButton: {
    flex: 1,
    maxWidth: 120,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  pictureSaveButton: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  pictureSaveButtonPressed: {
    backgroundColor: colors.brandText,
    borderColor: colors.brandText,
  },
  pictureCancelButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pictureCancelButtonPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  pictureActionDisabled: {
    opacity: 0.5,
  },
  pictureActionText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  pictureSaveText: {
    color: colors.surface,
  },
  pictureCancelText: {
    color: colors.title,
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
    ...typography.titleSmall,
    color: colors.title,
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
  },
  editActionText: {
    ...typography.bodySmall,
    fontWeight: '700',
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
    width: 82,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.title,
    backgroundColor: colors.surface,
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.title,
    borderRadius: radius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  infoValueEmpty: {
    color: colors.bodyMuted,
    borderColor: colors.border,
  },
  editButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editRowButton: {
    width: 120,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editRowButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelEditButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cancelEditButtonPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  cancelEditButtonText: {
    color: colors.title,
  },
  saveEditButton: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  saveEditButtonPressed: {
    backgroundColor: colors.brandText,
    borderColor: colors.brandText,
  },
  saveEditButtonText: {
    color: colors.surface,
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
  title: {
    ...typography.title,
    color: colors.title,
  },
  headerBlock: {
    alignItems: 'flex-start',
    gap: spacing.xxs,
    backgroundColor: colors.pageBg,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: spacing.xxs,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'left',
  },
});
