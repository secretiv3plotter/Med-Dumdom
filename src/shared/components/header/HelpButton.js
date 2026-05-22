import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

const BUTTON_VISUAL_SIZE = accessibility.minTouchTarget + spacing.xs;

export default function HelpButton({
  onPress,
  disabled = false,
  label = 'Help',
  icon = 'help-circle-outline',
  iconSize = BUTTON_VISUAL_SIZE,
  style,
  iconWrapStyle,
  circleStyle,
  textStyle,
  truncateLabel = false,
  iconColor: iconColorOverride,
  ...pressableProps
}) {
  const { darkModeEnabled } = useTextScale();
  const iconColor = disabled ? colors.bodyMuted : iconColorOverride || colors.brand;
  const pressedBackgroundColor = darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : '#C7DBFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.container,
        {
          minWidth: scaleLayoutValue(BUTTON_VISUAL_SIZE),
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
            width: scaleLayoutValue(BUTTON_VISUAL_SIZE),
            height: scaleLayoutValue(BUTTON_VISUAL_SIZE),
          },
          iconWrapStyle,
          circleStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={scaleLayoutValue(iconSize)}
          color={iconColor}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <Text
        numberOfLines={truncateLabel ? 1 : undefined}
        ellipsizeMode={truncateLabel ? 'tail' : undefined}
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
    gap: 0,
  },
  iconWrap: {
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
    color: colors.brand,
  },
  disabledText: {
    color: colors.bodyMuted,
  },
  pressed: {
    backgroundColor: '#C7DBFF',
    borderRadius: spacing.xs,
  },
});
