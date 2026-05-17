//create or add, edit, delete buttons with icon and label

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';

const CIRCLE_SIZE = accessibility.minTouchTarget + spacing.xs;
const DEFAULT_ICON_SIZE = spacing.lg;
const EDIT_ICON_SIZE = moderateScale(40);
const LABEL_LIFT = moderateScale(10);

export default function CrudButton({
  label,
  icon = 'add',
  iconSize = DEFAULT_ICON_SIZE,
  iconColorOverride,
  onPress,
  variant = 'solid',
  disabled = false,
  style,
  pressedStyle,
  circleStyle,
  textStyle,
  ...pressableProps
}) {
  const solid = variant === 'solid';
  const outline = variant === 'outline';
  const redSolid = variant === 'redSolid';
  const disabledIconColor = colors.bodyMuted;
  const computedIconColor = disabled ? disabledIconColor : solid || redSolid ? colors.surface : colors.brand;
  const iconColor = iconColorOverride ?? computedIconColor;
  const effectiveIconSize = outline && iconSize === DEFAULT_ICON_SIZE ? CIRCLE_SIZE : iconSize;

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
        pressed && !disabled && pressedStyle,
        style,
      ]}
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
    maxWidth: '100%',
    flexShrink: 1,
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
    flexShrink: 1,
    textAlign: 'center',
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
  pressed: {
    backgroundColor: '#C7DBFF',
    borderRadius: spacing.xs,
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
      iconSize={props.iconSize ?? EDIT_ICON_SIZE}
      circleStyle={[{ paddingLeft: moderateScale(4) }, props.circleStyle]}
      textStyle={[{ marginTop: -LABEL_LIFT }, props.textStyle]}
    />
  );
}

export function CancelButton(props) {
  return (
    <CrudButton
      {...props}
      label="Cancel"
      icon="close-outline"
      variant="outline"
      iconSize={EDIT_ICON_SIZE}
      textStyle={[{ marginTop: -LABEL_LIFT }, props.textStyle]}
    />
  );
}

export function DeleteButton(props) {
  return <CrudButton label="Delete" icon="trash" variant="redSolid" {...props} />;
}
