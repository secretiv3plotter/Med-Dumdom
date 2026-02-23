import { StyleSheet, Text, View } from 'react-native';
import HelpButton from '../dashboard_header/HelpButton';
import ProfileButton from '../dashboard_header/ProfileButton';
import { colors, spacing, typography } from '../../constants/Themes';

export default function DashboardHeader({
  firstName = 'User',
  onHelpPress,
  onProfilePress,
  profileImageSource,
  helpDisabled = false,
  profileDisabled = false,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftGroup}>
        <ProfileButton
          onPress={onProfilePress}
          disabled={profileDisabled}
          imageSource={profileImageSource}
        />
        <Text style={styles.greeting} numberOfLines={1}>
          Hi, {firstName}
        </Text>
      </View>

      <HelpButton onPress={onHelpPress} disabled={helpDisabled} style={styles.helpButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    borderBottomWidth: 5,
    borderBottomColor: colors.border,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  greeting: {
    ...typography.title,
    color: colors.title,
    fontWeight: typography.button.fontWeight,
    maxWidth: 140,
  },
  helpButton: {
    marginTop: spacing.xl,
  },
});
