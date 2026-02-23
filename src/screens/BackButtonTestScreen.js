import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import TextCard from '../components/common/TextCard';
import { colors, spacing } from '../constants/Themes';

export default function BackButtonTestScreen({ onGoBack = () => {} }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <BackButton label="Back to Practice" onPress={onGoBack} />

        <Text style={styles.title}>BackButton Test Page</Text>
        <Text style={styles.subtitle}>
          Tap the BackButton above. If it returns to Practice Ground, your component works for
          navigation.
        </Text>

        <TextCard
          title="Test Note"
          body="This separate page exists only to test BackButton in a real screen transition."
          footer="UI Component Playground"
        />
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
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.title,
  },
  subtitle: {
    fontSize: 15,
    color: colors.body,
  },
});
