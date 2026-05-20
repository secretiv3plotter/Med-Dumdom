import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import InputBar from '../../../shared/components/common/InputBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { useRealm } from '../../../localdb/realm/RealmContext';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, radius, spacing, typography } from '../../../shared/theme';

export default function ProfileSetupScreen({ navigation, realm: realmProp = null }) {
  const realmFromContext = useRealm();
  const realm = realmProp ?? realmFromContext;
  const { currentUser } = useFirebase();

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const profileRepository = realm
    ? new RealmUserRepository(realm)
    : personalProfileService;

  const handleContinue = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your full name to continue.');
      return;
    }
    if (trimmedName.length < 2) {
      Alert.alert('Name too short', 'Name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      profileRepository.saveProfile(currentUser.uid, {
        fullName: trimmedName,
        birthDate: birthDate || null,
        address: address.trim(),
        profilePicture: '',
      });
    } catch (err) {
      console.error('Profile setup save failed:', err);
    } finally {
      setIsSaving(false);
    }

    navigation?.reset?.(ROUTES.HOME);
  };

  const handleSkip = () => {
    navigation?.reset?.(ROUTES.HOME);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself. You can always update this later.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Full name <Text style={styles.required}>*</Text></Text>
          <InputBar
            placeholder="e.g. Maria Santos"
            accessibilityLabel="Full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.fieldLabel}>Birth date <Text style={styles.optional}>(optional)</Text></Text>
          <NativeDateTimeField
            placeholder="Select your birth date"
            accessibilityLabel="Birth date"
            value={birthDate}
            onChange={setBirthDate}
            mode="date"
            optional
            maximumDate={new Date()}
          />

          <Text style={styles.fieldLabel}>Address <Text style={styles.optional}>(optional)</Text></Text>
          <InputBar
            placeholder="e.g. Quezon City, Metro Manila"
            accessibilityLabel="Address"
            value={address}
            onChangeText={setAddress}
          />

          <ActionButton
            label={isSaving ? 'Saving...' : 'Continue'}
            onPress={handleContinue}
            disabled={isSaving}
            style={styles.continueButton}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip profile setup"
            onPress={handleSkip}
            unstable_pressDelay={0}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
          >
            <Text style={styles.skipText}>Skip for now</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: getFontSize(30),
    fontWeight: '700',
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: getFontSize(16),
    fontWeight: '500',
    color: colors.body,
    marginTop: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  optional: {
    color: colors.bodyMuted,
    fontWeight: '400',
    fontSize: getFontSize(13),
  },
  continueButton: {
    marginTop: spacing.md,
    flex: 0,
    alignSelf: 'stretch',
  },
  skipButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    marginTop: spacing.xs,
  },
  skipButtonPressed: {
    backgroundColor: '#C7DBFF',
  },
  skipText: {
    fontSize: getFontSize(15),
    fontWeight: '500',
    color: colors.bodyMuted,
    textAlign: 'center',
  },
});
