import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CrudButton from '../components/common/CrudButton';
import DashboardHeader from '../components/common/DashboardHeader';
import SearchBar from '../components/common/SearchBar';
import TextCard from '../components/common/TextCard';
import { ROUTES } from '../constants/routes';
import { colors, radius, spacing, typography } from '../constants/Themes';

const patients = [
  { name: 'Andrea Santos', age: '36', address: 'Gorordo, Lahug, Cebu' },
  { name: 'John Doe', age: '27', address: 'Bulacao, Cebu City, Cebu' },
  { name: 'Pedro Penduks', age: '50', address: 'Liloan, Minglanilla, Cebu' },
  { name: 'Miguel Santos', age: '60', address: 'San Isidro, Quezon City, Metro Manila' },
  { name: 'Alyssa Mae Rivera', age: '16', address: 'Mabini, Davao City, Davao del Sur' },
  { name: 'Carlo Mendoza', age: '67', address: 'Poblacion, Cebu City, Cebu' },
  { name: 'Anne Villanueva', age: '70', address: 'Malinis, Bacoor City, Cavite' },
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

export default function MainDashboardCaregiver({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const goToLinkPatientPage = () => navigation?.navigate?.(ROUTES.LINK_TO_PATIENT_MAIN);
  const goToLinkRequestsPage = () => navigation?.navigate?.(ROUTES.LINK_REQUESTS);

  const openPatientDashboard = (patientName) =>
    navigation?.navigate?.(ROUTES.PATIENT_SPECIFIC_DASHBOARD, { patientName });

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return patients;
    }
    return patients.filter((patient) => patient.name.toLowerCase().startsWith(query));
  }, [searchQuery]);

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
            onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT)}
            onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE)}
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
            <SearchBar placeholder="Find a patient" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={searchQuery ? '' : 'Find a patient'}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInputOverlay}
            />
          </View>

          <View style={styles.patientList}>
            {filteredPatients.map((patient) => (
              <Pressable
                key={patient.name}
                onPress={() => openPatientDashboard(patient.name)}
                style={styles.patientPressable}
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
});
