import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import patientCaregiverLinkService from '../../../domain/services/PatientCaregiverLinkService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_CAREGIVER_ID = 'current-caregiver';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const PATIENT_DIRECTORY = [
  { id: 'patient-1', name: 'Jane Doe', email: 'janedoe@gmail.com' },
  { id: 'patient-2', name: 'John Doe', email: 'johndoe@gmail.com' },
  { id: 'patient-3', name: 'Andrea Santos', email: 'andrea.santos@gmail.com' },
  { id: 'patient-4', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
  { id: 'patient-5', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: 'patient-6', name: 'Carlo Mendoza', email: 'carlo.mendoza@gmail.com' },
];

export default function LinkToPatientMainPageScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
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

  const linkedPatientIds = useMemo(
    () => new Set(patientCaregiverLinkService.getLinkedPatients(CURRENT_CAREGIVER_ID)),
    [statusMessage]
  );

  const outgoingRequests = useMemo(
    () => patientCaregiverLinkService.getPendingRequestsForCaregiver(CURRENT_CAREGIVER_ID),
    [statusMessage]
  );

  const pendingPatientIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.patientId)),
    [outgoingRequests]
  );

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = PATIENT_DIRECTORY;

    if (!query) {
      return source;
    }

    return source.filter((patient) => {
      return patient.name.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query);
    });
  }, [searchQuery]);

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

  const sendRequest = (patientId) => {
    patientCaregiverLinkService.requestPatientLink(patientId, CURRENT_CAREGIVER_ID);
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
            <Text style={styles.title}>Patients</Text>
          </View>
          <Text style={styles.subtitle}>Link with a patient using the current caregiver access flow.</Text>
        </View>

        <View style={styles.listCard}>
          <View style={styles.searchContainer}>
            <View style={styles.localSearchBar}>
              <Ionicons name="search-outline" size={22} color={colors.placeholder} />
              <TextInput
                placeholder="Find a patient"
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.localSearchInput}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {filteredPatients.map((patient) => {
              const isLinked = linkedPatientIds.has(patient.id);
              const isPending = pendingPatientIds.has(patient.id);
              const isDisabled = isLinked || isPending;

              return (
                <Pressable
                  key={patient.id}
                  style={({ pressed }) => [styles.patientRow, pressed && styles.cardPressed]}
                  onPress={() => !isDisabled && sendRequest(patient.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${isDisabled ? 'Request already handled for' : 'Request access for'} ${patient.name}`}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name="person-circle-outline" size={34} color={colors.brandText} />
                    <View>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientEmail}>{patient.email}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusChip, isLinked && styles.statusChipLinked, isPending && styles.statusChipPending]}>
                    <Text style={styles.statusChipText}>
                      {isLinked ? 'Linked' : isPending ? 'Pending' : 'Request'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
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
  listCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: '#C9D6EA',
    borderWidth: 1,
    borderRadius: radius.xl,
    gap: spacing.sm,
    padding: spacing.md,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
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
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F6FB',
    borderColor: '#0B5FFF',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  cardPressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  patientName: {
    ...typography.body,
    color: colors.brandText,
    fontWeight: '700',
  },
  patientEmail: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.brand,
  },
  statusChipPending: {
    backgroundColor: '#D1D5DB',
  },
  statusChipLinked: {
    backgroundColor: '#BFE8CF',
  },
  statusChipText: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
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
