import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, radius, spacing, typography } from '../../../shared/theme';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

export default function PatientDashboardScreen({ navigation }) {
  const patientName = navigation?.currentParams?.patientName || 'Patient';
  const patientPossessive = patientName.endsWith('s') ? `${patientName}'` : `${patientName}'s`;

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
          leftGroupStyle={styles.profileContainer}
          profileContent={
            <View style={styles.profileTitleBlock}>
              <Text style={styles.patientTitle}>{patientPossessive}</Text>
              <Text style={styles.patientProgram}>Meddumdom</Text>
            </View>
          }
          style={styles.header}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container} />

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
    gap: spacing.xxs,
  },
  profileContainer: {
    flexShrink: 1,
    maxWidth: '78%',
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
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
