import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const TOP_PADDING = 36;
const SEARCH_STICKY_OFFSET = TOP_PADDING + spacing.xs;

export default function MainDashboardCaregiver({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const scrollRef = useRef(null);
  const searchBarOffsetY = useRef(0);
  const isSearchStickyRef = useRef(false);
  const shouldFocusFloatingRef = useRef(false);
  const floatingInputRef = useRef(null);

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

  const handleSearchFocus = () => {
    shouldFocusFloatingRef.current = true;
    if (!scrollRef.current) {
      return;
    }
    const targetY = Math.max(0, searchBarOffsetY.current - SEARCH_STICKY_OFFSET);
    scrollRef.current.scrollTo({ y: targetY, animated: true });
  };

  const handleScroll = (event) => {
    if (!searchBarOffsetY.current) {
      return;
    }
    const currentY = event.nativeEvent.contentOffset.y;
    const stickyPoint = Math.max(0, searchBarOffsetY.current - SEARCH_STICKY_OFFSET);
    const shouldStick = currentY >= stickyPoint;
    if (shouldStick !== isSearchStickyRef.current) {
      isSearchStickyRef.current = shouldStick;
      setIsSearchSticky(shouldStick);
      if (shouldStick && shouldFocusFloatingRef.current) {
        shouldFocusFloatingRef.current = false;
        requestAnimationFrame(() => {
          floatingInputRef.current?.focus?.();
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View
        style={[
          styles.floatingSearchBar,
          isSearchSticky ? styles.floatingSearchBarVisible : styles.floatingSearchBarHidden,
        ]}
        pointerEvents={isSearchSticky ? 'auto' : 'none'}
      >
        <View style={styles.searchBarInner}>
          <View pointerEvents="none">
            <SearchBar placeholder="Find a patient" />
          </View>
          <TextInput
            ref={floatingInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchQuery ? '' : 'Find a patient'}
            placeholderTextColor={colors.placeholder}
            style={styles.searchInputOverlay}
          />
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.contentCard}>
          <DashboardHeader
            firstName="Jane!"
            onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT)}
            onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE)}
            style={styles.header}
            accentColor={colors.brandText}
          />

          <View style={styles.addPatientCardsRow}>
            <TextCard cardStyle={styles.addPatientCard}>
              <CrudButton
                label="Add A Patient"
                onPress={goToLinkPatientPage}
                variant="outline"
                iconSize={22}
                style={styles.addButton}
                circleStyle={styles.addButtonCircle}
                textStyle={styles.addButtonText}
              />
            </TextCard>
            <TextCard cardStyle={styles.addPatientCard}>
              <CrudButton
                label="Patient Requests"
                icon="checkmark"
                onPress={goToLinkRequestsPage}
                variant="outline"
                iconSize={22}
                style={styles.addButton}
                circleStyle={styles.addButtonCircle}
                textStyle={styles.addButtonText}
              />
            </TextCard>
          </View>
        </View>

        <View
          style={[styles.stickySearchBar, isSearchSticky && styles.inlineSearchBarHidden]}
          onLayout={(event) => {
            searchBarOffsetY.current = event.nativeEvent.layout.y;
          }}
          pointerEvents={isSearchSticky ? 'none' : 'auto'}
        >
          <View style={styles.searchBarInner}>
            <View pointerEvents="none">
              <SearchBar placeholder="Find a patient" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              placeholder={searchQuery ? '' : 'Find a patient'}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInputOverlay}
            />
          </View>
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
                variant="dashboard"
                avatarContent={
                  <Ionicons name="person-circle-outline" size={54} color={colors.brandText} />
                }
              />
            </Pressable>
          ))}
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
    paddingHorizontal: spacing.sm,
    paddingTop: TOP_PADDING,
    paddingBottom: spacing.xl,
  },
  contentCard: {
    backgroundColor: '#ECEFF4',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xxs,
    gap: spacing.sm,
  },
  header: {
    borderBottomWidth: 0,
  },
  addPatientCardsRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
    marginHorizontal: -spacing.sm,
  },
  addPatientCard: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    minHeight: 78,
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  addButton: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  addButtonCircle: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
  },
  addButtonText: {
    color: colors.surface,
    ...typography.body,
    fontWeight: '700',
    marginTop: 0,
    flexShrink: 1,
  },
  patientList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  floatingSearchBar: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: SEARCH_STICKY_OFFSET,
    zIndex: 10,
  },
  floatingSearchBarHidden: {
    opacity: 0,
  },
  floatingSearchBarVisible: {
    opacity: 1,
  },
  stickySearchBar: {
    position: 'relative',
    zIndex: 4,
    elevation: 4,
  },
  inlineSearchBarHidden: {
    opacity: 0,
  },
  searchBarInner: {
    position: 'relative',
    backgroundColor: '#ECEFF4',
    paddingBottom: spacing.xxs,
  },
  searchInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand,
    color: colors.brandText,
  },
  patientPressable: {
    borderRadius: radius.lg,
  },
});
