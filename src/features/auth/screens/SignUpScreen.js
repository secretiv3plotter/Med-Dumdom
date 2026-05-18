import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import { useRealm } from '../../../localdb/realm/RealmContext';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, spacing } from '../../../shared/theme';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';

export default function SignUpScreen({ navigation }) {
  const realm = useRealm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleSignUpPress = async () => {
    if (!isFormComplete) {
      Alert.alert('Incomplete details', 'Please complete email and password.');
      return;
    }

    if (realm && typeof realm.unlock === 'function') {
      setIsLoading(true);
      try {
        await realm.unlock(password);
      } catch (err) {
        Alert.alert('Authentication Error', 'Failed to initialize the local encrypted database.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    navigation?.navigate?.(ROUTES.HOME);
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
            placeholder="Enter your password"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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
