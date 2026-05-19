import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, spacing } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';

export default function SignUpScreen({ navigation }) {
  const { firebase } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleSignUpPress = async () => {
    setErrorMessage('');

    if (!isFormComplete) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    if (!firebase) {
      setErrorMessage('Still connecting. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(firebase.auth, email.trim(), password);
    } catch (err) {
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : `Sign up failed (${err.code ?? 'unknown'}). Check your connection and try again.`;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Let's get started.</Text>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Email:</Text>
          <InputBar
            placeholder="Enter your email"
            accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Text style={styles.fieldLabel}>Password:</Text>
          <InputBar
            placeholder="Enter your password (min. 6 characters)"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <ActionButton
            label={isLoading ? "Creating Account..." : "Sign Up"}
            onPress={handleSignUpPress}
            disabled={!isFormComplete || isLoading}
            style={styles.signUpButton}
          />
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log in"
            onPress={() => navigation?.navigate?.(ROUTES.LOG_IN)}
            unstable_pressDelay={0}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.loginLink}>Log In</Text>
          </Pressable>
        </View>
      </ThemedScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  formSection: {
    width: '100%',
    maxWidth: 520,
    gap: spacing.xs,
  },
  signUpButton: {
    marginTop: spacing.sm,
    flex: 0,
    alignSelf: 'stretch',
  },
  loginPrompt: {
    marginTop: spacing.md,
    fontSize: getFontSize(13),
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: spacing.xs,
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: colors.brand,
    textAlign: 'center',
  },
  linkPressed: {
    backgroundColor: '#C7DBFF',
    borderRadius: spacing.xs,
  },
  fieldLabel: {
    fontSize: getFontSize(16),
    fontWeight: '500',
    color: colors.body,
  },
  errorText: {
    fontSize: getFontSize(14),
    color: colors.error,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  title: {
    fontSize: getFontSize(36),
    fontWeight: '700',
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getFontSize(20),
    fontWeight: '500',
    color: colors.body,
    textAlign: 'center',
  },
});
