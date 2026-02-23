import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export default function AppointmentCard({ title, details }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>{details}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandText,
  },
  details: {
    marginTop: 6,
    fontSize: 14,
    color: colors.brandSubText,
  },
});
