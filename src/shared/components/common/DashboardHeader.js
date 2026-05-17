import { StyleSheet, View } from 'react-native';
import HelpButton from '../header/HelpButton';
import ProfileButton from '../header/ProfileButton';
import { accessibility, moderateScale, spacing } from '../../theme';

const HEADER_ACTION_ICON_SIZE = moderateScale(30);
const HELP_ICON_SIZE = moderateScale(34);
const HEADER_ACTION_TOUCH_SIZE = accessibility.minTouchTarget + spacing.xs;
const HEADER_ACTION_ICON_OFFSET = { marginBottom: moderateScale(-6) };
const HEADER_ACTION_COLOR = '#000000';

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
          icon="help-circle"
          iconSize={HELP_ICON_SIZE}
          iconColor={HEADER_ACTION_COLOR}
          style={styles.headerActionButton}
          iconWrapStyle={[styles.headerActionIconWrap, HEADER_ACTION_ICON_OFFSET]}
          textStyle={styles.headerActionText}
        />
        <HelpButton
          label="Settings"
          icon="settings"
          iconSize={HEADER_ACTION_ICON_SIZE}
          iconColor={HEADER_ACTION_COLOR}
          style={styles.headerActionButton}
          iconWrapStyle={[styles.headerActionIconWrap, HEADER_ACTION_ICON_OFFSET]}
          textStyle={styles.headerActionText}
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
  headerActionButton: {
    width: HEADER_ACTION_TOUCH_SIZE,
    minWidth: HEADER_ACTION_TOUCH_SIZE,
    gap: spacing.xxs,
  },
  headerActionIconWrap: {
    width: HEADER_ACTION_TOUCH_SIZE,
    height: HEADER_ACTION_TOUCH_SIZE,
  },
  headerActionText: {
    color: HEADER_ACTION_COLOR,
  },
});
