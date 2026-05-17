import { StyleSheet, View } from 'react-native';
import HelpButton from '../header/HelpButton';
import ProfileButton from '../header/ProfileButton';
import { colors, moderateScale, spacing } from '../../theme';

const HEADER_ACTION_ICON_SIZE = moderateScale(30);
const HELP_ICON_SIZE = moderateScale(34);
const HEADER_ACTION_ICON_BASE_OFFSET = { marginBottom: moderateScale(-6) };

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
        <HelpButton
          onPress={onHelpPress}
          disabled={helpDisabled}
          iconSize={HELP_ICON_SIZE}
          iconWrapStyle={HEADER_ACTION_ICON_BASE_OFFSET}
        />
        <HelpButton
          label="Settings"
          icon="settings-outline"
          iconSize={HEADER_ACTION_ICON_SIZE}
          iconWrapStyle={HEADER_ACTION_ICON_BASE_OFFSET}
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
    gap: spacing.xs,
  },
});
