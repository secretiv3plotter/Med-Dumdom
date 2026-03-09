import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import { colors, spacing, typography } from '../constants/Themes';

export default function MainDashboardCaregiver({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Caregiver Dashboard</Text>
        <Text style={styles.subtitle}>Caregiver-specific content goes here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    zIndex: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.body,
    textAlign: 'center',
  },
});
