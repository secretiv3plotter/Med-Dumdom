import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import DialogBox from '../components/common/DialogBox';
import InputBar from '../components/common/InputBar';
import NavigationBar from '../components/common/NavigationBar';
import TextCard from '../components/common/TextCard';
import { ROUTES } from '../constants/routes';
import { colors, radius, spacing, typography } from '../constants/Themes';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function EditProfileScreen({ navigation }) {
  const [fullName, setFullName] = useState('Jane Doe');
  const [age, setAge] = useState('50 years old');
  const [address, setAddress] = useState('Cebu City');
  const [email, setEmail] = useState('jane.doe@email.com');
  const [phone, setPhone] = useState('+63 912 345 6789');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const confirmSaveChanges = () => {
    navigation?.navigate?.(ROUTES.PROFILE, { changesSavedToken: Date.now() });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.stickyTop}>
          <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible ? styles.contentWithKeyboard : styles.contentWithFooter,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}>Edit Profile</Text>

        <TextCard cardStyle={styles.profileCardTop}>
          <Ionicons name="person-circle-outline" size={108} color={colors.brandText} />
          <Text style={styles.name}>Jane Doe</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>janedoe@gmail.com</Text>
            <Text style={styles.badge}>Caregiver</Text>
          </View>
        </TextCard>

        <TextCard cardStyle={styles.settingsCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="person-outline" size={16} color={colors.title} />
            <Text style={styles.infoTitle}>Personal Information</Text>
          </View>

          <Text style={styles.label}>Full Name:</Text>
          <InputBar value={fullName} onChangeText={setFullName} placeholder="Enter full name" />

          <Text style={styles.label}>Age:</Text>
          <InputBar value={age} onChangeText={setAge} placeholder="Age" />

          <Text style={styles.label}>Address:</Text>
          <InputBar value={address} onChangeText={setAddress} placeholder="Address" />

          <Text style={styles.label}>Email:</Text>
          <InputBar value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />

          <Text style={styles.label}>Phone #:</Text>
          <InputBar value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
        </TextCard>

          <ActionButton
            label="Save Changes"
            onPress={() => setShowConfirmSave(true)}
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
          />
        </ScrollView>

        {!isKeyboardVisible ? (
          <View style={styles.footerNav}>
            <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showConfirmSave}
        animationType="fade"
        onRequestClose={() => setShowConfirmSave(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowConfirmSave(false)}>
          <Pressable style={styles.dialogWrap} onPress={() => {}}>
            <DialogBox
              title="Are you Sure?"
              message="You are about to save changes."
              titleStyle={styles.confirmDialogTitle}
              messageStyle={styles.confirmDialogMessage}
              actions={[]}
            >
              <View style={styles.confirmActionsRow}>
                <ActionButton
                  label="Cancel"
                  variant="outline"
                  onPress={() => setShowConfirmSave(false)}
                  style={styles.confirmActionButton}
                  textStyle={[styles.confirmDialogButtonText, styles.cancelButtonText]}
                />
                <ActionButton
                  label="Save Changes"
                  variant="solid"
                  onPress={confirmSaveChanges}
                  style={styles.confirmActionButton}
                  textStyle={[styles.confirmDialogButtonText, styles.saveChangesButtonText]}
                />
              </View>
            </DialogBox>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  keyboardWrap: {
    flex: 1,
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
    gap: spacing.sm,
  },
  contentWithFooter: {
    paddingBottom: 150,
  },
  contentWithKeyboard: {
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.brandText,
    textAlign: 'center',
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
  settingsCard: {
    backgroundColor: colors.surface,
    borderColor: '#C9D6EA',
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  label: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '600',
    marginTop: spacing.xxs,
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
  confirmDialogTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: colors.title,
  },
  confirmDialogMessage: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.body,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  confirmActionButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  confirmDialogButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.brand,
  },
  saveChangesButtonText: {
    color: colors.surface,
  },
});
