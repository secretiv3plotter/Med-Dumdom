import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { AddButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import useScrollAwareFooterNav from '../../../shared/components/common/useScrollAwareFooterNav';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import RealmApptTrackerRepository from '../../../localdb/realm/RealmApptTrackerRepository';
import { useFirebase } from '../../../localdb/firebase/FirebaseAuthContext';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, moderateScale, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';
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

const FOOTER_NAV_Z_INDEX = 30;
const LIVE_STATUS_REFRESH_MS = 1000;
const RECENT_STATUS_HOLD_MS = 12 * 60 * 60 * 1000;
const APPOINTMENT_ACCENT = '#52B788';
const APPOINTMENT_ACCENT_TEXT = '#52B788';
const APPOINTMENT_ACCENT_PRESSED = '#B7E4C7';
const APPOINTMENT_ADD_CIRCLE_BG = '#52B788';

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
  const { currentUser } = useFirebase();
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
  const { textScale } = useTextScale();
  const pinHeader = textScale < 1.5;
  const footerNav = useScrollAwareFooterNav();

  const activeApptTrackerService = useMemo(
    () => (realm ? new RealmApptTrackerRepository(realm) : trackerService),
    [realm, trackerService],
  );

  const appointments = useMemo(
    () => activeApptTrackerService.listApptEntries(currentUser.uid),
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
    if (navigation?.currentParams?.autoOpenCreate) {
      handleAddAppointment();
    }
  }, []);

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

  const headerBlock = (
    <View style={styles.headerRow}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>Manage all your appointments and meetings in one place.</Text>
      </View>
      <View style={styles.addButtonWrap}>
        <AddButton
          onPress={handleAddAppointment}
          iconOnly
          circleStyle={styles.appointmentAddCircle}
          textStyle={styles.appointmentAddText}
          pressedStyle={styles.appointmentAddPressed}
        />
        <Text style={styles.addButtonLabel}>Add</Text>
      </View>
    </View>
  );

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

    activeApptTrackerService.deleteApptEntry(currentUser.uid, pendingDeleteAppointment.apptEntryId);
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

    activeApptTrackerService.updateApptEntry(currentUser.uid, selectedAppointment.apptEntryId, {
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
      activeApptTrackerService.markApptCompleted(currentUser.uid, appointment.apptEntryId, new Date());
    } else {
      activeApptTrackerService.markApptSkipped(currentUser.uid, appointment.apptEntryId, new Date());
    }

    refresh();
  };

  const confirmRevertStatus = () => {
    if (!pendingRevertAppointment) {
      return;
    }

    const appointment = appointments.find((entry) => entry.apptEntryId === pendingRevertAppointment.apptEntryId);
    if (appointment?.isCompleted) {
      activeApptTrackerService.undoApptCompleted(currentUser.uid, pendingRevertAppointment.apptEntryId);
    } else if (appointment?.isSkipped) {
      activeApptTrackerService.undoApptSkipped(currentUser.uid, pendingRevertAppointment.apptEntryId);
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

    activeApptTrackerService.addApptEntry(currentUser.uid, {
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
      <View style={[styles.topHeader, { backgroundColor: colors.pageBg }]}>
        <View style={styles.backButtonRow}>
          <BackButton onPress={() => navigation?.navigate?.(ROUTES.HOME)} />
        </View>
        {pinHeader ? headerBlock : null}
      </View>

      <ThemedScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footerNavHeight + spacing.lg }]}
        onLayout={footerNav.onLayout}
        onContentSizeChange={footerNav.onContentSizeChange}
        onScroll={footerNav.onScroll}
      >
        {!pinHeader ? <View style={styles.headerBlock}>{headerBlock}</View> : null}
        <View style={styles.searchWrap}>
          <InputBar
            placeholder="Search appointments"
            accessibilityLabel="Search appointments"
            value={searchQuery}
            onChangeText={setSearchQuery}
            showSearchIcon
            autoComplete="off"
            focusBorderColor={APPOINTMENT_ACCENT}
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

          {!pendingAppointments.length && !recentStatusAppointments.length && !hasActiveSearch ? (
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel="No appointments yet. Tap the Add button at the top to add your first appointment."
              style={styles.emptyCard}
            >
              <Text style={styles.emptyTitle}>No appointments yet.</Text>
              <Text style={styles.emptyText}>Tap the <Text style={styles.emptyTextBold}>Add</Text> button at the top to add your first appointment.</Text>
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
      </ThemedScrollView>

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
              {!isEditingDetails ? (
                <View style={styles.detailActionsTop}>
                  <SmallHeaderAction
                    label="Edit"
                    icon="create-outline"
                    color={APPOINTMENT_ACCENT}
                    onPress={handleEditAppointment}
                  />
                  <SmallHeaderAction
                    label="Delete"
                    icon="trash-outline"
                    color={colors.error || '#D32F2F'}
                    onPress={handleDeleteAppointment}
                  />
                </View>
              ) : null}
            </View>
          ) : null
        }
        contentContainerStyle={styles.modalContent}
        sheetStyle={styles.appointmentModalSheet}
        headerStyle={styles.appointmentModalHeader}
      >
        {selectedAppointment ? (
          <>
            {isEditingDetails ? (
              <>
                <EditableDetailItem
                  label="Concern"
                  value={draftDetails.concern}
                  editable
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, concern: text }))}
                />
                <EditableDetailItem
                  label="Address"
                  value={draftDetails.address}
                  editable
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, address: text }))}
                />
                <EditableDetailItem
                  label="Doctor name"
                  value={draftDetails.doctorName}
                  editable
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, doctorName: text }))}
                />
                <EditableDetailItem
                  label="Contact number"
                  value={draftDetails.contactNumber}
                  editable
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, contactNumber: text }))}
                />
                <EditableDetailItem
                  label="Date scheduled"
                  value={draftDetails.dateSched}
                  editable
                  mode="date"
                  minimumDate={startOfToday()}
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, dateSched: text }))}
                />
                <EditableDetailItem
                  label="Time scheduled"
                  value={draftDetails.timeSched}
                  editable
                  mode="time"
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, timeSched: text }))}
                />
                <EditableDetailItem
                  label="Notes"
                  value={draftDetails.note}
                  editable
                  multiline
                  onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, note: text }))}
                />
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Appointment Details</Text>
                <View style={styles.detailPanel}>
                  <DetailItem label="Concern" value={selectedAppointment.concern} />
                  <DetailItem label="Address" value={selectedAppointment.address} />
                  <View style={styles.detailGrid}>
                    <DetailItem label="Doctor name" value={selectedAppointment.doctorName} />
                    <DetailItem label="Contact number" value={selectedAppointment.contactNumber} />
                  </View>
                </View>

                <AppointmentDetailsContent
                  appointment={selectedAppointment}
                  observedNow={observedNow}
                  onStatusChange={handleScheduleStatusChange}
                  muted={selectedAppointment.isCompleted || selectedAppointment.isSkipped}
                />

                <View style={styles.notesPanel}>
                  <DetailItem label="Notes" value={selectedAppointment.note} />
                </View>
              </>
            )}

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
                  style={styles.closeButton}
                  textStyle={styles.closeButtonText}
                  pressedStyle={styles.closeButtonPressed}
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
          message={`Delete ${pendingDeleteAppointment?.concern || 'this appointment'} from your tracker? You can undo this later.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDeleteAppointment(null)}
          onConfirm={confirmDeleteAppointment}
          cancelActionStyle={styles.confirmCancelButton}
          cancelTextStyle={styles.confirmCancelText}
          cancelPressedStyle={styles.confirmCancelPressed}
          confirmActionStyle={styles.confirmSolidButton}
          confirmTextStyle={styles.confirmSolidText}
          confirmPressedStyle={styles.confirmSolidPressed}
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
          cancelActionStyle={styles.confirmCancelButton}
          cancelTextStyle={styles.confirmCancelText}
          cancelPressedStyle={styles.confirmCancelPressed}
          confirmActionStyle={styles.confirmSolidButton}
          confirmTextStyle={styles.confirmSolidText}
          confirmPressedStyle={styles.confirmSolidPressed}
        />
      ) : null}

      <View
        pointerEvents={footerNav.isVisible ? 'auto' : 'none'}
        style={[
          styles.footerNav,
          { backgroundColor: colors.pageBg, opacity: footerNav.isVisible ? 1 : 0 },
        ]}
        onLayout={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          setFooterNavHeight((currentHeight) => (
            currentHeight === nextHeight ? currentHeight : nextHeight
          ));
        }}
      >
        <NavigationBar
          selectedTab="appointment"
          showPressAlert={false}
          onNavigate={onTabNavigate}
          hidden={!footerNav.isVisible}
        />
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }) {
  const displayValue = String(value || '').trim();
  const accessibleValue = displayValue || 'Blank';

  return (
    <View
      style={[styles.detailRow, styles.readOnlyDetailRow]}
      accessible
      accessibilityLabel={`${label}: ${accessibleValue}`}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{displayValue}</Text>
    </View>
  );
}

function EditableDetailItem({ label, value, editable, onChangeText, mode = null, minimumDate = null, multiline = false }) {
  if (!editable) {
    return <DetailItem label={label} value={value} />;
  }

  if (mode === 'date' || mode === 'time') {
    return (
      <View style={styles.editDetailRow}>
        <NativeDateTimeField
          label={label}
          value={value}
          mode={mode}
          onChange={onChangeText}
          accessibilityLabel={label}
          minimumDate={minimumDate}
          focusBorderColor={APPOINTMENT_ACCENT}
          focusBackgroundColor={colors.brandSoft}
          focusTextColor={APPOINTMENT_ACCENT}
        />
      </View>
    );
  }

  return (
    <View style={[styles.editDetailRow, multiline && styles.editNotesRow]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <InputBar
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        focusBorderColor={APPOINTMENT_ACCENT}
        focusBackgroundColor={colors.brandSoft}
      />
    </View>
  );
}

function SmallHeaderAction({ label, icon, color, onPress }) {
  return (
    <View style={styles.iconActionCol}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.iconActionBtn,
          pressed && styles.iconActionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={18} color={color} />
      </Pressable>
      <Text style={[styles.iconActionLabel, { color }]}>{label}</Text>
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
  headerBlock: {
    marginBottom: spacing.sm,
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
  emptyTextBold: {
    fontWeight: '700',
    color: APPOINTMENT_ACCENT_TEXT,
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
  addButtonWrap: {
    alignItems: 'center',
    gap: 2,
  },
  addButtonLabel: {
    ...typography.bodySmall,
    color: APPOINTMENT_ACCENT_TEXT,
    fontWeight: '600',
  },
  appointmentAddCircle: {
    backgroundColor: APPOINTMENT_ADD_CIRCLE_BG,
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
    backgroundColor: colors.surface,
  },
  appointmentModalHeader: {
    // backgroundColor: '#E5E7EB',
    backgroundColor: colors.surface,
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
  stepTitle: {
    ...typography.titleSmall,
    color: colors.title,
    fontWeight: '700',
  },
  detailPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notesPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: '#F8FAFC',
  },
  detailRow: {
    gap: spacing.xxs,
  },
  readOnlyDetailRow: {
    flex: 1,
    minWidth: moderateScale(130),
  },
  editDetailRow: {
    gap: spacing.xxs,
  },
  editNotesRow: {
    marginBottom: spacing.sm,
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
    gap: spacing.sm,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  iconActionPressed: {
    backgroundColor: '#E2E8F0',
  },
  iconActionCol: {
    alignItems: 'center',
    gap: spacing.xxs || 2,
  },
  iconActionLabel: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  closeButton: {
    borderColor: APPOINTMENT_ACCENT,
  },
  closeButtonText: {
    color: APPOINTMENT_ACCENT_TEXT,
  },
  closeButtonPressed: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  confirmCancelButton: {
    borderColor: APPOINTMENT_ACCENT,
  },
  confirmCancelText: {
    color: APPOINTMENT_ACCENT_TEXT,
  },
  confirmCancelPressed: {
    backgroundColor: APPOINTMENT_ACCENT_PRESSED,
    borderColor: APPOINTMENT_ACCENT_TEXT,
  },
  confirmSolidButton: {
    backgroundColor: APPOINTMENT_ACCENT,
    borderColor: APPOINTMENT_ACCENT,
  },
  confirmSolidText: {
    color: colors.surface,
  },
  confirmSolidPressed: {
    backgroundColor: APPOINTMENT_ACCENT_TEXT,
    borderColor: APPOINTMENT_ACCENT_TEXT,
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
