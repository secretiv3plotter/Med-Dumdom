import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRealm } from '../../../localdb/realm/RealmContext';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import FirebaseSyncService from '../../../sync/FirebaseSyncService';
import RealmMedTrackerRepository from '../../../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../../../localdb/realm/RealmMedUnitRepository';
import RealmUserRepository from '../../../localdb/realm/RealmUserRepository';
import RealmSettingsPreferenceRepository from '../../../localdb/realm/RealmSettingsPreferenceRepository';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import DialogBox from '../../../shared/components/common/DialogBox';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';

export default function LoadingScreen({ navigation, realm: realmProp = null }) {
  const realmFromContext = useRealm();
  const realm = realmProp ?? realmFromContext;
  const { firebase, currentUser } = useFirebase();
  const { setDarkModeEnabled, setColorBlindModeEnabled, setHighContrastEnabled, setHapticEnabled, setTextScale } = useTextScale();
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  const handleReactivate = async () => {
    setShowDeletedModal(false);
    try {
      await updateDoc(doc(firebase.db, 'users', currentUser.uid), {
        isDeleted: false,
        deletedAt: null,
      });
    } catch (err) {
      console.error('Reactivation failed:', err);
    }
    proceedToApp();
  };

  const handleDeclineReactivate = async () => {
    setShowDeletedModal(false);
    await signOut(firebase.auth);
  };

  const proceedToApp = () => {
    if (realm && currentUser) {
      const settingsRepo = new RealmSettingsPreferenceRepository(realm);
      const userSettings = settingsRepo.getAccessibilitySettings(currentUser.uid);
      if (userSettings) {
        setDarkModeEnabled(Boolean(userSettings.darkModeEnabled));
        setColorBlindModeEnabled(Boolean(userSettings.colorBlindModeEnabled));
        setHighContrastEnabled(Boolean(userSettings.highContrastEnabled));
        setHapticEnabled(userSettings.hapticEnabled ?? true);
        const scale = Number(userSettings.textScale ?? userSettings.textSizeLevel ?? 1.0);
        if (Number.isFinite(scale)) setTextScale(scale);
      }
    }

    const profileRepo = realm ? new RealmUserRepository(realm) : personalProfileService;
    const profile = currentUser ? profileRepo.getProfile(currentUser.uid) : null;
    const hasProfile = Boolean(profile?.fullName?.trim());
    navigation?.reset?.(hasProfile ? ROUTES.HOME : ROUTES.PROFILE_SETUP);
  };

  useEffect(() => {
    let cancelled = false;

    async function syncThenNavigate() {
      if (firebase?.db && currentUser) {
        try {
          const userDoc = await getDoc(doc(firebase.db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data()?.isDeleted) {
            if (!cancelled) setShowDeletedModal(true);
            return;
          }
        } catch (err) {
          console.error('Deleted account check failed:', err);
        }
      }

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

      if (!cancelled) proceedToApp();
    }

    syncThenNavigate();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.label}>Loading your data...</Text>
      </View>

      {showDeletedModal ? (
        <Modal transparent visible animationType="fade" accessibilityViewIsModal>
          <View style={styles.overlay}>
            <View style={styles.dialogContainer}>
              <DialogBox
                title="Account Deleted"
                message="This account has been deleted. Would you like to reactivate it?"
                actions={[
                  {
                    label: 'No',
                    accessibilityLabel: 'Do not reactivate account',
                    variant: 'outline',
                    onPress: handleDeclineReactivate,
                  },
                  {
                    label: 'Reactivate',
                    accessibilityLabel: 'Reactivate deleted account',
                    variant: 'solid',
                    onPress: handleReactivate,
                  },
                ]}
              />
            </View>
          </View>
        </Modal>
      ) : null}
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
  label: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
