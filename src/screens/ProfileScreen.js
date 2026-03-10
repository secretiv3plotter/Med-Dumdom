import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import DialogBox from '../components/common/DialogBox';
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

let lastHandledChangesSavedToken = null;

export default function ProfileScreen({ navigation }) {
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const timeoutRef = useRef(null);

  const personalInfoRows = [
    { label: 'Full Name', value: 'Jane Doe' },
    { label: 'Age', value: '50 years old' },
    { label: 'Address', value: 'Cebu City' },
    { label: 'Email', value: 'janedoe@gmail.com' },
    { label: 'Phone #', value: '0985 985 6399' },
  ];

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  useEffect(() => {
    const token = navigation?.currentParams?.changesSavedToken;
    if (!token || token === lastHandledChangesSavedToken) {
      return;
    }

    lastHandledChangesSavedToken = token;
    setShowSavedDialog(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowSavedDialog(false);
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigation?.currentParams?.changesSavedToken]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Profile</Text>

        <TextCard cardStyle={styles.profileCardTop}>
          <Ionicons name="person-circle-outline" size={108} color={colors.brandText} />
          <Text style={styles.name}>Jane Doe</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>janedoe@gmail.com</Text>
            <Text style={styles.badge}>Caregiver</Text>
          </View>
          <ActionButton
            label="Edit Profile"
            onPress={() => navigation?.navigate?.(ROUTES.EDIT_PROFILE)}
            style={styles.editProfileButton}
            textStyle={styles.editProfileButtonText}
          />
        </TextCard>

        <TextCard cardStyle={styles.profileCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="person-outline" size={16} color={colors.title} />
            <Text style={styles.infoTitle}>Personal Information</Text>
          </View>
          {personalInfoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}:</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </TextCard>

        <ActionButton
          label="Settings"
          onPress={() => navigation?.navigate?.(ROUTES.SETTINGS)}
          style={styles.settingsButton}
          textStyle={styles.settingsButtonText}
        />
      </ScrollView>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>

      <Modal transparent visible={showSavedDialog} animationType="fade">
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 84,
    paddingBottom: 150,
    gap: spacing.sm,
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
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
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
  settingsButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    width: 160,
    flex: 0,
    marginTop: spacing.xs,
  },
  settingsButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
  },
  editProfileButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    width: 140,
    alignSelf: 'center',
    flex: 0,
    marginTop: spacing.xs,
  },
  editProfileButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
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
