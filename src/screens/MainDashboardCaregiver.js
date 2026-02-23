import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardHeader from '../components/common/DashboardHeader';
import { colors, spacing, typography } from '../constants/Themes';

export default function MainDashboardCaregiver() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.stickyHeader}>
        <DashboardHeader
          firstName="Caregiver"
          onHelpPress={() => Alert.alert('DashboardHeader', 'Help pressed')}
          onProfilePress={() => Alert.alert('DashboardHeader', 'Profile pressed')}
          profileImageSource={{ uri: 'https://i.pravatar.cc/224?img=15' }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Caregiver Dashboard</Text>
        <Text style={styles.subtitle}>Your dashboard content goes here.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  stickyHeader: {
    position: 'absolute',
    top: spacing.xxl,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  container: {
    paddingTop: 120,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.body,
  },
});
