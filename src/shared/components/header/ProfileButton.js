import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';

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
  const iconColor = disabled ? colors.bodyMuted : colors.title;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      <View style={[styles.iconWrap, iconWrapStyle]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={[styles.profileImage, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }, imageStyle]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Ionicons
            name={icon}
            size={iconSize}
            color={iconColor}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
      </View>

      <Text style={[styles.label, disabled ? styles.disabledText : styles.defaultText, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: PROFILE_BUTTON_SIZE,
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  iconWrap: {
    width: PROFILE_BUTTON_SIZE,
    height: PROFILE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
