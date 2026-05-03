import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import SearchBar from '../../../shared/components/common/SearchBar';
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
  { id: 'patient-4', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: 'patient-5', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
];

export default function LinkRequestsScreen({ navigation }) {
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

  const pendingRequests = useMemo(
    () => patientCaregiverLinkService.getPendingRequestsForCaregiver(CURRENT_CAREGIVER_ID),
    [statusMessage]
  );

  const pendingByPatientId = useMemo(
    () => new Map(pendingRequests.map((request) => [request.patientId, request])),
    [pendingRequests]
  );

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return PATIENT_DIRECTORY.filter((patient) => pendingByPatientId.has(patient.id));
    }

    return PATIENT_DIRECTORY.filter((patient) => {
      if (!pendingByPatientId.has(patient.id)) {
        return false;
      }

      return patient.name.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query);
    });
  }, [pendingByPatientId, searchQuery]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const showStatus = (message) => {
    setStatusMessage(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleApprove = (patientId) => {
    patientCaregiverLinkService.approvePatientLink(patientId, CURRENT_CAREGIVER_ID);
    showStatus('Link approved');
  };

  const handleReject = (patientId) => {
    patientCaregiverLinkService.rejectPatientLink(patientId, CURRENT_CAREGIVER_ID);
    showStatus('Link rejected');
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
            <Ionicons name="git-pull-request-outline" size={24} color={colors.brandText} />
            <Text style={styles.title}>Link Requests</Text>
          </View>
          <Text style={styles.subtitle}>Review patient link requests waiting for approval.</Text>
        </View>

        <TextCard cardStyle={styles.listCard}>
          <SearchBar placeholder="Find a patient" value={searchQuery} onChangeText={setSearchQuery} />

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {filteredPatients.map((patient) => (
              <View key={patient.id} style={styles.requestRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-circle-outline" size={34} color={colors.brandText} />
                  <View>
                    <Text style={styles.requestName}>{patient.name}</Text>
                    <Text style={styles.requestEmail}>{patient.email}</Text>
                  </View>
                </View>

                <View style={styles.rowActions}>
                  <ActionButton label="Reject" variant="outline" onPress={() => handleReject(patient.id)} />
                  <ActionButton label="Approve" variant="solid" onPress={() => handleApprove(patient.id)} />
                </View>
              </View>
            ))}

            {!filteredPatients.length ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptySubtitle}>Any caregiver requests sent to you will show up here.</Text>
              </View>
            ) : null}
          </ScrollView>
        </TextCard>
      </View>

      <View style={styles.statusWrap} pointerEvents="none">
        {statusMessage ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function TextCard({ cardStyle, children }) {
  return <View style={[styles.textCardBase, cardStyle]}>{children}</View>;
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
  textCardBase: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  requestRow: {
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  requestName: {
    ...typography.body,
    color: colors.brandText,
    fontWeight: '700',
  },
  requestEmail: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  statusWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 78,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
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
  },
  statusText: {
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
