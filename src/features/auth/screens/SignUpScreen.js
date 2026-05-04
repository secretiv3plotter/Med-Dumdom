import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import TabBar from '../../../shared/components/common/TabBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing } from '../../../shared/theme';

export default function SignUpScreen({ navigation }) {
  const [activeRole, setActiveRole] = useState(-1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isFormComplete = activeRole !== -1 && email.trim().length > 0 && password.trim().length > 0;

  const handleRoleSelect = (index) => {
    setActiveRole(index);
  };

  const handleSignUpPress = () => {
    if (!isFormComplete) {
      Alert.alert('Incomplete details', 'Please choose a role and complete email and password.');
      return;
    }

    if (activeRole === 0) {
      navigation?.navigate?.(ROUTES.HOME);
      return;
    }

    if (activeRole === 1) {
      navigation?.navigate?.(ROUTES.CAREGIVER_HOME);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Let's get started.</Text>
        </View>
        <View style={styles.roleSection}>
          <Text style={styles.rolePrompt}>Are you?</Text>
          <TabBar
            tabs={['Patient']}
            activeTab={activeRole === 0 ? 0 : -1}
            onTabPress={() => handleRoleSelect(0)}
          />
          <Text style={styles.orText}>or</Text>
          <TabBar
            tabs={['Caregiver']}
            activeTab={activeRole === 1 ? 0 : -1}
            onTabPress={() => handleRoleSelect(1)}
          />
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
            label="Sign Up"
            onPress={handleSignUpPress}
            disabled={!isFormComplete}
            style={styles.signUpButton}
          />
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <Pressable
            onPress={() => navigation?.navigate?.(ROUTES.LOG_IN)}
            unstable_pressDelay={0}
            style={({ pressed }) => pressed && styles.linkPressed}
          >
            <Text style={styles.loginLink}>Log In</Text>
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
  roleSection: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    gap: spacing.xxs,
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
    fontSize: 13,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: spacing.xs,
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand,
    textAlign: 'center',
  },
  linkPressed: {
    backgroundColor: '#C7DBFF',
    borderRadius: spacing.xs,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.body,
  },
  rolePrompt: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.body,
    textAlign: 'center',
  },
  orText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.body,
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.body,
    textAlign: 'center',
  },
});
