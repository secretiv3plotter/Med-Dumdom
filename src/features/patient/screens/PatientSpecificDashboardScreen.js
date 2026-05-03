import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import TextCard from '../../../shared/components/common/TextCard';
import patientCaregiverLinkService from '../../../domain/services/PatientCaregiverLinkService';
import privacySettingsService from '../../../domain/services/PrivacySettingsService';
import reminderService from '../../../domain/services/ReminderService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_CAREGIVER_ID = 'current-caregiver';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const EMPTY_REMINDER = {
  title: '',
  message: '',
  dueDate: '',
  dueTime: '',
};

export default function PatientSpecificDashboardScreen({ navigation }) {
  const selectedPatientName = navigation?.currentParams?.patientName || 'Patient';
  const selectedPatientId = navigation?.currentParams?.patientId || '';
  const selectedPatientFirstName = selectedPatientName.split(' ')[0];
  const patientPossessive = selectedPatientName.endsWith('s')
    ? `${selectedPatientName}'`
    : `${selectedPatientName}'s`;

  const [manualReminderOpen, setManualReminderOpen] = useState(false);
  const [reminderDraft, setReminderDraft] = useState(EMPTY_REMINDER);
  const [statusMessage, setStatusMessage] = useState('');
  const timeoutRef = useRef(null);

  const hasAccess = useMemo(() => {
    if (!selectedPatientId) {
      return false;
    }

    return patientCaregiverLinkService.canCaregiverAccessPatient(selectedPatientId, CURRENT_CAREGIVER_ID);
  }, [selectedPatientId]);

  const canViewMedTracker = useMemo(() => {
    if (!selectedPatientId) {
      return false;
    }

    return privacySettingsService.canCaregiverViewMedTracker(selectedPatientId, CURRENT_CAREGIVER_ID);
  }, [selectedPatientId]);

  const canViewApptTracker = useMemo(() => {
    if (!selectedPatientId) {
      return false;
    }

    return privacySettingsService.canCaregiverViewApptTracker(selectedPatientId, CURRENT_CAREGIVER_ID);
  }, [selectedPatientId]);

  const canSendManualReminder = useMemo(() => {
    if (!selectedPatientId) {
      return false;
    }

    return privacySettingsService.canCaregiverSendManualReminder(selectedPatientId, CURRENT_CAREGIVER_ID);
  }, [selectedPatientId]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const sendManualReminder = () => {
    if (!selectedPatientId) {
      return;
    }

    const dueAtText = reminderDraft.dueDate && reminderDraft.dueTime
      ? `${reminderDraft.dueDate}T${reminderDraft.dueTime}:00`
      : reminderDraft.dueDate
        ? `${reminderDraft.dueDate}T00:00:00`
        : '';
    const parsedDueAt = dueAtText ? new Date(dueAtText) : new Date();
    const dueAt = Number.isNaN(parsedDueAt.getTime()) ? new Date() : parsedDueAt;
    reminderService.createManualReminder(CURRENT_CAREGIVER_ID, selectedPatientId, {
      title: reminderDraft.title.trim() || 'Manual reminder',
      message: reminderDraft.message.trim() || 'You have a new caregiver reminder.',
      dueAt,
    });
    setManualReminderOpen(false);
    setReminderDraft(EMPTY_REMINDER);
    setStatusMessage('Manual reminder sent');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatusMessage(''), 2500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topSection}>
        <DashboardHeader
          firstName={selectedPatientFirstName}
          onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME })}
          onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE, { returnTo: ROUTES.HOME })}
          style={styles.header}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TextCard
          title={patientPossessive}
          body="Med+Dumdom"
          cardStyle={styles.patientTitleCard}
          titleStyle={styles.patientTitle}
          bodyStyle={styles.patientProgram}
        />

        {hasAccess && canSendManualReminder ? (
          <ClickableCard
            size="landscape"
            title="Manual Reminder"
            subtitle="Send a manual reminder to this patient"
            onPress={() => setManualReminderOpen(true)}
            cardStyle={[styles.actionCard, styles.progressCardSize]}
            titleStyle={styles.actionCardTitle}
            subtitleStyle={styles.actionCardSubtitle}
          />
        ) : null}

        {(canViewMedTracker || canViewApptTracker) ? (
          <View style={styles.bottomGrid}>
            {canViewMedTracker ? (
              <ClickableCard
                title="Medication Tracker"
                subtitle="Track your medication"
                onPress={() => navigation?.navigate?.(ROUTES.MED_TRACKER, { patientName: selectedPatientName })}
                cardStyle={[styles.actionCard, styles.bottomCardSize]}
                titleStyle={styles.actionCardTitle}
                subtitleStyle={styles.actionCardSubtitle}
              />
            ) : null}
            {canViewApptTracker ? (
              <ClickableCard
                title="Consultations"
                subtitle="Schedule consultations"
                onPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER, { patientName: selectedPatientName })}
                cardStyle={[styles.actionCard, styles.bottomCardSize]}
                titleStyle={styles.actionCardTitle}
                subtitleStyle={styles.actionCardSubtitle}
              />
            ) : null}
          </View>
        ) : null}

        {hasAccess && !canViewMedTracker && !canViewApptTracker && !canSendManualReminder ? (
          <Text style={styles.restrictedText}>This patient has not granted any caregiver access yet.</Text>
        ) : null}
      </ScrollView>

      <Modal
        visible={manualReminderOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setManualReminderOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setManualReminderOpen(false)}>
          <Pressable style={styles.dialogCard} onPress={() => {}}>
            <Text style={styles.dialogTitle}>Send Manual Reminder</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.placeholder}
              value={reminderDraft.title}
              onChangeText={(value) => setReminderDraft((current) => ({ ...current, title: value }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Message"
              placeholderTextColor={colors.placeholder}
              value={reminderDraft.message}
              onChangeText={(value) => setReminderDraft((current) => ({ ...current, message: value }))}
              style={[styles.input, styles.messageInput]}
              multiline
            />
            <NativeDateTimeField
              label="Due date"
              placeholder="Select due date"
              accessibilityLabel="Due date"
              value={reminderDraft.dueDate}
              onChange={(value) => setReminderDraft((current) => ({ ...current, dueDate: value }))}
              optional
            />
            <NativeDateTimeField
              mode="time"
              label="Due time"
              placeholder="Select due time"
              accessibilityLabel="Due time"
              value={reminderDraft.dueTime}
              onChange={(value) => setReminderDraft((current) => ({ ...current, dueTime: value }))}
              optional
            />
            <View style={styles.dialogActions}>
              <ActionButton label="Cancel" variant="outline" onPress={() => setManualReminderOpen(false)} />
              <ActionButton label="Send" variant="solid" onPress={sendManualReminder} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(statusMessage)} animationType="fade">
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#ECEFF4',
    gap: spacing.xs,
  },
  header: {
    borderBottomWidth: 0,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.md,
  },
  patientTitleCard: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.border,
    borderRadius: radius.xl,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  patientTitle: {
    ...typography.title,
    color: colors.brandText,
    fontSize: 28,
    lineHeight: 34,
  },
  patientProgram: {
    ...typography.title,
    color: colors.brandText,
    fontSize: 28,
    lineHeight: 34,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.brandText,
    borderRadius: radius.lg,
  },
  progressCardSize: {
    minHeight: 142,
  },
  actionCardTitle: {
    color: colors.brandText,
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    color: colors.title,
    ...typography.subtitle,
    fontWeight: '400',
  },
  bottomGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomCardSize: {
    flex: 1,
    minHeight: 210,
  },
  restrictedText: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.md,
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
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dialogTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.body,
  },
  messageInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toastOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toastText: {
    ...typography.button,
    color: colors.brandText,
  },
});
