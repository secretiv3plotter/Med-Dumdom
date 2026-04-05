import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const TOP_OVERLAY_HEIGHT = 130;

const INITIAL_APPOINTMENTS = [
  {
    id: 'appt-1',
    concern: 'Primary Care Follow-up',
    address: 'Makati Medical Center, Room 204',
    contactNum: '+63 917 555 0198',
    dateSched: '2026-03-20',
    timeSched: '08:30',
    note: 'Bring your latest blood pressure log and lab results.',
    isCompleted: false,
    completedAt: null,
  },
  {
    id: 'appt-2',
    concern: 'Lab Results Consultation',
    address: 'Teleconsult via patient portal',
    contactNum: '+63 2 8123 4567',
    dateSched: '2026-03-21',
    timeSched: '10:15',
    note: 'Review CBC, fasting glucose, and cholesterol levels.',
    isCompleted: false,
    completedAt: null,
  },
  {
    id: 'appt-3',
    concern: 'Physical Therapy Check-in',
    address: 'St. Luke’s BGC Rehab Wing',
    contactNum: '+63 917 555 0271',
    dateSched: '2026-03-24',
    timeSched: '14:00',
    note: 'Wear loose clothing for mobility assessment.',
    isCompleted: false,
    completedAt: null,
  },
  {
    id: 'appt-4',
    concern: 'Dental Cleaning',
    address: 'Rivera Dental Clinic',
    contactNum: '+63 917 555 0180',
    dateSched: '2026-03-18',
    timeSched: '09:00',
    note: 'Routine cleaning completed without issues.',
    isCompleted: true,
    completedAt: '2026-03-18T09:42:00.000Z',
  },
];

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

function toAppointmentDateTime(entry) {
  return new Date(`${entry.dateSched}T${entry.timeSched}:00`);
}

