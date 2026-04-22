import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import progressReportService from '../../../domain/services/ProgressReportService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TOP_OVERLAY_HEIGHT = 100;
const CURRENT_USER_ID = 'current-user';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

const FORMAT_OPTIONS = ['json', 'csv', 'text'];

export default function ProgressReportScreen({ navigation }) {
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [selectedSection, setSelectedSection] = useState('summary');
  const [exportFormat, setExportFormat] = useState('json');
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const reportSummary = useMemo(
    () => progressReportService.getReportSummary(CURRENT_USER_ID, selectedRange),
    [selectedRange]
  );

  const rangeOptions = useMemo(() => progressReportService.getAvailableReportRanges(), []);

  const exportPreview = useMemo(
    () => progressReportService.exportReport(CURRENT_USER_ID, selectedRange, exportFormat),
    [selectedRange, exportFormat]
  );

  const openSection = (sectionKey) => {
    setSelectedSection(sectionKey);
    setIsPopupVisible(true);
  };

  const popupContent = useMemo(() => {
    if (selectedSection === 'medication') {
      return progressReportService.getMedicationReportSection(CURRENT_USER_ID, selectedRange);
    }

    if (selectedSection === 'appointment') {
      return progressReportService.getAppointmentReportSection(CURRENT_USER_ID, selectedRange);
    }

    return reportSummary;
  }, [reportSummary, selectedRange, selectedSection]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.backButtonWrap}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>
        <View style={styles.headerMiddleLeft}>
          <Text style={styles.title}>Progress Reports</Text>
          <Text style={styles.subtitle}>Switch report ranges and preview tracker summaries.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Range</Text>
          <View style={styles.optionRow}>
            {rangeOptions.map((option) => (
              <ActionButton
                key={option.key}
                label={option.label}
                variant={selectedRange === option.key ? 'solid' : 'outline'}
                onPress={() => setSelectedRange(option.key)}
                style={styles.optionButton}
              />
            ))}
          </View>
        </View>

        <ClickableCard
          size="portrait"
          variant="solid"
          onPress={() => openSection('summary')}
          cardStyle={styles.reportCard}
          contentStyle={styles.reportCardContent}
          leftSlot={
            <View style={styles.reportHeaderBlock}>
              <Text style={styles.reportHeaderTitle}>{reportSummary.title}</Text>
              <Text style={styles.reportHeaderSubtitle}>{reportSummary.subtitle}</Text>
              <Text style={styles.reportHeaderDetails}>{reportSummary.summary}</Text>
            </View>
          }
        />

        <View style={styles.metricsGrid}>
          <MetricCard label="Medication adherence" value={`${reportSummary.medicationStats.adherenceRate}%`} />
          <MetricCard
            label="Completed appointments"
            value={`${reportSummary.appointmentStats.completedAppointments}/${reportSummary.appointmentStats.totalAppointments}`}
          />
          <MetricCard label="Taken doses" value={String(reportSummary.medicationStats.totalTakenDoses)} />
          <MetricCard label="Upcoming appointments" value={String(reportSummary.appointmentStats.upcomingAppointments)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report sections</Text>
          <View style={styles.optionRow}>
            <ActionButton label="Medication" variant="outline" onPress={() => openSection('medication')} />
            <ActionButton label="Appointment" variant="outline" onPress={() => openSection('appointment')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export format</Text>
          <View style={styles.optionRow}>
            {FORMAT_OPTIONS.map((option) => (
              <ActionButton
                key={option}
                label={option.toUpperCase()}
                variant={exportFormat === option ? 'solid' : 'outline'}
                onPress={() => setExportFormat(option)}
                style={styles.optionButton}
              />
            ))}
          </View>
          <ActionButton
            label="Generate Export Preview"
            variant="solid"
            onPress={() => {
              setSelectedSection('summary');
              setIsPopupVisible(true);
            }}
          />
        </View>
      </ScrollView>

      <LargePopup
        visible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
        header={
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>
              {selectedSection === 'medication'
                ? 'Medication Section'
                : selectedSection === 'appointment'
                  ? 'Appointment Section'
                  : 'Progress Summary'}
            </Text>
            <Text style={styles.popupSubtitle}>{reportSummary.subtitle}</Text>
          </View>
        }
      >
        {selectedSection === 'medication' ? (
          <>
            <Text style={styles.popupBody}>{JSON.stringify(popupContent.stats, null, 2)}</Text>
            <Text style={styles.popupBody}>{JSON.stringify(popupContent.entries, null, 2)}</Text>
          </>
        ) : selectedSection === 'appointment' ? (
          <>
            <Text style={styles.popupBody}>{JSON.stringify(popupContent.stats, null, 2)}</Text>
            <Text style={styles.popupBody}>{JSON.stringify(popupContent.entries, null, 2)}</Text>
          </>
        ) : (
          <>
            <Text style={styles.popupBody}>{reportSummary.details}</Text>
            <Text style={styles.popupBody}>{JSON.stringify(exportPreview, null, 2)}</Text>
          </>
        )}
        <ActionButton label="Close" variant="outline" onPress={() => setIsPopupVisible(false)} />
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar selectedTab="progress" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
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
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionButton: {
    minWidth: 88,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  metricValue: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
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
    ...typography.bodySmall,
    color: colors.body,
    marginBottom: spacing.xs,
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
