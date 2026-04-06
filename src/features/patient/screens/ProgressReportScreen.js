import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../shared/components/common/BackButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TOP_OVERLAY_HEIGHT = 100;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const REPORT_PLACEHOLDERS = [
  {
    id: 'report-1',
    title: 'Weekly Medication Adherence',
    subtitle: 'Week of Mar 10 - Mar 16, 2026',
    details: 'Placeholder report details',
    summary:
      'This placeholder report will show medication adherence trends and completion percentages for the selected week.',
  },
  {
    id: 'report-2',
    title: 'Monthly Health Overview',
    subtitle: 'March 2026',
    details: 'Placeholder report details',
    summary:
      'This placeholder report will summarize symptom logs, medication activity, and notable month-over-month changes.',
  },
  {
    id: 'report-3',
    title: 'Appointment Follow-up Report',
    subtitle: 'Last 30 days',
    details: 'Placeholder report details',
    summary:
      'This placeholder report will present completed appointments, missed sessions, and upcoming follow-up recommendations.',
  },
  {
    id: 'report-4',
    title: 'Caregiver Activity Summary',
    subtitle: 'Current cycle',
    details: 'Placeholder report details',
    summary:
      'This placeholder report will include caregiver check-ins, assistance logs, and response timelines.',
  },
];

export default function ProgressReportScreen({ navigation }) {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const selectedReport = useMemo(
    () => REPORT_PLACEHOLDERS.find((report) => report.id === selectedReportId) || null,
    [selectedReportId]
  );

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.backButtonWrap}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>
        <View style={styles.headerMiddleLeft}>
          <Text style={styles.title}>Progress Reports</Text>
          <Text style={styles.subtitle}>Tap a report placeholder to preview details.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.reportList}>
          {REPORT_PLACEHOLDERS.map((report) => (
            <ClickableCard
              key={report.id}
              size="portrait"
              variant="solid"
              onPress={() => {
                setSelectedReportId(report.id);
                setIsPopupVisible(true);
              }}
              cardStyle={styles.reportCard}
              contentStyle={styles.reportCardContent}
              leftSlot={
                <View style={styles.reportHeaderBlock}>
                  <Text style={styles.reportHeaderTitle}>{report.title}</Text>
                  <Text style={styles.reportHeaderSubtitle}>{report.subtitle}</Text>
                  <Text style={styles.reportHeaderDetails}>{report.summary}</Text>
                </View>
              }
            />
          ))}
        </View>
      </ScrollView>

      <LargePopup
        visible={isPopupVisible && Boolean(selectedReport)}
        onClose={() => setIsPopupVisible(false)}
        header={
          selectedReport ? (
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>{selectedReport.title}</Text>
              <Text style={styles.popupSubtitle}>{selectedReport.subtitle}</Text>
            </View>
          ) : null
        }
      >
        {selectedReport ? (
          <>
            <Text style={styles.popupBody}>{selectedReport.summary}</Text>
            <ActionButton label="Close" variant="outline" onPress={() => setIsPopupVisible(false)} />
          </>
        ) : null}
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="progress" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: TOP_OVERLAY_HEIGHT,
    paddingBottom: 150,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  reportList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  reportCard: {
    minHeight: 150,
  },
  reportCardContent: {
    flex: 0,
    justifyContent: 'flex-start',
  },
  reportHeaderBlock: {
    gap: spacing.xs,
    maxWidth: '95%',
  },
  reportHeaderTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  reportHeaderSubtitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  reportHeaderDetails: {
    ...typography.bodySmall,
    color: colors.body,
  },
  popupHeader: {
    gap: spacing.xxs,
  },
  popupTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  popupSubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  popupBody: {
    ...typography.body,
    color: colors.body,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  stickyTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: TOP_OVERLAY_HEIGHT,
  },
  backButtonWrap: {
    alignSelf: 'flex-start',
  },
  headerMiddleLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
