import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, spacing, typography } from '../../constants/Themes';

const BUTTON_VISUAL_SIZE = accessibility.minTouchTarget + spacing.xs;

export default function HelpButton({
  onPress,
  disabled = false,
  label = 'Help',
  icon = 'help-circle-outline',
  iconSize = BUTTON_VISUAL_SIZE,
  iconColor: iconColorOverride,
  labelColor,
  style,
  iconWrapStyle,
  circleStyle,
  textStyle,
  ...pressableProps
}) {
  const iconColor = disabled ? colors.bodyMuted : iconColorOverride || colors.title;
  const effectiveLabelColor = disabled ? colors.bodyMuted : labelColor || colors.title;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.container, style]}
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

      <Text style={[styles.label, { color: effectiveLabelColor }, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: BUTTON_VISUAL_SIZE,
    alignItems: 'center',
    gap: 0,
  },
  iconWrap: {
    minWidth: accessibility.minTouchTarget,
    minHeight: accessibility.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodySmall,
    fontWeight: typography.button.fontWeight,
    marginTop: -spacing.xxs,
  },
});
