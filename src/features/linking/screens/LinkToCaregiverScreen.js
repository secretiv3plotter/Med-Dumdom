import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import patientCaregiverLinkService from '../../../domain/services/PatientCaregiverLinkService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_PATIENT_ID = 'current-patient';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const CAREGIVER_DIRECTORY = [
  { id: 'caregiver-1', name: 'Jane Doe', email: 'janedoe@gmail.com' },
  { id: 'caregiver-2', name: 'John Doe', email: 'johndoe@gmail.com' },
  { id: 'caregiver-3', name: 'Andrea Santos', email: 'andrea.santos@gmail.com' },
  { id: 'caregiver-4', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: 'caregiver-5', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
];

export default function LinkToCaregiverScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const outgoingRequests = useMemo(
    () => patientCaregiverLinkService.getOutgoingRequestsForPatient(CURRENT_PATIENT_ID),
    [statusMessage]
  );

  const pendingCaregiverIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.caregiverId)),
    [outgoingRequests]
  );

  const linkedCaregiverId = useMemo(
    () => patientCaregiverLinkService.getLinkedCaregiver(CURRENT_PATIENT_ID),
    [statusMessage]
  );

  const filteredCaregivers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const source = CAREGIVER_DIRECTORY.filter(
      (caregiver) => caregiver.id !== linkedCaregiverId
    );

    if (!normalizedQuery) {
      return source;
    }

    return source.filter((caregiver) => {
      return (
        caregiver.name.toLowerCase().includes(normalizedQuery) ||
        caregiver.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [linkedCaregiverId, query]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const flashStatus = (message) => {
    setStatusMessage(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatusMessage(''), 2500);
  };

  const sendRequest = (caregiverId) => {
    patientCaregiverLinkService.requestPatientLink(CURRENT_PATIENT_ID, caregiverId);
    flashStatus('Request sent');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <BackButton
          onPress={() => navigation?.goBack?.()}
          disabled={!canGoBack}
          style={styles.backButton}
        />

        <View style={styles.headerWrap}>
          <View style={styles.titleRow}>
            <Ionicons name="people-outline" size={24} color={colors.brandText} />
            <Text style={styles.title}>Caregivers</Text>
          </View>
          <Text style={styles.subtitle}>Send a link request to a caregiver you want to connect with.</Text>
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
              const isPending = pendingCaregiverIds.has(caregiver.id);

              return (
                <Pressable
                  key={caregiver.id}
                  style={({ pressed }) => [styles.caregiverCard, pressed && styles.cardPressed]}
                  onPress={() => !isPending && sendRequest(caregiver.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isPending ? 'Request already sent to' : 'Request access from'} ${caregiver.name}`}
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

                  <View style={[styles.actionCircle, isPending && styles.actionCircleRequested]}>
                    <Ionicons
                      name={isPending ? 'time-outline' : 'add'}
                      size={24}
                      color={isPending ? colors.bodyMuted : colors.surface}
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
      </View>

      {statusMessage ? (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        </View>
      ) : null}

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
  page: {
    flex: 1,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.brandText,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.brandText,
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
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
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
  toastOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 78,
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
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
