import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import ClickableCard from '../../../shared/components/common/ClickableCard';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import NavigationBar from '../../../shared/components/common/NavigationBar';
import NativeDateTimeField from '../../../shared/components/common/NativeDateTimeField';
import ToggleButton from '../../../shared/components/common/ToggleButton';
import apptTrackerService from '../../../domain/services/ApptTrackerService';
import { ROUTES } from '../../../app/navigation/routes';
import { colors, spacing, typography } from '../../../shared/theme';

const CURRENT_USER_ID = 'current-user';
const TOP_OVERLAY_HEIGHT = 130;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
};

const EMPTY_FORM = {
  concern: '',
  address: '',
  contactNumber: '',
  dateSched: '',
  timeSched: '',
  note: '',
};

const parseDateTime = (dateSched, timeSched) => {
  const parsed = new Date(`${dateSched}T${timeSched}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (dateString) => {
  if (!dateString) {
    return '--';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeString) => {
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
};

const formatIsoDateTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatIsoTime = (isoString) => {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getAppointmentStatus = (appointment) => {
  if (appointment.isCompleted) {
    return { label: 'Completed', bgColor: '#E9F8EF', textColor: colors.success };
  }

  const appointmentDate = parseDateTime(appointment.dateSched, appointment.timeSched);
  if (!appointmentDate) {
    return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
  }

  const now = new Date();
  const diffMinutes = Math.round((appointmentDate.getTime() - now.getTime()) / (60 * 1000));

  if (diffMinutes < 0) {
    return { label: 'Missed', bgColor: '#FDECEC', textColor: colors.error };
  }

  if (diffMinutes <= 60) {
    return { label: 'Due now', bgColor: '#FDECEC', textColor: colors.error };
  }

  return { label: 'Upcoming', bgColor: '#FFF5E8', textColor: colors.warning };
};

export default function AppointmentTrackerScreen({ navigation }) {
  const [version, setVersion] = useState(0);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [draftDetails, setDraftDetails] = useState(EMPTY_FORM);

  const appointments = useMemo(() => apptTrackerService.listApptEntries(CURRENT_USER_ID), [version]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.apptEntryId === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

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

      const leftDate = parseDateTime(left.dateSched, left.timeSched);
      const rightDate = parseDateTime(right.dateSched, right.timeSched);
      return (leftDate?.getTime() || 0) - (rightDate?.getTime() || 0);
    });
  }, [appointments]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const refresh = () => setVersion((current) => current + 1);

  const handleAddAppointment = () => {
    setFormError('');
    setFormState(EMPTY_FORM);
    setEditorMode('create');
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    setDraftDetails({
      concern: selectedAppointment.concern,
      address: selectedAppointment.address,
      contactNumber: selectedAppointment.contactNumber,
      dateSched: selectedAppointment.dateSched,
      timeSched: selectedAppointment.timeSched,
      note: selectedAppointment.note,
    });
    setIsEditingDetails(true);
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    apptTrackerService.cancelApptEntry(CURRENT_USER_ID, selectedAppointment.apptEntryId);
    setIsEditingDetails(false);
    setIsDetailsVisible(false);
    setSelectedAppointmentId(null);
    refresh();
  };

  const handleSaveDetails = () => {
    if (!selectedAppointment) {
      return;
    }

    apptTrackerService.updateApptEntry(CURRENT_USER_ID, selectedAppointment.apptEntryId, {
      concern: draftDetails.concern.trim() || selectedAppointment.concern,
      address: draftDetails.address.trim() || selectedAppointment.address,
      contactNumber: draftDetails.contactNumber.trim() || selectedAppointment.contactNumber,
      dateSched: draftDetails.dateSched.trim() || selectedAppointment.dateSched,
      timeSched: draftDetails.timeSched.trim() || selectedAppointment.timeSched,
      note: draftDetails.note.trim() || selectedAppointment.note,
    });
    setIsEditingDetails(false);
    refresh();
  };

  const handleToggleCompleted = (nextValue) => {
    if (!selectedAppointment) {
      return;
    }

    if (nextValue) {
      apptTrackerService.markApptCompleted(CURRENT_USER_ID, selectedAppointment.apptEntryId, new Date());
    } else {
      apptTrackerService.undoApptCompleted(CURRENT_USER_ID, selectedAppointment.apptEntryId);
    }

    refresh();
  };

  const saveAppointment = () => {
    const requiredFields = [
      formState.concern.trim(),
      formState.address.trim(),
      formState.contactNumber.trim(),
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

    apptTrackerService.addApptEntry(CURRENT_USER_ID, {
      concern: formState.concern.trim(),
      address: formState.address.trim(),
      contactNumber: formState.contactNumber.trim(),
      timeSched: formState.timeSched.trim(),
      dateSched: formState.dateSched.trim(),
      note: formState.note.trim(),
      isCompleted: false,
      completedAt: null,
    });

    setEditorMode(null);
    setSelectedAppointmentId(null);
    refresh();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation?.navigate?.(ROUTES.HOME)} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Appointment Tracker</Text>
            <Text style={styles.subtitle}>Use the appointment fields defined in the model.</Text>
          </View>
          <AddButton onPress={handleAddAppointment} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.listSection}>
          {sortedAppointments.map((appointment) => {
            const status = getAppointmentStatus(appointment);
            const isSelected = appointment.apptEntryId === selectedAppointmentId;

            return (
              <ClickableCard
                key={appointment.apptEntryId}
                size="landscape"
                variant="solid"
                onPress={() => {
                  setSelectedAppointmentId(appointment.apptEntryId);
                  setDraftDetails({
                    concern: appointment.concern,
                    address: appointment.address,
                    contactNumber: appointment.contactNumber,
                    dateSched: appointment.dateSched,
                    timeSched: appointment.timeSched,
                    note: appointment.note,
                  });
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
              value={isEditingDetails ? draftDetails.contactNumber : selectedAppointment.contactNumber}
              editable={isEditingDetails}
              onChangeText={(text) => setDraftDetails((prev) => ({ ...prev, contactNumber: text }))}
            />
            <EditableDetailItem
              label="Date scheduled"
              value={isEditingDetails ? draftDetails.dateSched : formatDate(selectedAppointment.dateSched)}
              editable={isEditingDetails}
              mode="date"
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
        onClose={() => setEditorMode(null)}
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
            value={formState.contactNumber}
            onChangeText={(value) => setFormState((current) => ({ ...current, contactNumber: value }))}
          />
          <NativeDateTimeField
            label="Date scheduled"
            placeholder="Select appointment date"
            accessibilityLabel="Date scheduled"
            value={formState.dateSched}
            onChange={(value) => setFormState((current) => ({ ...current, dateSched: value }))}
          />
          <NativeDateTimeField
            mode="time"
            label="Time scheduled"
            placeholder="Select appointment time"
            accessibilityLabel="Time scheduled"
            value={formState.timeSched}
            onChange={(value) => setFormState((current) => ({ ...current, timeSched: value }))}
          />
          <InputBar
            placeholder="Note"
            value={formState.note}
            onChangeText={(value) => setFormState((current) => ({ ...current, note: value }))}
          />
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.footerActionsRow}>
          <ActionButton label="Cancel" variant="outline" onPress={() => setEditorMode(null)} />
          <ActionButton label="Add Appointment" variant="solid" onPress={saveAppointment} />
        </View>
      </LargePopup>

      <View style={styles.footerNav}>
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

function EditableDetailItem({ label, value, editable, onChangeText, mode = null }) {
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
        />
      </View>
    );
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <InputBar value={value} onChangeText={onChangeText} placeholder={label} />
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
