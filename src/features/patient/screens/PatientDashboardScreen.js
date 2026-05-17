import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardHeader from '../../../shared/components/common/DashboardHeader';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import TextCard from '../../../shared/components/common/TextCard';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, getFontSize, getLineHeight, radius, spacing, typography } from '../../../shared/theme';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

export default function PatientDashboardScreen({ navigation }) {
  const patientName = navigation?.currentParams?.patientName || 'Patient';
  const patientFirstName = patientName.split(' ')[0];
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
          style={styles.header}
        />
        <Text style={styles.greetingTitle}>Hi, {patientFirstName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TextCard
          title={patientPossessive}
          body="Med+Dumdom"
          cardStyle={styles.patientTitleCard}
          titleStyle={styles.patientTitle}
          bodyStyle={styles.patientProgram}
        />
      </ScrollView>

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
  greetingTitle: {
    fontFamily: 'Helvetica',
    fontSize: getFontSize(24),
    lineHeight: getLineHeight(30),
    fontWeight: '700',
    color: colors.title,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.md,
  },
  patientTitleCard: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.border,
    borderRadius: radius.xl,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  patientTitle: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(28),
    lineHeight: getLineHeight(34),
  },
  patientProgram: {
    ...typography.title,
    color: colors.brandText,
    fontSize: getFontSize(28),
    lineHeight: getLineHeight(34),
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
