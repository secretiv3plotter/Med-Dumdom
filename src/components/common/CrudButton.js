import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, spacing, typography } from '../../constants/Themes';

const CIRCLE_SIZE = accessibility.minTouchTarget + spacing.xs;
const DEFAULT_ICON_SIZE = spacing.lg;

export default function CrudButton({
  label,
  icon = 'add',
  iconSize = DEFAULT_ICON_SIZE,
  onPress,
  variant = 'solid',
  disabled = false,
  style,
  circleStyle,
  textStyle,
  ...pressableProps
}) {
  const solid = variant === 'solid';
  const outline = variant === 'outline';
  const redSolid = variant === 'redSolid';
  const disabledIconColor = colors.bodyMuted;
  const iconColor = disabled ? disabledIconColor : solid || redSolid ? colors.surface : colors.brand;
  const effectiveIconSize = outline && iconSize === DEFAULT_ICON_SIZE ? CIRCLE_SIZE : iconSize;

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
      <View
        style={[
          styles.circle,
          solid && styles.solidButton,
          outline && styles.outlineButton,
          redSolid && styles.redSolidButton,
          disabled && !outline && styles.disabledCircle,
          circleStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={effectiveIconSize}
          color={iconColor}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <Text
        style={[
          styles.label,
          solid && styles.solidText,
          outline && styles.outlineText,
          redSolid && styles.redSolidText,
          disabled && styles.disabledText,
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
    minWidth: CIRCLE_SIZE,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButton: {
    backgroundColor: colors.brand,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  redSolidButton: {
    backgroundColor: colors.error,
  },
  disabledCircle: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: typography.button.fontWeight,
  },
  solidText: {
    color: colors.brand,
  },
  outlineText: {
    color: colors.brand,
  },
  redSolidText: {
    color: colors.error,
  },
  disabledText: {
    color: colors.bodyMuted,
  },
});

export function AddButton(props) {
  return <CrudButton label="Add" icon="add" variant="solid" {...props} />;
}

export function EditButton(props) {
  return (
    <CrudButton
      {...props}
      label="Edit"
      icon="create-outline"
      variant="outline"
      iconSize={40}
      circleStyle={[{ paddingLeft: 4 }, props.circleStyle]}
      textStyle={[{ marginTop: -10 }, props.textStyle]}
    />
  );
}

export function DeleteButton(props) {
  return <CrudButton label="Delete" icon="trash" variant="redSolid" {...props} />;
}
