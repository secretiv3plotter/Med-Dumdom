import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, spacing } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { useRealm } from '../../../localdb/realm/RealmContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';
import FirebaseSyncService from '../../../sync/FirebaseSyncService';

export default function LogInScreen({ navigation }) {
  const realm = useRealm();
  const { firebase } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleLogInPress = async () => {
    if (!isFormComplete) {
      Alert.alert('Incomplete details', 'Please complete email and password.');
      return;
    }

    if (!firebase) {
      Alert.alert('Not ready', 'Still connecting to the server. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
      const userId = userCredential.user.uid;

      try {
        const syncService = new FirebaseSyncService({
          firestoreDb: firebase.db,
          medRepository: realm ? new RealmMedTrackerRepository(realm) : null,
          apptRepository: realm ? new RealmApptTrackerRepository(realm) : null,
          medUnitRepository: realm ? new RealmMedUnitRepository(realm) : null,
          userRepository: realm ? new RealmUserRepository(realm) : null,
          settingsRepository: realm ? new RealmSettingsPreferenceRepository(realm) : null,
        });
        await syncService.syncAll(userId);
        if (realm && typeof realm.flush === 'function') {
          await realm.flush();
        }
      } catch (syncErr) {
        console.error('Sync failed, continuing offline:', syncErr);
      }

      navigation?.navigate?.(ROUTES.HOME);
    } catch (err) {
      const message =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with that email.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Sign in failed. Please check your connection and try again.';
      Alert.alert('Login Failed', message);
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
