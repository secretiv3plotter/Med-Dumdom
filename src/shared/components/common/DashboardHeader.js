import { StyleSheet, View } from 'react-native';
import HelpButton from '../header/HelpButton';
import ProfileButton from '../header/ProfileButton';
import { colors, moderateScale, spacing } from '../../theme';

const SETTINGS_ICON_SIZE = moderateScale(48);

export default function DashboardHeader({
  onHelpPress,
  onSettingsPress,
  onProfilePress,
  profileImageSource,
  helpDisabled = false,
  settingsDisabled = false,
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
      </View>

      <View style={styles.rightGroup}>
        <HelpButton onPress={onHelpPress} disabled={helpDisabled} />
        <HelpButton
          label="Settings"
          icon="settings-outline"
          iconSize={SETTINGS_ICON_SIZE}
          onPress={onSettingsPress}
          disabled={settingsDisabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