function formatDate(dateString) {
  if (!dateString) {
    return '--';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return '--';
  }

  const [hours, minutes] = String(timeString).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatIsoDateTime(isoString) {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatIsoTime(isoString) {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getAppointmentStatus(appointment) {
  if (appointment.isCompleted) {
    return { label: 'Completed', bgColor: '#E9F8EF', textColor: colors.success };
  }

  const now = new Date();
  const appointmentDate = toAppointmentDateTime(appointment);
  const diffMinutes = Math.round((appointmentDate.getTime() - now.getTime()) / (60 * 1000));

  if (diffMinutes <= 60) {
    return { label: 'Due now', bgColor: '#FDECEC', textColor: colors.error };
  }

  return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
}

export default function AppointmentTrackerScreen({ navigation }) {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    INITIAL_APPOINTMENTS[0]?.id || null
  );
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState({
    concern: '',
    address: '',
    contactNum: '',
    dateSched: '',
    timeSched: '',
    note: '',
  });
  const [formError, setFormError] = useState('');
  const [draftDetails, setDraftDetails] = useState({
    concern: '',
    address: '',
    contactNum: '',
    dateSched: '',
    timeSched: '',
    note: '',
  });

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  useEffect(() => {
    if (!selectedAppointment) {
      return;
    }

    setDraftDetails({
      concern: selectedAppointment.concern,
      address: selectedAppointment.address,
      contactNum: selectedAppointment.contactNum,
      dateSched: selectedAppointment.dateSched,
      timeSched: selectedAppointment.timeSched,
      note: selectedAppointment.note,
    });
  }, [selectedAppointment]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((left, right) => {
      const leftStatus = left.isCompleted ? 1 : 0;
      const rightStatus = right.isCompleted ? 1 : 0;

      if (leftStatus !== rightStatus) {
        return leftStatus - rightStatus;
      }

      if (left.isCompleted && right.isCompleted) {
        return new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime();
      }

      return toAppointmentDateTime(left).getTime() - toAppointmentDateTime(right).getTime();
    });
  }, [appointments]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const handleAddAppointment = () => {
    setFormError('');
    setFormState({
      concern: '',
      address: '',
      contactNum: '',
      dateSched: '',
      timeSched: '',
      note: '',
    });
    setEditorMode('create');
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    setIsEditingDetails(true);
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    setAppointments((prev) => {
      const nextAppointments = prev.filter((appointment) => appointment.id !== selectedAppointment.id);
      setSelectedAppointmentId(nextAppointments[0]?.id || null);
      return nextAppointments;
    });
    setIsEditingDetails(false);
    setIsDetailsVisible(false);
  };

  const handleSaveDetails = () => {
    if (!selectedAppointment) {
      return;
    }

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? {
              ...appointment,
              concern: draftDetails.concern.trim() || appointment.concern,
              address: draftDetails.address.trim() || appointment.address,
              contactNum: draftDetails.contactNum.trim() || appointment.contactNum,
              dateSched: draftDetails.dateSched.trim() || appointment.dateSched,
              timeSched: draftDetails.timeSched.trim() || appointment.timeSched,
              note: draftDetails.note.trim() || appointment.note,
            }
          : appointment
      )
    );
    setIsEditingDetails(false);
  };

  const handleCancelEdit = () => {
    if (selectedAppointment) {
      setDraftDetails({
        concern: selectedAppointment.concern,
        address: selectedAppointment.address,
        contactNum: selectedAppointment.contactNum,
        dateSched: selectedAppointment.dateSched,
        timeSched: selectedAppointment.timeSched,
        note: selectedAppointment.note,
      });
    }
    setIsEditingDetails(false);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setFormError('');
  };

  const saveAppointment = () => {
    const requiredFields = [
      formState.concern.trim(),
      formState.address.trim(),
      formState.contactNum.trim(),
      formState.dateSched.trim(),
      formState.timeSched.trim(),
    ];

    if (requiredFields.some((field) => !field)) {
      setFormError('Complete all required appointment fields.');
      return;
    }

    const newAppointment = {
      id: `appt-${Date.now()}`,
      concern: formState.concern.trim(),
      address: formState.address.trim(),
      contactNum: formState.contactNum.trim(),
      dateSched: formState.dateSched.trim(),
      timeSched: formState.timeSched.trim(),
      note: formState.note.trim(),
      isCompleted: false,
      completedAt: null,
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    setSelectedAppointmentId(newAppointment.id);
    closeEditor();
  };

  const handleToggleCompleted = (nextValue) => {
    if (!selectedAppointment) {
      return;
    }

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? {
              ...appointment,
              isCompleted: nextValue,
              completedAt: nextValue ? new Date().toISOString() : null,
            }
          : appointment
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Appointment Tracker</Text>
            <Text style={styles.subtitle}>Tap an appointment to view complete details.</Text>
          </View>
          <AddButton onPress={handleAddAppointment} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listSection}>
          {sortedAppointments.map((appointment) => {
            const status = getAppointmentStatus(appointment);
            const isSelected = appointment.id === selectedAppointmentId;

            return (
              <ClickableCard
                key={appointment.id}
                size="landscape"
                variant="solid"
                onPress={() => {
                  setSelectedAppointmentId(appointment.id);
                  setIsDetailsVisible(true);
                }}
                cardStyle={[styles.appointmentCard, isSelected && styles.selectedAppointmentCard]}
                contentStyle={styles.appointmentCardContent}
                leftSlot={
                  <View style={styles.cardHeaderBlock}>
                    <Text style={styles.cardHeaderName} numberOfLines={1}>
                      {appointment.concern}
                    </Text>
                    <Text style={styles.cardHeaderMeta} numberOfLines={1}>
                      {appointment.address}
                    </Text>
                    <Text style={styles.cardHeaderMeta} numberOfLines={1}>
                      {`${formatDate(appointment.dateSched)} at ${formatTime(appointment.timeSched)}`}
                    </Text>
                  </View>
                }
                rightSlot={
                  <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
                  </View>
                }
              />
            );
          })}
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
              label="Contact number"
              value={isEditingDetails ? draftDetails.contactNum : selectedAppointment.contactNum}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, contactNum: text }))}
            />
            <EditableDetailItem
              label="Date scheduled"
              value={isEditingDetails ? draftDetails.dateSched : formatDate(selectedAppointment.dateSched)}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, dateSched: text }))}
            />
            <EditableDetailItem
              label="Time scheduled"
              value={isEditingDetails ? draftDetails.timeSched : formatTime(selectedAppointment.timeSched)}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, timeSched: text }))}
            />
            <EditableDetailItem
              label="Note"
              value={isEditingDetails ? draftDetails.note : selectedAppointment.note || '--'}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, note: text }))}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.detailLabel}>Mark as completed</Text>
              <ToggleButton
                value={selectedAppointment.isCompleted}
                onChange={handleToggleCompleted}
                size={30}
              />
            </View>

            <DetailItem label="Time completed" value={formatIsoTime(selectedAppointment.completedAt)} />
            <DetailItem label="Date completed" value={formatIsoDateTime(selectedAppointment.completedAt)} />

            <View style={styles.footerActionsRow}>
              {isEditingDetails ? (
                <>
                  <ActionButton label="Cancel" variant="outline" onPress={handleCancelEdit} />
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
        onClose={closeEditor}
        header={
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>Add Appointment</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.formColumn}>
          <InputBar
            placeholder="Concern"
            value={formState.concern}
            onChangeText={(value) => setFormState((current) => ({ ...current, concern: value }))}
          />
          <InputBar
            placeholder="Address"
            value={formState.address}
            onChangeText={(value) => setFormState((current) => ({ ...current, address: value }))}
          />
          <InputBar
            placeholder="Contact number"
            value={formState.contactNum}
            onChangeText={(value) => setFormState((current) => ({ ...current, contactNum: value }))}
          />
          <InputBar
            placeholder="Date scheduled (YYYY-MM-DD)"
            value={formState.dateSched}
            onChangeText={(value) => setFormState((current) => ({ ...current, dateSched: value }))}
          />
          <InputBar
            placeholder="Time scheduled (HH:MM)"
            value={formState.timeSched}
            onChangeText={(value) => setFormState((current) => ({ ...current, timeSched: value }))}
          />
          <InputBar
            placeholder="Note"
            value={formState.note}
            onChangeText={(value) => setFormState((current) => ({ ...current, note: value }))}
          />
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.footerActionsRow}>
          <ActionButton label="Cancel" variant="outline" onPress={closeEditor} />
          <ActionButton label="Add Appointment" variant="solid" onPress={saveAppointment} />
        </View>
      </LargePopup>

      <View style={styles.footerNav}>
        <NavigationBar
          selectedTab="appointment"
          showPressAlert={false}
          onNavigate={onTabNavigate}
        />
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
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  listSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  appointmentCard: {
    minHeight: 86,
  },
  selectedAppointmentCard: {
    borderColor: colors.brand,
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
  detailsTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.title,
  },
  detailsHeaderRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    minHeight: 64,
    paddingRight: 140,
  },
  detailsHeaderTextBlock: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailActionsTop: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formColumn: {
    gap: spacing.sm,
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
});

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditableDetailItem({ label, value, editable, onChangeText }) {
  if (!editable) {
    return <DetailItem label={label} value={value} />;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <InputBar value={value} onChangeText={onChangeText} placeholder={label} />
    </View>
  );
}
