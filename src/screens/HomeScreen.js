import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/common/PrimaryButton';
import AppointmentCard from '../components/home/AppointmentCard';
import SearchBar from '../components/home/SearchBar';
import { colors, spacing } from '../constants/theme';
import { homeContent } from '../data/mockData';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{homeContent.appName}</Text>
        <Text style={styles.subtitle}>{homeContent.greeting}</Text>

        <SearchBar placeholder={homeContent.searchPlaceholder} />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <View style={styles.row}>
          <PrimaryButton label={homeContent.actions.primary} />
          <PrimaryButton label={homeContent.actions.secondary} variant="outline" />
        </View>
      </ScrollView>
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
});
