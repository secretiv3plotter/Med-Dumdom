import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import ClickableCard from '../components/common/ClickableCard';
import DashboardHeader from '../components/common/DashboardHeader';
import NavigationBar from '../components/common/NavigationBar';
import TextCard from '../components/common/TextCard';
import { ROUTES } from '../constants/routes';
import { colors, radius, spacing, typography } from '../constants/Themes';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

export default function PatientSpecificDashboard({ navigation }) {
  const selectedPatientName = navigation?.currentParams?.patientName || 'Patient';
  const selectedPatientFirstName = selectedPatientName.split(' ')[0];
  const patientPossessive = selectedPatientName.endsWith('s')
    ? `${selectedPatientName}'`
    : `${selectedPatientName}'s`;

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topSection}>
        <BackButton onPress={() => navigation?.goBack?.()} disabled={!navigation?.canGoBack} />
        <DashboardHeader
          firstName={selectedPatientFirstName}
          onHelpPress={() => navigation?.navigate?.(ROUTES.HELP_AND_SUPPORT)}
          onProfilePress={() => navigation?.navigate?.(ROUTES.PROFILE)}
          style={styles.header}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <TextCard
          title={patientPossessive}
          body="Med+Dumdum"
          cardStyle={styles.patientTitleCard}
          titleStyle={styles.patientTitle}
          bodyStyle={styles.patientProgram}
        />

        <ClickableCard
          size="landscape"
          title="Progress Report"
          subtitle="View progress report and history"
          onPress={() => navigation?.navigate?.(ROUTES.PROGRESS_REPORT, { patientName: selectedPatientName })}
          cardStyle={[styles.actionCard, styles.progressCardSize]}
          titleStyle={styles.actionCardTitle}
          subtitleStyle={styles.actionCardSubtitle}
        />

        <View style={styles.bottomGrid}>
          <ClickableCard
            title="Medication Tracker"
            subtitle="Track your medication"
            onPress={() => navigation?.navigate?.(ROUTES.MED_TRACKER, { patientName: selectedPatientName })}
            cardStyle={[styles.actionCard, styles.bottomCardSize]}
            titleStyle={styles.actionCardTitle}
            subtitleStyle={styles.actionCardSubtitle}
          />
          <ClickableCard
            title="Consultations"
            subtitle="Schedule consultations"
            onPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER, { patientName: selectedPatientName })}
            cardStyle={[styles.actionCard, styles.bottomCardSize]}
            titleStyle={styles.actionCardTitle}
            subtitleStyle={styles.actionCardSubtitle}
          />
        </View>
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
    backgroundColor: '#ECEFF4',
  },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: '#ECEFF4',
    gap: spacing.xs,
  },
  header: {
    borderBottomWidth: 0,
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
    fontSize: 28,
    lineHeight: 34,
  },
  patientProgram: {
    ...typography.title,
    color: colors.brandText,
    fontSize: 28,
    lineHeight: 34,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.brandText,
    borderRadius: radius.lg,
  },
  progressCardSize: {
    minHeight: 142,
  },
  actionCardTitle: {
    color: colors.brandText,
    ...typography.title,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    color: colors.title,
    ...typography.subtitle,
    fontWeight: '400',
  },
  bottomGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomCardSize: {
    flex: 1,
    minHeight: 210,
  },
  card: {
    marginTop: spacing.sm,
  },
  cardTitle: {
    color: colors.title,
  },
  cardSubtitle: {
    color: colors.body,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
