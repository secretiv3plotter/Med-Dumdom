//text based button (currently only solid and outline variants)
import { Pressable, StyleSheet, Text } from 'react-native';
import { accessibility, colors, getFontSize, getLineHeight, radius, spacing, typography } from '../../theme';

export default function ActionButton({
  label = '',
  onPress,
  variant = 'solid',
  style,
  textStyle,
  disabled = false,
  preserveFontSize = false,
}) {
  const outline = variant === 'outline';
  const labelLength = label ? label.length : 0;
  
  // Resolve base font size safely, supporting both relative rem strings (Web) and numeric values (Mobile)
  const baseFontSize = textStyle?.fontSize || typography.button?.fontSize || 14;
  let numericBaseFontSize = 14;
  
  if (typeof baseFontSize === 'string') {
    const parsedRem = parseFloat(baseFontSize);
    numericBaseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 14;
  } else {
    numericBaseFontSize = baseFontSize;
  }
  
  let dynamicFontSize = numericBaseFontSize;
  if (labelLength > 18) {
    dynamicFontSize = Math.max(10, numericBaseFontSize * 0.9);
  }
  if (labelLength > 24) {
    dynamicFontSize = Math.max(9, numericBaseFontSize * 0.8);
  }

  // Format using platform-specific helper (rem on Web, scaled px on Mobile)
  const finalFontSize = getFontSize(dynamicFontSize);

  return (
    <Pressable
      disabled={disabled}
      unstable_pressDelay={0}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.outlineButton : styles.solidButton,
        pressed && !disabled && (outline ? styles.outlinePressed : styles.solidPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text 
        style={[
          styles.text, 
          outline ? styles.outlineText : styles.solidText, 
          textStyle,
          { fontSize: finalFontSize }
        ]} 
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: accessibility.minTouchTarget,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs, // Reduced default padding slightly to give more room for text
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButton: {
    backgroundColor: colors.brand,
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  text: {
    ...typography.button,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  solidText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.brand,
  },
  solidPressed: {
    backgroundColor: colors.brandText,
  },
  outlinePressed: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  disabled: {
    opacity: 0.6,
  },
});
