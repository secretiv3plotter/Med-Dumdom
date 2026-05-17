import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import InputBar from '../../../shared/components/common/InputBar';
import {
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, spacing } from '../../../shared/theme';
import { useRealm } from '../../../localdb/realm/RealmContext';

export default function LogInScreen({ navigation }) {
  const realm = useRealm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleLogInPress = async () => {
    if (!isFormComplete) {
      Alert.alert('Incomplete details', 'Please complete email and password.');
      return;
    }

    if (realm && typeof realm.unlock === 'function') {
      setIsLoading(true);
      try {
        await realm.unlock(password);
      } catch (err) {
        Alert.alert('Authentication Error', 'Invalid password for the local encrypted database.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    navigation?.navigate?.(ROUTES.HOME);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
            onPress={() => navigation?.navigate?.(ROUTES.SIGN_UP)}
            unstable_pressDelay={0}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    position: 'absolute',
    top: BACK_HEADER_TOP_OFFSET,
    left: BACK_HEADER_HORIZONTAL_PADDING,
    zIndex: 20,
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
