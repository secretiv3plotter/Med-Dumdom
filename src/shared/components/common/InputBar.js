// A reusable input bar component for forms, search fields, and password inputs with show/hide functionality.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { accessibility, colors, radius, spacing, typography, moderateScale } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const PASSWORD_PAIR_REGISTRY = {
  currentValue: '',
  currentOwner: null,
};

const toLabelKey = (label, placeholder) =>
  `${label || ''} ${placeholder || ''}`.trim().toLowerCase();

const isCurrentPasswordLabel = (labelKey) => labelKey.includes('current password');
const isNewPasswordLabel = (labelKey) => labelKey.includes('new password');

const DEFAULT_EMAIL_DOMAIN_CORRECTIONS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
};

const EYE_HIT_SLOP = { top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm };

const normalizeDomainValue = (domainValue) => {
  if (!domainValue) {
    return '';
  }
  const trimmed = String(domainValue).trim().toLowerCase();
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
};

const getEmailParts = (emailValue) => {
  const trimmed = String(emailValue ?? '').trim();
  const lower = trimmed.toLowerCase();
  const atIndex = lower.lastIndexOf('@');
  if (atIndex === -1) {
    return { trimmed, lower, local: lower, domain: '' };
  }
  return {
    trimmed,
    lower,
    local: lower.slice(0, atIndex),
    domain: lower.slice(atIndex + 1),
  };
};

const getEmailSuggestion = (emailValue, corrections) => {
  const { local, domain } = getEmailParts(emailValue);
  if (!local || !domain) {
    return '';
  }
  const correctedDomain = corrections?.[domain];
  if (!correctedDomain) {
    return '';
  }
  return `${local}@${correctedDomain}`;
};

const isValidEmailFormat = (emailValue) => {
  if (!emailValue) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
};

