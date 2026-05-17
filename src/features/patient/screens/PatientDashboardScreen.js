import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, radius, spacing, typography } from '../../../shared/theme';
import personalProfileService from '../../../domain/services/PersonalProfileService';
import accessibilitySettingsService from '../../../domain/services/AccessibilitySettingsService';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

export default function PatientDashboardScreen({ navigation }) {
  const CURRENT_USER_ID = 'current-user';
  const patientName = navigation?.currentParams?.patientName || 'Patient';
  const patientPossessive = patientName.endsWith('s') ? `${patientName}'` : `${patientName}'s`;
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [textSizeLevel, setTextSizeLevel] = useState(1);

  const refreshProfilePicture = () => {
    const profile = personalProfileService.getProfile(CURRENT_USER_ID);
    setProfilePictureUrl(profile?.profilePicture?.trim?.() || '');
  };

  const refreshAccessibilitySettings = () => {
    const settings = accessibilitySettingsService.getAccessibilitySettings(CURRENT_USER_ID);
    const nextTextSizeLevel = Number(settings?.textSizeLevel);
    setTextSizeLevel(Number.isNaN(nextTextSizeLevel) ? 1 : nextTextSizeLevel);
  };

  useEffect(() => {
    refreshProfilePicture();
    refreshAccessibilitySettings();

    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      refreshProfilePicture();
      refreshAccessibilitySettings();
    });

    return () => {
      if (typeof unsubscribeFocus === 'function') {
        unsubscribeFocus();
      }
    };
  }, [navigation]);

  const shouldSplitProgramName = textSizeLevel > 1;

  const profileImageSource = useMemo(
    () => (profilePictureUrl ? { uri: profilePictureUrl } : null),
    [profilePictureUrl]
  );

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topSection}>
        <DashboardHeader
          onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT, { returnTo: ROUTES.HOME })}
          onSettingsPress={() => navigation?.navigate?.(ROUTES.SETTINGS, { returnTo: ROUTES.HOME })}
          onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE, { returnTo: ROUTES.HOME })}
          profileImageSource={profileImageSource}
          leftGroupStyle={styles.profileContainer}
          profileContent={
            <View style={styles.profileTitleBlock}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.patientTitle}>
                {patientPossessive}
              </Text>
              <Text style={styles.patientProgram}>
                {shouldSplitProgramName ? 'Med\ndumdom' : 'Meddumdom'}
              </Text>
            </View>
          }
          style={styles.header}
        />
      </View>

      <ThemedScrollView contentContainerStyle={styles.container} />

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="home" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.pageBg,
    gap: spacing.xs,
  },
  header: {
    borderBottomWidth: 0,
  },
  profileTitleBlock: {
    flexShrink: 1,
    flex: 1,
    gap: spacing.xxs,
  },
  profileContainer: {
    flex: 1,
    flexShrink: 1,
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 158,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    gap: spacing.sm,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.md,
  },
  patientTitle: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(24),
  },
  patientProgram: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(24),
    width: '100%',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
