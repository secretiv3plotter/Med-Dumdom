import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRealm } from '../../../localdb/realm/RealmContext';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import FirebaseSyncService from '../../../sync/FirebaseSyncService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

export default function LoadingScreen({ navigation, realm: realmProp = null }) {
  const realmFromContext = useRealm();
  const realm = realmProp ?? realmFromContext;
  const { firebase, currentUser } = useFirebase();

  useEffect(() => {
    let cancelled = false;

    async function syncThenNavigate() {
      if (firebase?.db && realm && currentUser) {
        try {
          const syncService = new FirebaseSyncService({
            firestoreDb: firebase.db,
            medRepository: new RealmMedTrackerRepository(realm),
            apptRepository: new RealmApptTrackerRepository(realm),
            medUnitRepository: new RealmMedUnitRepository(realm),
            userRepository: new RealmUserRepository(realm),
            settingsRepository: new RealmSettingsPreferenceRepository(realm),
          });
          await syncService.syncAll(currentUser.uid);
        } catch (err) {
          console.error('Loading sync failed:', err);
        }
      }

      if (!cancelled) {
        const profileRepo = realm
          ? new RealmUserRepository(realm)
          : personalProfileService;
        const profile = currentUser ? profileRepo.getProfile(currentUser.uid) : null;
        const hasProfile = Boolean(profile?.fullName?.trim());
        navigation?.reset?.(hasProfile ? ROUTES.HOME : ROUTES.PROFILE_SETUP);
      }
    }

    syncThenNavigate();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require('../../../assets/splash-icon.png')} style={styles.splashIcon} resizeMode="contain" />
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.label}>Loading your data...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  splashIcon: {
    width: 220,
    height: 60,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.bodyMuted,
  },
});
