import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import personalProfileService from '../../../domain/services/PersonalProfileService';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';

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

export default function ProfileScreen({ navigation }) {
  const returnRoute = navigation?.currentParams?.returnTo || ROUTES.HOME;

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
      profilePicture: draft.profilePicture.trim(),
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

  const displayPicture = profile.profilePicture?.trim();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.stickyTop}>
          <BackButton onPress={() => navigation?.navigate?.(returnRoute)} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentWithKeyboard : styles.contentWithFooter,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>
              View and manage your personal information.
            </Text>
          </View>
          <TextCard cardStyle={styles.profileCardTop}>
            <View style={styles.avatarShell}>
              {displayPicture ? (
                <Ionicons name="person-circle-outline" size={108} color={colors.brandText} />
              ) : (
                <Ionicons name="person-circle-outline" size={108} color={colors.brandText} />
              )}
            </View>
            <Text style={styles.name}>{profile.fullName || 'Unnamed profile'}</Text>
          </TextCard>

          <TextCard cardStyle={styles.profileCard}>
            <View style={styles.infoTitleRow}>
              <View style={styles.infoTitleGroup}>
                <Ionicons name="person-outline" size={16} color={colors.title} />
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
                    style={styles.editActionButton}
                    circleStyle={styles.editActionCircle}
                    textStyle={styles.editActionText}
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

                <Text style={styles.label}>Profile picture URL:</Text>
                <InputBar
                  value={draft.profilePicture}
                  onChangeText={(value) => setDraft((current) => ({ ...current, profilePicture: value }))}
                  placeholder="Enter profile picture URL or file path"
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
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{profile.fullName || '--'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Birth date:</Text>
                  <Text style={styles.infoValue}>
                    {profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : '--'}
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
        </ScrollView>

        {!isKeyboardVisible ? (
          <View style={styles.footerNav}>
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
    minWidth: 72,
    alignItems: 'center',
  },
  editActionButton: {
    minWidth: 64,
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
  gap: spacing.xs,
  marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'left',
  },
});
