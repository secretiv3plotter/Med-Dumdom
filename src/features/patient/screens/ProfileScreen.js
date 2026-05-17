import { useEffect, useRef, useState } from 'react';
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
import { ROUTES } from '../../../app/navigation/routes';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
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
import personalProfileService from '../../../domain/services/PersonalProfileService';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';

const CURRENT_USER_ID = 'current-user';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const FALLBACK_PROFILE = {
  fullName: 'Jane Doe',
  profilePicture: '',
  birthDate: new Date('1975-06-15'),
  address: 'Cebu City',
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

export default function ProfileScreen({ navigation }) {
  const returnRoute = navigation?.currentParams?.returnTo || ROUTES.HOME;
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;

  const [profile, setProfile] = useState(() => {
    const currentProfile = personalProfileService.getProfile(CURRENT_USER_ID);
    if (currentProfile?.fullName || currentProfile?.birthDate || currentProfile?.address) {
      return currentProfile;
    }

    return personalProfileService.saveProfile(CURRENT_USER_ID, FALLBACK_PROFILE);
  });
  const [draft, setDraft] = useState(() => toDraft(profile));
  const [isEditing, setIsEditing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSavedDialog, setShowSavedDialog] = useState(false);
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

  const syncDraft = (nextProfile) => {
    const savedProfile = personalProfileService.saveProfile(CURRENT_USER_ID, nextProfile);
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
                <Ionicons name="person-circle-outline" size={108} color={colors.brandText} />
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
        </ThemedScrollView>

        {!isKeyboardVisible ? (
          <View style={[styles.footerNav, { backgroundColor: colors.pageBg }]}>
            <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
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
          <Pressable style={styles.overlay} onPress={() => setShowConfirmSave(false)}>
            <Pressable style={styles.dialogWrap} onPress={() => {}}>
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
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  infoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  editActionWrap: {
    minWidth: 0,
    alignItems: 'flex-end',
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
