import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

const PROFILE_BUTTON_SIZE = accessibility.minTouchTarget + spacing.xs;

export default function ProfileButton({
  onPress,
  disabled = false,
  label = 'Profile',
  icon = 'person-circle-outline',
  iconSize = PROFILE_BUTTON_SIZE,
  imageSource,
  style,
  iconWrapStyle,
  imageStyle,
  textStyle,
  ...pressableProps
}) {
  const { darkModeEnabled } = useTextScale();
  const iconColor = disabled ? colors.bodyMuted : colors.title;
  const pressedBackgroundColor = darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : '#C7DBFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityLabel={label === 'Profile' ? 'Open profile' : `Open ${label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.container,
        {
          minWidth: scaleLayoutValue(PROFILE_BUTTON_SIZE),
          gap: scaleLayoutValue(spacing.xxs),
        },
        pressed && !disabled && styles.pressed,
        pressed && !disabled && { backgroundColor: pressedBackgroundColor },
        style,
      ]}
      {...pressableProps}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: scaleLayoutValue(PROFILE_BUTTON_SIZE),
            height: scaleLayoutValue(PROFILE_BUTTON_SIZE),
          },
          iconWrapStyle,
        ]}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={[
              styles.profileImage,
              {
                width: scaleLayoutValue(iconSize),
                height: scaleLayoutValue(iconSize),
                borderRadius: scaleLayoutValue(iconSize / 2),
              },
              imageStyle,
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                width: scaleLayoutValue(iconSize),
                height: scaleLayoutValue(iconSize),
                borderRadius: scaleLayoutValue(iconSize / 2),
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Ionicons
              name="person"
              size={scaleLayoutValue(iconSize * 0.52)}
              color={colors.surface}
            />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.label,
          { marginTop: -scaleLayoutValue(moderateScale(2)) },
          disabled ? styles.disabledText : styles.defaultText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySmall,
    fontWeight: typography.button.fontWeight,
    marginTop: -moderateScale(2),
    flexShrink: 1,
    textAlign: 'center',
  },
  defaultText: {
    color: colors.title,
  },
  disabledText: {
    color: colors.bodyMuted,
  },
  pressed: {
    backgroundColor: '#C7DBFF',
    borderRadius: spacing.xs,
  },
});
