import { StyleSheet, View } from 'react-native';
import HelpButton from '../header/HelpButton';
import ProfileButton from '../header/ProfileButton';
import { accessibility, colors, moderateScale, spacing } from '../../theme';

const HEADER_ACTION_ICON_SIZE = moderateScale(30);
const HELP_ICON_SIZE = moderateScale(34);
const HEADER_ACTION_TOUCH_SIZE = accessibility.minTouchTarget + spacing.xs;
const SETTINGS_ACTION_LABEL_WIDTH = moderateScale(72);
const HEADER_ACTION_ICON_OFFSET = { marginBottom: moderateScale(-6) };

export default function DashboardHeader({
  onHelpPress,
  onSettingsPress,
  onProfilePress,
  profileImageSource,
  profileContent = null,
  leftGroupStyle,
  helpDisabled = false,
  settingsDisabled = false,
  profileDisabled = false,
  style,
}) {
  const headerActionColor = colors.title;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.leftGroup, leftGroupStyle]}>
        <ProfileButton
          onPress={onProfilePress}
          disabled={profileDisabled}
          imageSource={profileImageSource}
        />
        {profileContent}
      </View>

      <View style={styles.rightGroup}>
        <HelpButton
          label="Settings"
          truncateLabel
          icon="settings"
          iconSize={HEADER_ACTION_ICON_SIZE}
          iconColor={headerActionColor}
          style={[styles.headerActionButton, styles.settingsActionButton]}
          iconWrapStyle={[styles.headerActionIconWrap, HEADER_ACTION_ICON_OFFSET]}
          textStyle={styles.headerActionText}
          onPress={onSettingsPress}
          disabled={settingsDisabled}
        />
        <HelpButton
          truncateLabel
          onPress={onHelpPress}
          disabled={helpDisabled}
          icon="help-circle"
          iconSize={HELP_ICON_SIZE}
          iconColor={headerActionColor}
          style={styles.headerActionButton}
          iconWrapStyle={[styles.headerActionIconWrap, HEADER_ACTION_ICON_OFFSET]}
          textStyle={styles.headerActionText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  rightGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionButton: {
    width: HEADER_ACTION_TOUCH_SIZE,
    minWidth: HEADER_ACTION_TOUCH_SIZE,
    gap: spacing.xxs,
  },
  settingsActionButton: {
    width: SETTINGS_ACTION_LABEL_WIDTH,
    minWidth: SETTINGS_ACTION_LABEL_WIDTH,
  },
  headerActionIconWrap: {
    width: HEADER_ACTION_TOUCH_SIZE,
    height: HEADER_ACTION_TOUCH_SIZE,
  },
  headerActionText: {
    color: colors.title,
  },
});
