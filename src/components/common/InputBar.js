import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, accessibility } from '../../constants/Themes';
import { Ionicons } from '@expo/vector-icons';

export default function InputBar({
  placeholder = 'Enter text',
  accessibilityLabel,
  value = '',
  onChangeText = () => {},
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength = undefined,
  onFocus = () => {},
  onBlur = () => {},
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <TextInput
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel || placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        onFocus={() => {
          setIsFocused(true);
          onFocus();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
        style={styles.input}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityState={{ selected: isPasswordVisible }}
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={20}
            color={colors.bodyMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: accessibility.minTouchTarget,
  },
  containerFocused: {
    borderColor: colors.focusRing,
    borderWidth: 2,
    paddingHorizontal: spacing.sm - 0.5, // Adjust for border width
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.title,
    paddingRight: spacing.sm,
  },
});
