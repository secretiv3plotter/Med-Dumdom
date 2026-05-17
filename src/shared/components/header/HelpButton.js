import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

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
        {
          minWidth: scaleLayoutValue(BUTTON_VISUAL_SIZE),
          gap: scaleLayoutValue(spacing.xxs),
        },
        pressed && !disabled && styles.pressed,
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
