import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CrudButton from '../components/common/CrudButton';
import DashboardHeader from '../components/common/DashboardHeader';
import SearchBar from '../components/common/SearchBar';
import TextCard from '../components/common/TextCard';
import UserCard from '../components/common/UserCard';
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
    return patients.filter((patient) =>
      patient.name
        .toLowerCase()
        .split(' ')
        .some((part) => part.startsWith(query)),
    );
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
            <SearchBar
              placeholder="Find a patient"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.patientList}>
            {filteredPatients.map((patient) => (
              <Pressable
                key={patient.name}
                onPress={() => openPatientDashboard(patient.name)}
                style={styles.patientPressable}
              >
                <UserCard
                  name={patient.name}
                  subtitle={patient.age}
                  details={patient.address}
                  showActions={false}
                  cardStyle={styles.patientCard}
                />
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
  patientPressable: {
    borderRadius: radius.lg,
  },
  patientCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
