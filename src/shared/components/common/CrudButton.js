//create or add, edit, delete buttons with icon and label

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, spacing, typography } from '../../theme';
import { scaleLayoutValue, useTextScale } from '../../theme/textScale';

const CIRCLE_SIZE = accessibility.minTouchTarget + spacing.xs;
const DEFAULT_ICON_SIZE = spacing.lg;
const EDIT_ICON_SIZE = moderateScale(40);
const LABEL_LIFT = moderateScale(10);
const HEADER_ACTION_SIZE = moderateScale(36);
const HEADER_ACTION_ICON_SIZE = moderateScale(18);
const HEADER_ACTION_LABEL_SIZE = 10;

export default function CrudButton({
  label,
  icon = 'add',
  iconSize = DEFAULT_ICON_SIZE,
  iconColorOverride,
  onPress,
  variant = 'solid',
  iconOnly = false,
  disabled = false,
  style,
  pressedStyle,
  circleStyle,
  textStyle,
  ...pressableProps
}) {
  const { darkModeEnabled } = useTextScale();
  const solid = variant === 'solid';
  const outline = variant === 'outline';
  const redSolid = variant === 'redSolid';
  const disabledIconColor = colors.bodyMuted;
  const computedIconColor = disabled ? disabledIconColor : solid || redSolid ? colors.surface : colors.brand;
  const iconColor = iconColorOverride ?? computedIconColor;
  const effectiveIconSize = outline && iconSize === DEFAULT_ICON_SIZE ? CIRCLE_SIZE : iconSize;
  const iconOnlySolidBackground = darkModeEnabled ? 'rgb(56, 189, 248)' : 'rgb(2, 132, 199)';
  const pressedBackgroundColor = darkModeEnabled ? 'rgba(148, 163, 184, 0.16)' : '#C7DBFF';
  const showLabel = !iconOnly && Boolean(label);

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
          minWidth: scaleLayoutValue(CIRCLE_SIZE),
          gap: showLabel ? scaleLayoutValue(spacing.xxs) : 0,
        },
        iconOnly && { backgroundColor: 'transparent' },
        iconOnly && styles.iconOnlyTopLayer,
        solid && !iconOnly && { backgroundColor: colors.brand },
        outline && { backgroundColor: 'transparent' },
        redSolid && !iconOnly && { backgroundColor: colors.error },
        disabled && !outline && !iconOnly && { backgroundColor: colors.brandSoft, borderColor: colors.border },
        pressed && !disabled && !iconOnly && styles.pressed,
        pressed && !disabled && !iconOnly && { backgroundColor: pressedBackgroundColor },
        pressed && !disabled && !iconOnly && pressedStyle,
        style,
      ]}
      {...pressableProps}
    >
        <View
          style={[
            styles.circle,
            {
              width: scaleLayoutValue(CIRCLE_SIZE),
              height: scaleLayoutValue(CIRCLE_SIZE),
            },
            solid && styles.solidButton,
            iconOnly && solid && { backgroundColor: iconOnlySolidBackground },
            outline && styles.outlineButton,
            redSolid && styles.redSolidButton,
            disabled && !outline && styles.disabledCircle,
            circleStyle,
        ]}
      >
        <Ionicons
          name={icon}
          size={scaleLayoutValue(effectiveIconSize)}
          color={iconColor}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      {showLabel ? (
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
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    flexShrink: 1,
    alignItems: 'center',
  },
  iconOnlyTopLayer: {
    position: 'relative',
    zIndex: 40,
    elevation: 40,
  },
  circle: {
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
  headerActionContainer: {
    minWidth: HEADER_ACTION_SIZE,
    gap: spacing.xxs || 2,
  },
  headerActionCircle: {
    width: HEADER_ACTION_SIZE,
    height: HEADER_ACTION_SIZE,
    backgroundColor: '#F1F5F9',
  },
  headerActionPressed: {
    backgroundColor: '#E2E8F0',
  },
  headerEditText: {
    color: colors.success,
    fontSize: HEADER_ACTION_LABEL_SIZE,
    fontWeight: '600',
  },
  headerDeleteText: {
    color: colors.error,
    fontSize: HEADER_ACTION_LABEL_SIZE,
    fontWeight: '600',
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
      iconSize={HEADER_ACTION_ICON_SIZE}
      iconColorOverride={colors.success}
      style={[styles.headerActionContainer, props.style]}
      circleStyle={[styles.headerActionCircle, props.circleStyle]}
      pressedStyle={styles.headerActionPressed}
      textStyle={[styles.headerEditText, props.textStyle]}
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
      textStyle={[{ marginTop: -scaleLayoutValue(LABEL_LIFT) }, props.textStyle]}
    />
  );
}

export function DeleteButton(props) {
  return (
    <CrudButton
      {...props}
      label="Delete"
      icon="trash-outline"
      variant="outline"
      iconSize={HEADER_ACTION_ICON_SIZE}
      iconColorOverride={colors.error}
      style={[styles.headerActionContainer, props.style]}
      circleStyle={[styles.headerActionCircle, props.circleStyle]}
      pressedStyle={styles.headerActionPressed}
      textStyle={[styles.headerDeleteText, props.textStyle]}
    />
  );
}
