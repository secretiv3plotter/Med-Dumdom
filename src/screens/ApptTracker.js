import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import { AddButton, DeleteButton, EditButton } from '../components/common/CrudButton';
import InputBar from '../components/common/InputBar';
import NavigationBar from '../components/common/NavigationBar';
import ToggleButton from '../components/common/ToggleButton';
import { ROUTES } from '../constants/routes';
import { colors, radius, spacing, typography } from '../constants/Themes';

const TOP_OVERLAY_HEIGHT = 160;

const TAB_KEY_TO_ROUTE = {
  home: ROUTES.HOME,
  appointment: ROUTES.APPOINTMENT_TRACKER,
  med: ROUTES.MED_TRACKER,
  progress: ROUTES.PROGRESS_REPORT,
  notification: ROUTES.NOTIFICATION,
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTime24(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(baseDate, minutes) {
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toTimestamp(dateSched, timeSched) {
  return new Date(`${dateSched}T${timeSched}:00`);
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sameDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function getAppointmentStatus(entry, now) {
  if (entry.isCompleted) {
    return {
      label: 'Completed',
      badgeStyle: 'completed',
    };
  }

  const appointmentDate = toTimestamp(entry.dateSched, entry.timeSched);
  const diffMinutes = Math.round((appointmentDate.getTime() - now.getTime()) / (60 * 1000));

  if (sameDay(appointmentDate, now) && diffMinutes <= 60) {
    return {
      label: 'Due now',
      badgeStyle: 'due',
    };
  }

  return {
    label: 'Upcoming',
    badgeStyle: 'upcoming',
  };
}

function createInitialAppointments(now) {
  const soon = addMinutes(now, 20);
  const laterToday = addMinutes(now, 95);
  const tomorrow = addDays(now, 1);
  tomorrow.setHours(10, 15, 0, 0);
  const nextWeek = addDays(now, 5);
  nextWeek.setHours(14, 30, 0, 0);

  const completedOne = addDays(now, -1);
  completedOne.setHours(9, 0, 0, 0);
  const completedAtOne = addDays(now, -1);
  completedAtOne.setHours(9, 42, 0, 0);

  const completedTwo = addDays(now, -4);
  completedTwo.setHours(15, 30, 0, 0);
  const completedAtTwo = addDays(now, -4);
  completedAtTwo.setHours(16, 18, 0, 0);

  return [
    {
      id: 'appt-1',
      concern: 'Primary Care Follow-up',
      address: 'Makati Medical Center, Room 204',
      contactNum: '+63 917 555 0198',
      timeSched: toTime24(soon),
      dateSched: toIsoDate(soon),
      note: 'Bring your latest blood pressure log and lab results.',
      isCompleted: false,
      timeCompleted: '',
      dateCompleted: '',
    },
    {
      id: 'appt-2',
      concern: 'Lab Results Consultation',
      address: 'Teleconsult via patient portal',
      contactNum: '+63 2 8123 4567',
      timeSched: toTime24(laterToday),
      dateSched: toIsoDate(laterToday),
      note: 'Review CBC, fasting glucose, and cholesterol levels.',
      isCompleted: false,
      timeCompleted: '',
      dateCompleted: '',
    },
    {
      id: 'appt-3',
      concern: 'Physical Therapy Check-in',
      address: 'St. Luke’s BGC Rehab Wing',
      contactNum: '+63 917 555 0271',
      timeSched: toTime24(tomorrow),
      dateSched: toIsoDate(tomorrow),
      note: 'Wear loose clothing for mobility assessment.',
      isCompleted: false,
      timeCompleted: '',
      dateCompleted: '',
    },
    {
      id: 'appt-4',
      concern: 'Cardiology Review',
      address: 'Asian Hospital Heart Institute',
      contactNum: '+63 917 555 0304',
      timeSched: toTime24(nextWeek),
      dateSched: toIsoDate(nextWeek),
      note: 'Confirm medication adjustments and discuss ECG findings.',
      isCompleted: false,
      timeCompleted: '',
      dateCompleted: '',
    },
    {
      id: 'appt-5',
      concern: 'Dental Cleaning',
      address: 'Rivera Dental Clinic',
      contactNum: '+63 917 555 0180',
      timeSched: toTime24(completedOne),
      dateSched: toIsoDate(completedOne),
      note: 'Routine cleaning completed without issues.',
      isCompleted: true,
      timeCompleted: toTime24(completedAtOne),
      dateCompleted: toIsoDate(completedAtOne),
    },
    {
      id: 'appt-6',
      concern: 'Dermatology Consultation',
      address: 'UP-PGH Outpatient Department',
      contactNum: '+63 917 555 0411',
      timeSched: toTime24(completedTwo),
      dateSched: toIsoDate(completedTwo),
      note: 'Follow-up on prescription cream response.',
      isCompleted: true,
      timeCompleted: toTime24(completedAtTwo),
      dateCompleted: toIsoDate(completedAtTwo),
    },
  ];
}

function buildEmptyForm(now) {
  return {
    id: '',
    concern: '',
    address: '',
    contactNum: '',
    dateSched: toIsoDate(now),
    timeSched: toTime24(now),
    note: '',
  };
}

function DetailField({ label, value }) {
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '--'}</Text>
    </View>
  );
}

export default function ApptTracker({ navigation }) {
  const editorScrollRef = useRef(null);
  const fieldOffsetsRef = useRef({});
  const [now, setNow] = useState(() => new Date());
  const [appointments, setAppointments] = useState(() => createInitialAppointments(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [formState, setFormState] = useState(() => buildEmptyForm(new Date()));
  const [initialFormState, setInitialFormState] = useState(() => buildEmptyForm(new Date()));
  const [formError, setFormError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const canGoBack =
    typeof navigation?.canGoBack === 'function'
      ? navigation.canGoBack()
      : Boolean(navigation?.canGoBack);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const showEvent = Keyboard.addListener('keyboardWillShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const changeEvent = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideEvent = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showEvent.remove();
      changeEvent.remove();
      hideEvent.remove();
    };
  }, []);

  const pendingAppointments = useMemo(() => {
    return appointments
      .filter((entry) => !entry.isCompleted)
      .sort((left, right) => {
        return (
          toTimestamp(left.dateSched, left.timeSched).getTime() -
          toTimestamp(right.dateSched, right.timeSched).getTime()
        );
      });
  }, [appointments]);

  const historyAppointments = useMemo(() => {
    return appointments
      .filter((entry) => entry.isCompleted)
      .sort((left, right) => {
        return (
          toTimestamp(right.dateCompleted, right.timeCompleted).getTime() -
          toTimestamp(left.dateCompleted, left.timeCompleted).getTime()
        );
      });
  }, [appointments]);

  const selectedAppointment = useMemo(() => {
    return appointments.find((entry) => entry.id === selectedAppointmentId) || null;
  }, [appointments, selectedAppointmentId]);

  const onTabNavigate = (tabKey) => {
    const targetRoute = TAB_KEY_TO_ROUTE[tabKey];
    if (targetRoute) {
      navigation?.navigate?.(targetRoute);
    }
  };

  const openCreateForm = () => {
    const emptyForm = buildEmptyForm(now);
    setEditorMode('create');
    setFormError('');
    setFormState(emptyForm);
    setInitialFormState(emptyForm);
  };

  const openEditForm = () => {
    if (!selectedAppointment) {
      return;
    }

    const nextFormState = {
      id: selectedAppointment.id,
      concern: selectedAppointment.concern,
      address: selectedAppointment.address,
      contactNum: selectedAppointment.contactNum,
      dateSched: selectedAppointment.dateSched,
      timeSched: selectedAppointment.timeSched,
      note: selectedAppointment.note,
    };
    setFormError('');
    setFormState(nextFormState);
    setInitialFormState(nextFormState);
    setSelectedAppointmentId(null);
    setEditorMode('edit');
  };

  const openDeleteDialog = () => {
    if (!selectedAppointment) {
      return;
    }

    setDeleteTargetId(selectedAppointment.id);
    setSelectedAppointmentId(null);
    setShowDeleteDialog(true);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setFormError('');
  };

  const canDismissEditorByBackdrop = useMemo(() => {
    return JSON.stringify(formState) === JSON.stringify(initialFormState);
  }, [formState, initialFormState]);

  const dismissEditorFromBackdrop = () => {
    if (canDismissEditorByBackdrop) {
      closeEditor();
    }
  };

  const registerFieldOffset = (key, offsetY) => {
    fieldOffsetsRef.current[key] = offsetY;
  };

  const scrollFieldIntoView = (key) => {
    const offsetY = fieldOffsetsRef.current[key];
    if (typeof offsetY !== 'number') {
      return;
    }

    requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({
        y: Math.max(0, offsetY - spacing.lg),
        animated: true,
      });
    });
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

    const entryPayload = {
      id: formState.id || `appt-${Date.now()}`,
      concern: formState.concern.trim(),
      address: formState.address.trim(),
      contactNum: formState.contactNum.trim(),
      dateSched: formState.dateSched.trim(),
      timeSched: formState.timeSched.trim(),
      note: formState.note.trim(),
    };

    if (editorMode === 'edit') {
      setAppointments((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === entryPayload.id
            ? {
                ...entry,
                ...entryPayload,
              }
            : entry
        )
      );
      setSelectedAppointmentId(entryPayload.id);
    } else {
      setAppointments((currentEntries) => [
        ...currentEntries,
        {
          ...entryPayload,
          isCompleted: false,
          timeCompleted: '',
          dateCompleted: '',
        },
      ]);
      setSelectedAppointmentId(entryPayload.id);
    }

    closeEditor();
  };

  const deleteAppointment = () => {
    if (!deleteTargetId) {
      return;
    }

    setAppointments((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== deleteTargetId)
    );
    setDeleteTargetId(null);
    setShowDeleteDialog(false);
    setSelectedAppointmentId(null);
  };

  const toggleCompletion = (value) => {
    if (!selectedAppointment) {
      return;
    }

    const completedNow = new Date();

    setAppointments((currentEntries) =>
      currentEntries.map((entry) => {
        if (entry.id !== selectedAppointment.id) {
          return entry;
        }

        return {
          ...entry,
          isCompleted: value,
          timeCompleted: value ? toTime24(completedNow) : '',
          dateCompleted: value ? toIsoDate(completedNow) : '',
        };
      })
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.stickyTop}>
        <View style={styles.backButtonWrap}>
          <BackButton onPress={() => canGoBack && navigation?.goBack?.()} disabled={!canGoBack} />
        </View>

        <View style={styles.headerMiddleLeft}>
          <View style={styles.heroRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Appointment Tracker</Text>
              <Text style={styles.subtitle}>Tap an appointment to view complete details.</Text>
            </View>

            <AddButton onPress={openCreateForm} style={styles.addButton} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Tracker</Text>
          <View style={styles.cardsColumn}>
            {pendingAppointments.map((entry) => {
              const status = getAppointmentStatus(entry, now);
              const highlighted = status.badgeStyle === 'due';

              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setSelectedAppointmentId(entry.id)}
                  style={[
                    styles.appointmentCard,
                    highlighted && styles.highlightCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{entry.concern}</Text>
                    <View
                      style={[
                        styles.badge,
                        status.badgeStyle === 'due' && styles.dueBadge,
                        status.badgeStyle === 'upcoming' && styles.upcomingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          status.badgeStyle === 'due' && styles.dueBadgeText,
                          status.badgeStyle === 'upcoming' && styles.upcomingBadgeText,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardBody}>{entry.address}</Text>
                  <Text style={styles.cardFooter}>
                    {formatDateLabel(entry.dateSched)} at {formatTimeLabel(entry.timeSched)}
                  </Text>
                </Pressable>
              );
            })}

            {!pendingAppointments.length ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No upcoming appointments</Text>
                <Text style={styles.emptySubtitle}>Add one to start tracking your schedule.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <View style={styles.cardsColumn}>
            {historyAppointments.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => setSelectedAppointmentId(entry.id)}
                style={styles.historyCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{entry.concern}</Text>
                  <View style={[styles.badge, styles.completedBadge]}>
                    <Text style={[styles.badgeText, styles.completedBadgeText]}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.cardBody}>{entry.address}</Text>
                <Text style={styles.cardFooter}>
                  Completed {formatDateLabel(entry.dateCompleted)} at {formatTimeLabel(entry.timeCompleted)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(selectedAppointment)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppointmentId(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedAppointmentId(null)} />
          <View style={styles.detailSheet}>
            {selectedAppointment ? (
              <ScrollView contentContainerStyle={styles.detailContent}>
                <View style={styles.detailTopRow}>
                  <View style={styles.detailHeadingBlock}>
                    <Text style={styles.detailTitle}>Appointment Details</Text>
                    <Text style={styles.detailConcern}>{selectedAppointment.concern}</Text>
                  </View>

                  <View style={styles.detailActions}>
                    <EditButton onPress={openEditForm} />
                    <DeleteButton onPress={openDeleteDialog} />
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <DetailField label="Concern" value={selectedAppointment.concern} />
                <DetailField label="Address" value={selectedAppointment.address} />
                <DetailField label="Contact number" value={selectedAppointment.contactNum} />
                <DetailField label="Time scheduled" value={formatTimeLabel(selectedAppointment.timeSched)} />
                <DetailField label="Date scheduled" value={formatDateLabel(selectedAppointment.dateSched)} />
                <DetailField label="Note" value={selectedAppointment.note || '--'} />

                <View style={styles.completionRow}>
                  <Text style={styles.detailLabel}>Mark as completed</Text>
                  <ToggleButton
                    value={selectedAppointment.isCompleted}
                    onChange={toggleCompletion}
                    size={28}
                  />
                </View>

                <DetailField
                  label="Time completed"
                  value={selectedAppointment.timeCompleted ? formatTimeLabel(selectedAppointment.timeCompleted) : '--'}
                />
                <DetailField
                  label="Date completed"
                  value={selectedAppointment.dateCompleted ? formatDateLabel(selectedAppointment.dateCompleted) : '--'}
                />

                <ActionButton
                  label="Close"
                  onPress={() => setSelectedAppointmentId(null)}
                  variant="outline"
                  style={styles.closeButton}
                  textStyle={styles.closeButtonText}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(editorMode)}
        transparent
        animationType="fade"
        onRequestClose={dismissEditorFromBackdrop}
      >
        <View style={styles.editorOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissEditorFromBackdrop} />
          <View
            style={[
              styles.editorDock,
              {
                paddingBottom: keyboardHeight,
              },
            ]}
          >
            <View style={styles.editorSheet}>
              <ScrollView
                ref={editorScrollRef}
                contentContainerStyle={styles.editorContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <Text style={styles.editorTitle}>
                  {editorMode === 'edit' ? 'Edit Appointment' : 'Add Appointment'}
                </Text>
                <Text style={styles.editorSubtitle}>Enter the appointment details below.</Text>

                <View style={styles.formColumn}>
                  <View onLayout={(event) => registerFieldOffset('concern', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Concern"
                      value={formState.concern}
                      onChangeText={(value) => setFormState((current) => ({ ...current, concern: value }))}
                      onFocus={() => scrollFieldIntoView('concern')}
                    />
                  </View>
                  <View onLayout={(event) => registerFieldOffset('address', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Address"
                      value={formState.address}
                      onChangeText={(value) => setFormState((current) => ({ ...current, address: value }))}
                      onFocus={() => scrollFieldIntoView('address')}
                    />
                  </View>
                  <View onLayout={(event) => registerFieldOffset('contactNum', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Contact number"
                      value={formState.contactNum}
                      onChangeText={(value) => setFormState((current) => ({ ...current, contactNum: value }))}
                      keyboardType="phone-pad"
                      onFocus={() => scrollFieldIntoView('contactNum')}
                    />
                  </View>
                  <View onLayout={(event) => registerFieldOffset('dateSched', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Date scheduled (YYYY-MM-DD)"
                      value={formState.dateSched}
                      onChangeText={(value) => setFormState((current) => ({ ...current, dateSched: value }))}
                      onFocus={() => scrollFieldIntoView('dateSched')}
                    />
                  </View>
                  <View onLayout={(event) => registerFieldOffset('timeSched', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Time scheduled (HH:MM)"
                      value={formState.timeSched}
                      onChangeText={(value) => setFormState((current) => ({ ...current, timeSched: value }))}
                      onFocus={() => scrollFieldIntoView('timeSched')}
                    />
                  </View>
                  <View onLayout={(event) => registerFieldOffset('note', event.nativeEvent.layout.y)}>
                    <InputBar
                      placeholder="Note"
                      value={formState.note}
                      onChangeText={(value) => setFormState((current) => ({ ...current, note: value }))}
                      multiline
                      numberOfLines={2}
                      onFocus={() => scrollFieldIntoView('note')}
                    />
                  </View>
                </View>

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              </ScrollView>

              <View style={styles.editorActionsBar}>
                <View style={styles.editorActions}>
                  <ActionButton
                    label="Cancel"
                    onPress={closeEditor}
                    variant="outline"
                    style={styles.editorButton}
                    textStyle={styles.closeButtonText}
                  />
                  <ActionButton
                    label={editorMode === 'edit' ? 'Save Changes' : 'Add Appointment'}
                    onPress={saveAppointment}
                    variant="solid"
                    style={styles.editorButton}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.localDialogCard}>
              <Text style={styles.dialogTitle}>Delete Appointment</Text>
              <Text style={styles.dialogMessage}>This appointment will be removed from the tracker.</Text>
              <View style={styles.localDialogActions}>
                <ActionButton
                  label="Cancel"
                  onPress={() => {
                    setShowDeleteDialog(false);
                    setDeleteTargetId(null);
                  }}
                  variant="outline"
                  style={styles.localDialogAction}
                  textStyle={styles.closeButtonText}
                />
                <ActionButton
                  label="Delete"
                  onPress={deleteAppointment}
                  variant="solid"
                  style={[styles.localDialogAction, styles.deleteAction]}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: TOP_OVERLAY_HEIGHT,
    paddingBottom: 160,
    gap: spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
  },
  timestamp: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  cardsColumn: {
    gap: spacing.md,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    opacity: 0.94,
  },
  highlightCard: {
    borderWidth: 2,
    borderColor: colors.brand,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    flex: 1,
  },
  cardBody: {
    ...typography.body,
    color: colors.body,
  },
  cardFooter: {
    ...typography.bodySmall,
    color: colors.body,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
  },
  dueBadge: {
    backgroundColor: '#FDECEC',
  },
  dueBadgeText: {
    color: '#B42318',
  },
  upcomingBadge: {
    backgroundColor: '#FFF4E5',
  },
  upcomingBadgeText: {
    color: '#A15C00',
  },
  completedBadge: {
    backgroundColor: '#E7F7ED',
  },
  completedBadgeText: {
    color: colors.success,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.32)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  detailContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  detailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailHeadingBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  detailTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.title,
  },
  detailConcern: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detailField: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  detailValue: {
    ...typography.subtitle,
    color: colors.title,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  closeButton: {
    marginTop: spacing.sm,
  },
  closeButtonText: {
    color: colors.brand,
  },
  editorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.32)',
    justifyContent: 'flex-end',
  },
  editorDock: {
    justifyContent: 'flex-end',
  },
  editorSheet: {
    height: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  editorContent: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  editorTitle: {
    ...typography.title,
    color: colors.title,
  },
  editorSubtitle: {
    ...typography.body,
    color: colors.bodyMuted,
  },
  formColumn: {
    gap: spacing.sm,
  },
  formError: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editorActionsBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  editorButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  localDialogCard: {
    backgroundColor: '#E8EFF1',
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  dialogTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.title,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.body,
    textAlign: 'center',
  },
  localDialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  localDialogAction: {
    flex: 1,
  },
  deleteAction: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
});
