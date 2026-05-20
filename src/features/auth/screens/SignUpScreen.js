import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, spacing } from '../../../shared/theme';
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
      <View style={styles.layer}>
        <View style={styles.imageWrapper}>
          <Image source={require('../../../assets/people.png')} style={styles.bottomImage} resizeMode="contain" />
        </View>
        <View style={styles.center} pointerEvents="box-none">
          <View style={[styles.formCard, {
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
          }]}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Welcome to</Text>
              <Image source={require('../../../assets/splash-icon.png')} style={styles.splashIcon} resizeMode="contain" />
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
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  layer: {
    flex: 1,
    position: 'relative',
  },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
    width: 220,
    height: 60,
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
  loginPrompt: {
    marginTop: spacing.md,
    fontSize: getFontSize(13),
    fontFamily: 'Helvetica',
    fontWeight: '700',
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  loginLink: {
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
  imageWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
});
