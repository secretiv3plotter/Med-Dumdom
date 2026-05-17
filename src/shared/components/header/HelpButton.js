import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';

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
  iconColor: iconColorOverride,
  ...pressableProps
}) {
  const iconColor = disabled ? colors.bodyMuted : iconColorOverride || colors.brand;

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
      <View style={[styles.iconWrap, iconWrapStyle, circleStyle]}>
        <Ionicons
          name={icon}
          size={iconSize}
          color={iconColor}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <Text style={[styles.label, disabled ? styles.disabledText : styles.defaultText, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: BUTTON_VISUAL_SIZE,
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
    gap: 0,
  },
  iconWrap: {
    width: BUTTON_VISUAL_SIZE,
    height: BUTTON_VISUAL_SIZE,
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
