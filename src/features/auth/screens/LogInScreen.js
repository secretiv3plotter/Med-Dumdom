import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { colors, getFontSize, getLineHeight, spacing } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { ROUTES } from '../../../app/navigation/routes';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';

export default function LogInScreen({ navigation }) {
  const { firebase } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleLogInPress = async () => {
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
      await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
    } catch (err) {
      const message =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with that email.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : `Sign in failed (${err.code ?? 'unknown'}). Check your connection and try again.`;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Log in to continue.</Text>
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
            placeholder="Enter your password"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          <ActionButton
            label={isLoading ? "Unlocking..." : "Log In"}
            onPress={handleLogInPress}
            disabled={!isFormComplete || isLoading}
            style={styles.logInButton}
          />
          <Text style={styles.signupPrompt}>Don't have an account?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign up"
            onPress={() => navigation?.navigate?.(ROUTES.SIGN_UP)}
            unstable_pressDelay={0}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.signupLink}>Sign Up</Text>
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
  titleBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  formSection: {
    width: '100%',
    maxWidth: 520,
    gap: spacing.xs,
  },
  logInButton: {
    marginTop: spacing.sm,
    flex: 0,
    alignSelf: 'stretch',
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
  signupPrompt: {
    marginTop: spacing.md,
    fontSize: getFontSize(13),
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  signupLink: {
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
