import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import NavigationBar from '../components/common/NavigationBar';
import { ROUTES } from '../constants/routes';
import { colors, radius, spacing, typography } from '../constants/Themes';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const caregivers = [
  { id: 'jane-doe', name: 'Jane Doe', email: 'janedoe@gmail.com' },
  { id: 'john-doe', name: 'John Doe', email: 'johndoe@gmail.com' },
  { id: 'andrea-santos', name: 'Andrea Santos', email: 'andrea.santos@gmail.com' },
  { id: 'miguel-santos', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: 'alyssa-rivera', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
];

export default function LinkToCaregiver({ navigation }) {
  const [query, setQuery] = useState('');
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [requestedIds, setRequestedIds] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    if (!confirmationMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setConfirmationMessage('');
    }, 1600);

    return () => clearTimeout(timer);
  }, [confirmationMessage]);

  const filteredCaregivers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return caregivers;
    }

    return caregivers.filter(({ name, email }) => {
      return (
        name.toLowerCase().includes(normalizedQuery) ||
        email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const openRequestDialog = (caregiver) => {
    if (requestedIds.includes(caregiver.id)) {
      setCancelTarget(caregiver);
      return;
    }

    setSelectedCaregiver(caregiver);
  };

  const sendRequest = () => {
    if (!selectedCaregiver) {
      return;
    }

    setRequestedIds((currentIds) =>
      currentIds.includes(selectedCaregiver.id) ? currentIds : [...currentIds, selectedCaregiver.id]
    );
    setSelectedCaregiver(null);
    setConfirmationMessage('Request sent');
  };

  const confirmCancellation = () => {
    if (!cancelTarget) {
      return;
    }

    setRequestedIds((currentIds) => currentIds.filter((id) => id !== cancelTarget.id));
    setCancelTarget(null);
    setConfirmationMessage('Request cancelled');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <BackButton
          onPress={() => navigation?.goBack?.()}
          disabled={!navigation?.canGoBack}
          showLabel={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="people-outline" size={28} color={colors.brandText} />
            <Text style={styles.title}>Caregivers</Text>
          </View>
          <Text style={styles.subtitle}>Manage who can access your health information.</Text>
        </View>

        <View style={styles.listShell}>
          <View style={styles.localSearchBar}>
            <Ionicons name="search-outline" size={22} color={colors.placeholder} />
            <TextInput
              placeholder="Search by name or email..."
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
              style={styles.localSearchInput}
            />
          </View>

          <View style={styles.list}>
            {filteredCaregivers.map((caregiver) => {
              const requested = requestedIds.includes(caregiver.id);

              return (
                <Pressable
                  key={caregiver.id}
                  style={({ pressed }) => [
                    styles.caregiverCard,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => openRequestDialog(caregiver)}
                  accessibilityRole="button"
                  accessibilityLabel={`${requested ? 'Cancel request for' : 'Request access from'} ${caregiver.name}`}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Ionicons name="person-circle-outline" size={44} color={colors.brandText} />
                    </View>

                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{caregiver.name}</Text>
                      <Text style={styles.cardSubtitle}>{caregiver.email}</Text>
                    </View>
                  </View>

                  <View style={[styles.actionCircle, requested && styles.actionCircleRequested]}>
                    <Ionicons
                      name={requested ? 'close' : 'add'}
                      size={24}
                      color={requested ? colors.bodyMuted : colors.surface}
                    />
                  </View>
                </Pressable>
              );
            })}

            {!filteredCaregivers.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No caregivers found</Text>
                <Text style={styles.emptySubtitle}>Try a different name or email.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(selectedCaregiver)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCaregiver(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.localDialogCard, styles.dialogSurface]}>
              <Text style={styles.dialogTitle}>Send Access Request</Text>
              {selectedCaregiver ? (
                <View style={styles.modalProfile}>
                  <Ionicons name="person-circle-outline" size={92} color={colors.title} />
                  <Text style={styles.modalName}>{selectedCaregiver.name}</Text>
                  <Text style={styles.modalEmail}>{selectedCaregiver.email}</Text>
                </View>
              ) : null}
              <View style={styles.localDialogActions}>
                <ActionButton
                  label="Cancel"
                  onPress={() => setSelectedCaregiver(null)}
                  variant="outline"
                  style={styles.localDialogAction}
                  textStyle={styles.dialogOutlineButtonText}
                />
                <ActionButton
                  label="Send Request"
                  onPress={sendRequest}
                  variant="solid"
                  style={styles.localDialogAction}
                  textStyle={styles.dialogSolidButtonText}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(cancelTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.localDialogCard, styles.dialogSurface]}>
              <Text style={styles.dialogTitle}>Cancel Access Request</Text>
              <Text style={styles.cancelDialogMessage}>Are you sure you want to cancel this request?</Text>
              {cancelTarget ? (
                <View style={styles.modalProfile}>
                  <Ionicons name="person-circle-outline" size={92} color={colors.title} />
                  <Text style={styles.modalName}>{cancelTarget.name}</Text>
                  <Text style={styles.modalEmail}>{cancelTarget.email}</Text>
                </View>
              ) : null}
              <View style={styles.localDialogActions}>
                <ActionButton
                  label="Keep Request"
                  onPress={() => setCancelTarget(null)}
                  variant="outline"
                  style={styles.localDialogAction}
                  textStyle={styles.dialogOutlineButtonText}
                />
                <ActionButton
                  label="Cancel Request"
                  onPress={confirmCancellation}
                  variant="solid"
                  style={styles.localDialogAction}
                  textStyle={styles.dialogSolidButtonText}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(confirmationMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmationMessage('')}
      >
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{confirmationMessage}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 150,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.brandText,
  },
  subtitle: {
    ...typography.body,
    color: colors.brandSubText,
    textAlign: 'center',
  },
  listShell: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  localSearchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  localSearchInput: {
    flex: 1,
    paddingVertical: spacing.xs,
    color: colors.body,
  },
  list: {
    gap: spacing.md,
  },
  caregiverCard: {
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: '#F6F9FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.body,
    color: colors.brandText,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 1,
  },
  actionCircleRequested: {
    backgroundColor: '#D1D5DB',
  },
  emptyState: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  toastOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    minWidth: 180,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    gap: spacing.md,
  },
  toastText: {
    ...typography.button,
    color: colors.brandText,
    textAlign: 'center',
  },
  modalCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  localDialogCard: {
    backgroundColor: '#E8EFF1',
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  localDialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  localDialogAction: {
    flex: 1,
  },
  modalProfile: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dialogSurface: {
    paddingTop: spacing.xl,
  },
  dialogTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.brand,
  },
  dialogOutlineButtonText: {
    color: colors.brand,
  },
  dialogSolidButtonText: {
    color: colors.surface,
  },
  cancelDialogMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  modalName: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalEmail: {
    ...typography.body,
    color: colors.body,
    textAlign: 'center',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
