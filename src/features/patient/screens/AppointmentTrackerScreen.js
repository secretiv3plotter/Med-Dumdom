import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { AppointmentDetailsContent, AppointmentPreviewCard } from '../components/AppointmentTrackerComponents';
import { APPOINTMENT_EDITOR_STEPS } from '../constants/apptTrackerEditorSteps';
import { AppointmentEditorContent } from '../components/AppointmentEditorContent';
import { ConfirmationDialogModal } from '../components/MedTrackerScreenLayout';
import {
  EMPTY_APPT_FORM,
  buildApptSearchText,
  buildFormStateFromAppointment,
  formatDate,
  formatTime,
  getSortTime,
  normalizeSearchText,
  parseDateTime,
  startOfToday,
} from '../utils/apptTrackerUtils';

const CURRENT_USER_ID = 'current-user';
const FOOTER_NAV_Z_INDEX = 30;
const LIVE_STATUS_REFRESH_MS = 1000;
const RECENT_STATUS_HOLD_MS = 12 * 60 * 60 * 1000;
const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_TEXT = '#1B6B4A';
const APPOINTMENT_ACCENT_PRESSED = '#B7E4C7';

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const getResolvedStatusTime = (appointment) => {
  const statusTime = appointment.isCompleted ? appointment.completedAt : appointment.isSkipped ? appointment.skippedAt : null;
  if (!statusTime) {
    return null;
  }

  const parsed = new Date(statusTime);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isRecentlyResolved = (appointment, now = new Date()) => {
  if (!appointment?.isCompleted && !appointment?.isSkipped) {
    return false;
  }

  const resolvedAt = getResolvedStatusTime(appointment);
  if (!resolvedAt) {
    return true;
  }

  return now.getTime() - resolvedAt.getTime() < RECENT_STATUS_HOLD_MS;
};

export default function AppointmentTrackerScreen({ navigation, realm = null, trackerService = apptTrackerService }) {
  const [version, setVersion] = useState(0);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [editorStep, setEditorStep] = useState(APPOINTMENT_EDITOR_STEPS.DETAILS);
  const [formState, setFormState] = useState(EMPTY_APPT_FORM);
  const [formError, setFormError] = useState('');
  const [draftDetails, setDraftDetails] = useState(EMPTY_APPT_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [footerNavHeight, setFooterNavHeight] = useState(0);
  const [observedNow, setObservedNow] = useState(() => new Date());
  const [pendingDeleteAppointment, setPendingDeleteAppointment] = useState(null);
  const [pendingRevertAppointment, setPendingRevertAppointment] = useState(null);

  const activeApptTrackerService = useMemo(
    () => (realm ? new RealmApptTrackerRepository(realm) : trackerService),
    [realm, trackerService],
  );

  const appointments = useMemo(
    () => activeApptTrackerService.listApptEntries(CURRENT_USER_ID),
    [activeApptTrackerService, version]
  );

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.apptEntryId === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  const visibleAppointments = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    return normalizedQuery
      ? appointments.filter((appointment) => buildApptSearchText(appointment).includes(normalizedQuery))
      : appointments;
  }, [appointments, searchQuery]);

  const pendingAppointments = useMemo(() => (
    [...visibleAppointments]
      .filter((appointment) => !appointment.isCompleted && !appointment.isSkipped)
      .sort((left, right) => getSortTime(left) - getSortTime(right))
  ), [visibleAppointments]);

  const recentStatusAppointments = useMemo(() => (
    [...visibleAppointments]
      .filter((appointment) => isRecentlyResolved(appointment, observedNow))
      .sort((left, right) => {
        const leftTime = getResolvedStatusTime(left)?.getTime() || 0;
        const rightTime = getResolvedStatusTime(right)?.getTime() || 0;

        return rightTime - leftTime;
      })
  ), [visibleAppointments, observedNow]);

  const hasActiveSearch = useMemo(() => normalizeSearchText(searchQuery).length > 0, [searchQuery]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Skip updating during form editing to avoid resetting the form
      if (editorMode || isEditingDetails) return;
      setObservedNow(new Date());
    }, LIVE_STATUS_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [editorMode, isEditingDetails]);

  const refresh = () => {
    setObservedNow(new Date());
    setVersion((current) => current + 1);
  };

  const resetEditor = () => {
    setEditorMode(null);
    setEditorStep(APPOINTMENT_EDITOR_STEPS.DETAILS);
    setFormError('');
    setFormState(EMPTY_APPT_FORM);
  };

  const handleAddAppointment = () => {
    setFormError('');
    setFormState(EMPTY_APPT_FORM);
    setEditorStep(APPOINTMENT_EDITOR_STEPS.DETAILS);
    setEditorMode('create');
  };

  const goToScheduleStep = () => {
    const requiredFields = [
      formState.concern.trim(),
      formState.address.trim(),
    ];

    if (requiredFields.some((field) => !field)) {
      setFormError('Complete the required appointment details.');
      return;
    }

    setFormError('');
    setEditorStep(APPOINTMENT_EDITOR_STEPS.SCHEDULE);
  };

  const goToPreviousStep = () => {
    setFormError('');
    setEditorStep(APPOINTMENT_EDITOR_STEPS.DETAILS);
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    setDraftDetails(buildFormStateFromAppointment(selectedAppointment));
    setIsEditingDetails(true);
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    setPendingDeleteAppointment({
      apptEntryId: selectedAppointment.apptEntryId,
      concern: selectedAppointment.concern,
    });
  };

  const confirmDeleteAppointment = () => {
    if (!pendingDeleteAppointment) {
      return;
    }

    activeApptTrackerService.deleteApptEntry(CURRENT_USER_ID, pendingDeleteAppointment.apptEntryId);
    setPendingDeleteAppointment(null);
    setIsEditingDetails(false);
    setIsDetailsVisible(false);
    setSelectedAppointmentId(null);
    refresh();
  };

  const handleSaveDetails = () => {
    if (!selectedAppointment) {
      return;
    }

    activeApptTrackerService.updateApptEntry(CURRENT_USER_ID, selectedAppointment.apptEntryId, {
      concern: draftDetails.concern.trim() || selectedAppointment.concern,
      address: draftDetails.address.trim() || selectedAppointment.address,
      doctorName: draftDetails.doctorName.trim(),
      contactNumber: draftDetails.contactNumber.trim(),
      dateSched: draftDetails.dateSched.trim() || selectedAppointment.dateSched,
      timeSched: draftDetails.timeSched.trim() || selectedAppointment.timeSched,
      note: draftDetails.note.trim() || selectedAppointment.note,
    });
    setIsEditingDetails(false);
    refresh();
  };

  const handleScheduleStatusChange = (appointment, targetStatus) => {
    if (!appointment) {
      return;
    }

    if (targetStatus === 'clear') {
      setPendingRevertAppointment({
        apptEntryId: appointment.apptEntryId,
        concern: appointment.concern,
        statusLabel: appointment.isCompleted ? 'done' : 'skipped',
      });
      return;
    } else if (targetStatus === 'completed') {
      activeApptTrackerService.markApptCompleted(CURRENT_USER_ID, appointment.apptEntryId, new Date());
    } else {
      activeApptTrackerService.markApptSkipped(CURRENT_USER_ID, appointment.apptEntryId, new Date());
    }

    refresh();
  };

  const confirmRevertStatus = () => {
    if (!pendingRevertAppointment) {
      return;
    }

    const appointment = appointments.find((entry) => entry.apptEntryId === pendingRevertAppointment.apptEntryId);
    if (appointment?.isCompleted) {
      activeApptTrackerService.undoApptCompleted(CURRENT_USER_ID, pendingRevertAppointment.apptEntryId);
    } else if (appointment?.isSkipped) {
      activeApptTrackerService.undoApptSkipped(CURRENT_USER_ID, pendingRevertAppointment.apptEntryId);
    }

    setPendingRevertAppointment(null);
    refresh();
  };

  const saveAppointment = () => {
    const requiredFields = [
      formState.concern.trim(),
      formState.address.trim(),
      formState.dateSched.trim(),
      formState.timeSched.trim(),
    ];

    if (requiredFields.some((field) => !field)) {
      setFormError('Complete all required appointment fields.');
      return;
    }

    const scheduledDateTime = parseDateTime(formState.dateSched.trim(), formState.timeSched.trim());
    if (!scheduledDateTime) {
      setFormError('Select a valid appointment date and time.');
      return;
    }

    activeApptTrackerService.addApptEntry(CURRENT_USER_ID, {
      concern: formState.concern.trim(),
      address: formState.address.trim(),
      doctorName: formState.doctorName.trim(),
      contactNumber: formState.contactNumber.trim(),
      timeSched: formState.timeSched.trim(),
      dateSched: formState.dateSched.trim(),
      note: formState.note.trim(),
      isCompleted: false,
      isSkipped: false,
      completedAt: null,
      skippedAt: null,
    });

    resetEditor();
    setSelectedAppointmentId(null);
    refresh();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topHeader}>
        <View style={styles.backButtonRow}>
          <BackButton onPress={() => navigation?.navigate?.(ROUTES.HOME)} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Appointments</Text>
            <Text style={styles.subtitle}>Manage all your appointments and meetings in one place.</Text>
          </View>
          <AddButton
            onPress={handleAddAppointment}
            circleStyle={styles.appointmentAddCircle}
            textStyle={styles.appointmentAddText}
            pressedStyle={styles.appointmentAddPressed}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: footerNavHeight + spacing.lg }]}>
        <View style={styles.searchWrap}>
          <InputBar
            placeholder="Search appointments"
            accessibilityLabel="Search appointments"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoComplete="off"
          />
        </View>
        <View style={styles.listSection}>
          {pendingAppointments.length ? (
            <>
              <Text style={styles.sectionTitle}>Pending appointments</Text>
              {pendingAppointments.map((appointment) => (
                <AppointmentPreviewCard
                  key={appointment.apptEntryId}
                  appointment={appointment}
                  observedNow={observedNow}
                  onOpen={() => {
                    setSelectedAppointmentId(appointment.apptEntryId);
                    setDraftDetails(buildFormStateFromAppointment(appointment));
                    setIsDetailsVisible(true);
                  }}
                  onStatusChange={handleScheduleStatusChange}
                />
              ))}
            </>
          ) : null}

          {recentStatusAppointments.length ? (
            <>
              <Text style={styles.sectionTitle}>Recently marked</Text>
              {recentStatusAppointments.map((appointment) => (
              <AppointmentPreviewCard
                key={appointment.apptEntryId}
                appointment={appointment}
                observedNow={observedNow}
                onOpen={() => {
                  setSelectedAppointmentId(appointment.apptEntryId);
                  setDraftDetails(buildFormStateFromAppointment(appointment));
                  setIsDetailsVisible(true);
                }}
                onStatusChange={handleScheduleStatusChange}
                muted
              />
              ))}
            </>
          ) : null}

          {!pendingAppointments.length && !recentStatusAppointments.length && hasActiveSearch ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No appointments found.</Text>
              <Text style={styles.emptyText}>Try another concern, doctor, date, place, or status.</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Review previous records"
            unstable_pressDelay={0}
            onPress={() => navigation?.navigate?.(ROUTES.APPOINTMENT_TRACKER_HISTORY)}
            style={({ pressed }) => [styles.historyBar, pressed && styles.pressedControl]}
          >
            <Text style={styles.historyBarText}>Review previous records</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LargePopup
        visible={isDetailsVisible && Boolean(selectedAppointment)}
        onClose={() => {
          setIsEditingDetails(false);
          setIsDetailsVisible(false);
        }}
        header={
          selectedAppointment ? (
            <View style={styles.detailsHeaderRow}>
              <View style={styles.detailsHeaderTextBlock}>
                <Text style={styles.detailsTitle}>Appointment Details</Text>
                <Text style={styles.detailsAppointmentName}>{selectedAppointment.concern}</Text>
              </View>
              <View style={styles.detailActionsTop}>
                <EditButton onPress={handleEditAppointment} />
                <DeleteButton onPress={handleDeleteAppointment} />
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
        sheetStyle={styles.appointmentModalSheet}
        headerStyle={styles.appointmentModalHeader}
      >
        {selectedAppointment ? (
          <>
            <EditableDetailItem
              label="Concern"
              value={isEditingDetails ? draftDetails.concern : selectedAppointment.concern}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, concern: text }))}
            />
            <EditableDetailItem
              label="Address"
              value={isEditingDetails ? draftDetails.address : selectedAppointment.address}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, address: text }))}
            />
            <EditableDetailItem
              label="Doctor name"
              value={isEditingDetails ? draftDetails.doctorName : selectedAppointment.doctorName || '--'}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, doctorName: text }))}
            />
            <EditableDetailItem
              label="Contact number"
              value={isEditingDetails ? draftDetails.contactNumber : selectedAppointment.contactNumber || '--'}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, contactNumber: text }))}
            />
            <EditableDetailItem
              label="Date scheduled"
              value={isEditingDetails ? draftDetails.dateSched : formatDate(selectedAppointment.dateSched)}
              editable={isEditingDetails}
              mode="date"
              minimumDate={startOfToday()}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, dateSched: text }))}
            />
            <EditableDetailItem
              label="Time scheduled"
              value={isEditingDetails ? draftDetails.timeSched : formatTime(selectedAppointment.timeSched)}
              editable={isEditingDetails}
              mode="time"
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, timeSched: text }))}
            />
            <EditableDetailItem
              label="Note"
              value={isEditingDetails ? draftDetails.note : selectedAppointment.note || '--'}
              editable={isEditingDetails}
              multiline
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, note: text }))}
            />

            {!isEditingDetails ? (
              <AppointmentDetailsContent
                appointment={selectedAppointment}
                observedNow={observedNow}
                onStatusChange={handleScheduleStatusChange}
                muted={selectedAppointment.isCompleted || selectedAppointment.isSkipped}
              />
            ) : null}

            <View style={styles.footerActionsRow}>
              {isEditingDetails ? (
                <>
                  <ActionButton label="Cancel" variant="outline" onPress={() => setIsEditingDetails(false)} />
                  <ActionButton label="Save" variant="solid" onPress={handleSaveDetails} />
                </>
              ) : (
                <ActionButton
                  label="Close"
                  variant="outline"
                  onPress={() => {
                    setIsEditingDetails(false);
                    setIsDetailsVisible(false);
                  }}
                />
              )}
            </View>
          </>
        ) : null}
      </LargePopup>

      <LargePopup
        visible={editorMode === 'create'}
        onClose={() => resetEditor()}
        header={
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>Add Appointment</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.modalContent}
        sheetStyle={styles.appointmentModalSheet}
        headerStyle={styles.appointmentModalHeader}
      >
        <AppointmentEditorContent
          editorStep={editorStep}
          formState={formState}
          setFormState={setFormState}
          formError={formError}
          onCancel={() => resetEditor()}
          onPreviousStep={goToPreviousStep}
          onNextStep={goToScheduleStep}
          onSaveAppointment={saveAppointment}
        />
      </LargePopup>

      {pendingDeleteAppointment ? (
        <ConfirmationDialogModal
          visible={true}
          title="Delete appointment?"
          message={`Are you sure you want to delete ${pendingDeleteAppointment?.concern || 'this appointment'} from your tracker?`}
          confirmLabel="Delete"
          onCancel={() => setPendingDeleteAppointment(null)}
          onConfirm={confirmDeleteAppointment}
        />
      ) : null}

      {pendingRevertAppointment ? (
        <ConfirmationDialogModal
          visible={true}
          title="Revert status?"
          message={`Revert the status of ${pendingRevertAppointment?.concern || 'this appointment'} back to pending?`}
          confirmLabel="Revert"
          onCancel={() => setPendingRevertAppointment(null)}
          onConfirm={confirmRevertStatus}
        />
      ) : null}

      <View
        style={styles.footerNav}
        onLayout={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          setFooterNavHeight((currentHeight) => (
            currentHeight === nextHeight ? currentHeight : nextHeight
          ));
        }}
      >
        <NavigationBar selectedTab="appointment" showPressAlert={false} onNavigate={onTabNavigate} />
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditableDetailItem({ label, value, editable, onChangeText, mode = null, minimumDate = null, multiline = false }) {
  if (!editable) {
    return <DetailItem label={label} value={value} />;
  }

  if (mode === 'date' || mode === 'time') {
    return (
      <View style={styles.detailRow}>
        <NativeDateTimeField
          label={label}
          value={value}
          mode={mode}
          onChange={onChangeText}
          accessibilityLabel={label}
          minimumDate={minimumDate}
        />
      </View>
    );
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <InputBar
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  backButtonRow: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  searchWrap: {
    marginBottom: 0,
  },
  listSection: {
    marginTop: 0,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  appointmentCard: {
    minHeight: 86,
  },
  selectedAppointmentCard: {
    borderColor: APPOINTMENT_ACCENT,
    borderWidth: 2,
  },
  appointmentCardContent: {
    flex: 0,
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  historyBar: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: APPOINTMENT_ACCENT,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  historyBarText: {
    ...typography.body,
    color: APPOINTMENT_ACCENT_TEXT,
    fontWeight: '700',
  },
  pressedControl: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  appointmentAddCircle: {
    backgroundColor: APPOINTMENT_ACCENT,
  },
  appointmentAddText: {
    color: APPOINTMENT_ACCENT_TEXT,
  },
  appointmentAddPressed: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
  },
  cardHeaderName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
  },
  cardHeaderBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
    paddingRight: spacing.sm,
  },
  cardHeaderMeta: {
    ...typography.bodySmall,
    color: colors.body,
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  appointmentModalSheet: {
    backgroundColor: '#E5E7EB',
  },
  appointmentModalHeader: {
    backgroundColor: '#E5E7EB',
    borderBottomColor: '#9CA3AF',
  },
  detailsTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.title,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    minHeight: 5,
  },
  detailsHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  detailsAppointmentName: {
    ...typography.body,
    color: colors.body,
    fontWeight: '600',
  },
  detailRow: {
    gap: spacing.xxs,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  detailValue: {
    ...typography.body,
    color: colors.body,
  },
  toggleRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailActionsTop: {
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minWidth: 100,
  },
  stepTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  formColumn: {
    gap: spacing.sm,
  },
  scheduleBuilder: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
    marginTop: spacing.sm,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.title,
    fontWeight: '700',
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: FOOTER_NAV_Z_INDEX,
  },
  topHeader: {
    backgroundColor: colors.pageBg,
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: BACK_HEADER_BOTTOM_PADDING,
    gap: spacing.xxs,
  },
});
