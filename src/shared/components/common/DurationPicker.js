import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, moderateScale, radius, spacing, typography } from '../../theme';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function DurationUnit({ label, value, min, max, maxLength, onChange, disabled, padValue = false }) {
  const decrease = () => onChange(clamp(value - 1, min, max));
  const increase = () => onChange(clamp(value + 1, min, max));
  const displayValue = padValue ? String(value).padStart(maxLength, '0') : String(value);

  const onInputChange = (input) => {
    const sanitized = input.replace(/[^0-9]/g, '');
    if (!sanitized) {
      onChange(min);
      return;
    }
    const numeric = Number.parseInt(sanitized, 10);
    if (Number.isNaN(numeric)) {
      return;
    }
    onChange(clamp(numeric, min, max));
  };

  return (
    <View style={styles.unitCell}>
      <Text style={styles.unitLabel}>{label}</Text>
      <View style={styles.controlRow}>
        <Pressable
          disabled={disabled}
          unstable_pressDelay={0}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={decrease}
          style={({ pressed }) => [
            styles.stepBtn,
            disabled ? styles.stepBtnDisabled : styles.stepBtnActive,
            pressed && !disabled && styles.stepBtnPressed,
          ]}
        >
          <Text style={[styles.stepBtnText, disabled ? styles.stepBtnTextDisabled : styles.stepBtnTextActive]}>-</Text>
        </Pressable>
        <TextInput
          value={displayValue}
          onChangeText={onInputChange}
          editable={!disabled}
          keyboardType="number-pad"
          accessibilityLabel={`${label} value`}
          style={styles.input}
          maxLength={maxLength}
        />
        <Pressable
          disabled={disabled}
          unstable_pressDelay={0}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={increase}
          style={({ pressed }) => [
            styles.stepBtn,
            disabled ? styles.stepBtnDisabled : styles.stepBtnActive,
            pressed && !disabled && styles.stepBtnPressed,
          ]}
        >
          <Text style={[styles.stepBtnText, disabled ? styles.stepBtnTextDisabled : styles.stepBtnTextActive]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DurationPicker({ units = [], disabled = false }) {
  return (
    <View style={[styles.card, disabled && styles.cardDisabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.unitsColumn}>
        {units.map((unit, index) => (
          <View key={unit.key} style={styles.unitWrap}>
            <DurationUnit
              label={unit.label}
              value={unit.value}
              min={unit.min}
              max={unit.max}
              maxLength={unit.maxLength || 2}
              padValue={unit.padValue}
              disabled={disabled}
              onChange={(nextValue) => unit.onChange(nextValue)}
            />
            {index < units.length - 1 ? <View style={styles.unitDivider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
  },
  cardDisabled: {
    opacity: 0.45,
  },
  unitsColumn: {
    gap: spacing.sm,
  },
  unitWrap: {
    gap: spacing.sm,
  },
  unitCell: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  unitDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.55,
  },
  unitLabel: {
    ...typography.body,
    color: colors.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  stepBtnDisabled: {
    backgroundColor: colors.pageBg,
    borderColor: colors.border,
  },
  stepBtnPressed: {
    backgroundColor: colors.brandText,
    borderColor: colors.brandText,
  },
  stepBtnText: {
    ...typography.subtitle,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepBtnTextActive: {
    color: colors.surface,
  },
  stepBtnTextDisabled: {
    color: colors.bodyMuted,
  },
  input: {
    minWidth: moderateScale(72),
    height: moderateScale(52),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.title,
    ...typography.subtitle,
    lineHeight: typography.subtitle.fontSize,
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
    includeFontPadding: false,
    outlineStyle: 'none',
  },
});
