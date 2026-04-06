import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accessibility, colors, radius, spacing, typography } from '../../theme';

export default function BackButton({
  onPress = () => {},
  label = 'Back',
  showLabel = true,
  disabled = false,
  style,
  iconStyle,
  labelStyle,
}) {
  const insets = useSafeAreaInsets();
  const buttonRef = useRef(null);
  const translateYRef = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  const alignToSafeTop = useCallback(() => {
    if (!buttonRef.current?.measureInWindow) {
      return;
    }

    buttonRef.current.measureInWindow((_x, y) => {
      const targetTop = insets.top - 12;
      const nextTranslate = translateYRef.current + (targetTop - y);
      if (!Number.isFinite(nextTranslate)) {
        return;
      }
      if (Math.abs(nextTranslate - translateYRef.current) < 0.5) {
        return;
      }
      translateYRef.current = nextTranslate;
      setTranslateY(nextTranslate);
    });
  }, [insets.top]);

  useEffect(() => {
    const frame = requestAnimationFrame(alignToSafeTop);
    return () => cancelAnimationFrame(frame);
  }, [alignToSafeTop]);

  return (
    <Pressable
      ref={buttonRef}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onLayout={alignToSafeTop}
      style={({ pressed }) => [
        styles.button,
        translateY !== 0 && { transform: [{ translateY }] },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, iconStyle]}>{'\u2039'}</Text>
        {showLabel && (
          <View style={styles.labelWrap}>
            <Text
              style={[styles.label, labelStyle]}
              onPress={disabled ? undefined : onPress}
              suppressHighlighting
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const ICON_SIZE = 48;

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  icon: {
    color: colors.brandText,
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
  },
  labelWrap: {
    height: ICON_SIZE,
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    color: colors.brandText,
    marginLeft: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
