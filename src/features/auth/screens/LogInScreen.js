import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { colors, getFontSize, spacing } from '../../../shared/theme';
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
      <View style={styles.layer}>
      <View style={styles.column} pointerEvents="box-none">
        <View style={styles.iconSection} pointerEvents="none">
          <Image source={require('../../../assets/splash-icon.png')} style={styles.splashIcon} resizeMode="contain" accessible={false} importantForAccessibility="no-hide-descendants" />
        </View>
        <View style={[styles.formCard, {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
        }]}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Log in to continue.</Text>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel} accessible={false} importantForAccessibility="no">Email:</Text>
            <InputBar
              placeholder="Enter your email"
              accessibilityLabel="Email address"
              accessibilityHint="Enter the email address associated with your account"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Text style={styles.fieldLabel} accessible={false} importantForAccessibility="no">Password:</Text>
            <InputBar
              placeholder="Enter your password"
              accessibilityLabel="Password"
              accessibilityHint="Enter your account password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {errorMessage ? (
              <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">{errorMessage}</Text>
            ) : null}
            <ActionButton
              label={isLoading ? "Logging in..." : "Log In"}
              onPress={handleLogInPress}
              disabled={!isFormComplete || isLoading}
              style={styles.logInButton}
            />
            <Text style={styles.signupPrompt} accessible={false} importantForAccessibility="no">Don't have an account?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign up for a new account"
              onPress={() => navigation?.navigate?.(ROUTES.SIGN_UP)}
              unstable_pressDelay={0}
              style={({ pressed }) => pressed && styles.linkPressed}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.bottomSpacer} pointerEvents="none" />
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  layer: {
    flex: 1,
    position: 'relative',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    flex: 1,
  },
  formCard: {
    width: '105%',
    maxWidth: 530,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  splashIcon: {
    width: '50%',
    height: 42,
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
    fontFamily: 'Helvetica',
    color: colors.body,
  },
  errorText: {
    fontSize: getFontSize(14),
    color: colors.error,
    fontWeight: '500',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  signupPrompt: {
    marginTop: spacing.md,
    fontSize: getFontSize(13),
    fontFamily: 'Helvetica',
    fontWeight: '700',
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  signupLink: {
    marginTop: spacing.xs,
    fontSize: getFontSize(15),
    fontWeight: '600',
    fontFamily: 'Helvetica',
    color: colors.brand,
    textAlign: 'center',
  },
  linkPressed: {
    opacity: 0.5,
  },
  title: {
    fontSize: getFontSize(36),
    fontWeight: '700',
    fontFamily: 'Helvetica',
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getFontSize(20),
    fontWeight: '500',
    fontFamily: 'Helvetica',
    color: colors.body,
    textAlign: 'center',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
});
