import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CrudButton from '../../../shared/components/common/CrudButton';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import SearchBar from '../../../shared/components/common/SearchBar';
import TextCard from '../../../shared/components/common/TextCard';
import patientCaregiverLinkService from '../../../domain/services/PatientCaregiverLinkService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const CURRENT_CAREGIVER_ID = 'current-caregiver';

const PATIENT_DIRECTORY = [
  { id: 'patient-1', name: 'Andrea Santos', age: '36', address: 'Gorordo, Lahug, Cebu' },
  { id: 'patient-2', name: 'John Doe', age: '27', address: 'Bulacao, Cebu City, Cebu' },
  { id: 'patient-3', name: 'Pedro Penduks', age: '50', address: 'Liloan, Minglanilla, Cebu' },
  { id: 'patient-4', name: 'Miguel Santos', age: '60', address: 'San Isidro, Quezon City, Metro Manila' },
  { id: 'patient-5', name: 'Alyssa Mae Rivera', age: '16', address: 'Mabini, Davao City, Davao del Sur' },
  { id: 'patient-6', name: 'Carlo Mendoza', age: '67', address: 'Poblacion, Cebu City, Cebu' },
  { id: 'patient-7', name: 'Anne Villanueva', age: '70', address: 'Malinis, Bacoor City, Cavite' },
];

function getInitials(name = '') {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function MainDashboardCaregiverScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const linkedPatientIds = new Set(patientCaregiverLinkService.getLinkedPatients(CURRENT_CAREGIVER_ID));

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const linkedPatients = PATIENT_DIRECTORY.filter((patient) => linkedPatientIds.has(patient.id));

    if (!query) {
      return linkedPatients;
    }

    return linkedPatients.filter((patient) => patient.name.toLowerCase().includes(query));
  }, [linkedPatientIds, searchQuery]);

  const goToLinkPatientPage = () => navigation?.navigate?.(ROUTES.LINK_TO_PATIENT_MAIN);
  const goToLinkRequestsPage = () => navigation?.navigate?.(ROUTES.LINK_REQUESTS);

  const openPatientDashboard = (patient) =>
    navigation?.navigate?.(ROUTES.PATIENT_SPECIFIC_DASHBOARD, {
      patientId: patient.id,
      patientName: patient.name,
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.contentCard}>
          <DashboardHeader
            firstName="Jane!"
            onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.CAREGIVER_HOME })}
            onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE, { returnTo: ROUTES.CAREGIVER_HOME })}
            style={styles.header}
          />

          <TextCard cardStyle={styles.addPatientTab}>
            <View style={styles.addPatientTabContent}>
              <CrudButton
                label="Add a patient"
                onPress={goToLinkPatientPage}
                style={styles.addButton}
                circleStyle={styles.addButtonCircle}
                textStyle={styles.addButtonText}
              />
              <CrudButton
                label="Review patient requests"
                icon="checkmark"
                onPress={goToLinkRequestsPage}
                style={styles.addButton}
                circleStyle={styles.addButtonCircle}
                textStyle={styles.addButtonText}
              />
            </View>
          </TextCard>

          <View style={styles.searchBarWrap}>
            <SearchBar placeholder="Find a linked patient" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={searchQuery ? '' : 'Find a linked patient'}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInputOverlay}
            />
          </View>

          <View style={styles.patientList}>
            {filteredPatients.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() => openPatientDashboard(patient)}
                unstable_pressDelay={0}
                style={({ pressed }) => [styles.patientPressable, pressed && styles.patientPressablePressed]}
              >
                <View style={styles.patientCard}>
                  <View style={styles.patientCardRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(patient.name)}</Text>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientSubtitle}>{patient.age}</Text>
                      <Text style={styles.patientDetails}>{patient.address}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {!filteredPatients.length ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={32} color={colors.bodyMuted} />
                <Text style={styles.emptyTitle}>No linked patients yet</Text>
                <Text style={styles.emptySubtitle}>Use the add patient flow to request access first.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  container: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  contentCard: {
    backgroundColor: '#ECEFF4',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  header: {
    borderBottomWidth: 0,
  },
  addPatientTab: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    minHeight: 78,
  },
  addPatientTabContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addButton: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  addButtonCircle: {
    width: 44,
    height: 44,
  },
  addButtonText: {
    color: colors.brand,
    ...typography.body,
    fontWeight: '700',
    marginTop: 0,
  },
  patientList: {
    gap: spacing.xs,
  },
  searchBarWrap: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  searchInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.brandText,
  },
  patientPressable: {
    borderRadius: radius.lg,
  },
  patientPressablePressed: {
    backgroundColor: '#C7DBFF',
  },
  patientCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  patientCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.brandText,
    fontWeight: '700',
    fontSize: 16,
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    color: colors.title,
    fontWeight: '700',
    fontSize: 16,
  },
  patientSubtitle: {
    color: colors.body,
    fontSize: 14,
    marginTop: 2,
  },
  patientDetails: {
    color: colors.bodyMuted,
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
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
});
