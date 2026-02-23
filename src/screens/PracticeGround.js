//practice ground for testing new components and styles

import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
import AppointmentCard from '../components/practice_ground/AppointmentCard';
import SearchBar from '../components/common/SearchBar';
import NavigationBar from '../components/common/NavigationBar';
import { colors, spacing } from '../constants/Themes';
import { homeContent } from '../data/PracticeGroundText';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{homeContent.appName}</Text>
        <Text style={styles.subtitle}>{homeContent.greeting}</Text>

        <SearchBar placeholder={homeContent.searchPlaceholder} />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <View style={styles.row}>
          <ActionButton label={homeContent.actions.primary} />
          <ActionButton label={homeContent.actions.secondary} variant="outline" />
        </View>
      </ScrollView>
      <View style={styles.navWrap}>
        <NavigationBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.title,
  },
  subtitle: {
    fontSize: 15,
    color: colors.body,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  navWrap: {
    width: '100%',
    backgroundColor: colors.surface,
  },
});