export default function InputBar({
  label,
  placeholder = 'Enter text',
  accessibilityLabel,
  accessibilityHint,
  value = '',
  onChangeText = () => {},
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength = undefined,
  autoComplete,
  onFocus = () => {},
  onBlur = () => {},
  error = false,
  errorMessage = '',
  validateEmailLowercase,
  validateEmailFormat,
  emailLowercaseMessage = 'Email must be lowercase.',
  emailFormatMessage = 'Enter a valid email address.',
  enforceEmailDomain,
  emailDomainCorrections = DEFAULT_EMAIL_DOMAIN_CORRECTIONS,
  emailDomainTypoMessage = 'Did you mean {suggestion}?',
  validatePasswordDifference,
  passwordMismatchMessage = 'New password must be different from current password.',
  showErrorIcon = true,
  reserveRightSlot,
  allowFontScaling = true,
  maxFontSizeMultiplier,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const instanceIdRef = useRef(Symbol('inputbar'));
  const shouldValidateEmailLowercase =
    typeof validateEmailLowercase === 'boolean'
      ? validateEmailLowercase
      : keyboardType === 'email-address';
  const shouldValidateEmailFormat =
    typeof validateEmailFormat === 'boolean'
      ? validateEmailFormat
      : keyboardType === 'email-address';
  const resolvedAllowedEmailDomain = normalizeDomainValue(
    enforceEmailDomain === undefined
      ? keyboardType === 'email-address'
        ? 'gmail.com'
        : ''
      : enforceEmailDomain
  );
  const normalizedValue = typeof value === 'string' ? value : String(value ?? '');
  const emailParts = getEmailParts(normalizedValue);
  const labelKey = toLabelKey(accessibilityLabel, placeholder);
  const isCurrentPasswordField = isCurrentPasswordLabel(labelKey);
  const isNewPasswordField = isNewPasswordLabel(labelKey);
  const shouldValidatePasswordDifference =
    typeof validatePasswordDifference === 'boolean'
      ? validatePasswordDifference
      : isNewPasswordField;

  if (isCurrentPasswordField) {
    PASSWORD_PAIR_REGISTRY.currentValue = normalizedValue;
    PASSWORD_PAIR_REGISTRY.currentOwner = instanceIdRef.current;
  }

  useEffect(() => {
    if (!isCurrentPasswordField) {
      return undefined;
    }

    return () => {
      if (PASSWORD_PAIR_REGISTRY.currentOwner === instanceIdRef.current) {
        PASSWORD_PAIR_REGISTRY.currentOwner = null;
        PASSWORD_PAIR_REGISTRY.currentValue = '';
      }
    };
  }, [isCurrentPasswordField]);

  const showEmailErrors = !isFocused && emailParts.trimmed;
  const emailCaseError =
    shouldValidateEmailLowercase && normalizedValue && /[A-Z]/.test(normalizedValue)
      ? emailLowercaseMessage
      : '';
  const isEmailFormatValid = isValidEmailFormat(emailParts.trimmed);
  const emailDomainMismatch =
    showEmailErrors &&
    isEmailFormatValid &&
    resolvedAllowedEmailDomain &&
    emailParts.domain &&
    emailParts.domain !== resolvedAllowedEmailDomain;
  const emailFormatError =
    shouldValidateEmailFormat && showEmailErrors && (!isEmailFormatValid || emailDomainMismatch)
      ? emailFormatMessage
      : '';
  const emailSuggestion = getEmailSuggestion(emailParts.trimmed, emailDomainCorrections);
  const emailTypoError =
    showEmailErrors && emailSuggestion
      ? emailDomainTypoMessage.replace('{suggestion}', emailSuggestion)
      : '';
  const normalizedPasswordValue = normalizedValue.trim();
  const normalizedCurrentPasswordValue = String(PASSWORD_PAIR_REGISTRY.currentValue || '').trim();
  const passwordMismatchError =
    shouldValidatePasswordDifference &&
    normalizedPasswordValue &&
    normalizedCurrentPasswordValue &&
    normalizedPasswordValue.toLowerCase() === normalizedCurrentPasswordValue.toLowerCase()
      ? passwordMismatchMessage
      : '';
  const resolvedErrorMessage =
    errorMessage ||
    emailCaseError ||
    emailTypoError ||
    emailFormatError ||
    passwordMismatchError;
  const hasError = Boolean(error || resolvedErrorMessage);
  const resolvedAccessibilityLabel = accessibilityLabel || label || placeholder;
  const resolvedReserveRightSlot =
    typeof reserveRightSlot === 'boolean' ? reserveRightSlot : false;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const accessoryContent = (
    <>
      {hasError && showErrorIcon ? (
        <Ionicons
          name="alert-circle"
          size={18}
          color={colors.error}
          style={styles.errorIcon}
        />
      ) : null}
      {secureTextEntry ? (
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          activeOpacity={0.72}
          hitSlop={EYE_HIT_SLOP}
          accessibilityRole="button"
          accessibilityState={{ selected: isPasswordVisible }}
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          style={styles.eyeButton}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={moderateScale(20)}
            color={colors.bodyMuted}
          />
        </TouchableOpacity>
      ) : null}
    </>
  );

  return (
    <View>
      {label ? (
        <Text
          style={styles.label}
          allowFontScaling={allowFontScaling}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          multiline && styles.multilineContainer,
          isFocused && !hasError && styles.containerFocused,
          hasError && styles.containerError,
        ]}
      >
        <TextInput
          placeholder={placeholder}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: !editable, invalid: hasError }}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoComplete={autoComplete}
          allowFontScaling={allowFontScaling}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          onFocus={() => {
            setIsFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur();
          }}
          style={[styles.input, multiline && styles.multilineInput]}
        />
        {resolvedReserveRightSlot ? (
          <View style={styles.rightAccessory}>{accessoryContent}</View>
        ) : (
          accessoryContent
        )}
      </View>
      {hasError && resolvedErrorMessage ? (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          allowFontScaling={allowFontScaling}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        >
          {resolvedErrorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySmall,
    color: colors.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
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
  containerError: {
    borderColor: colors.error,
    borderWidth: 2,
    paddingHorizontal: spacing.sm - 0.5, // Adjust for border width
  },
  multilineContainer: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.title,
    paddingRight: spacing.sm,
  },
  errorIcon: {
    marginRight: spacing.xs,
  },
  eyeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAccessory: {
    minWidth: accessibility.minTouchTarget,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'center',
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.error,
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
