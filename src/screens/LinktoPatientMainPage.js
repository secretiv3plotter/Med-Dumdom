import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/common/BackButton';
import ActionButton from '../components/common/ActionButton';
import CrudButton from '../components/common/CrudButton';
import SearchBar from '../components/common/SearchBar';
import TextCard from '../components/common/TextCard';
import { colors, radius, spacing, typography } from '../constants/Themes';

const patients = [
  { id: '1', name: 'Jane Doe', email: 'janedoe@gmail.com' },
  { id: '2', name: 'John Doe', email: 'johndoe@gmail.com' },
  { id: '3', name: 'Andrea Santos', email: 'andrea.santos@gmail.com' },
  { id: '4', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
  { id: '5', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: '6', name: 'Carlo Mendoza', email: 'carlo.mendoza@gmail.com' },
];

export default function LinktoPatientMainPage({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [requestStatus, setRequestStatus] = useState('');
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const showStatusDialog = (statusText) => {
    setRequestStatus(statusText);
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = setTimeout(() => {
      setRequestStatus('');
    }, 3000);
  };

  const onCancelRequest = () => {
    setSelectedPatient(null);
    showStatusDialog('Request cancelled');
  };

  const onSendRequest = () => {
    setSelectedPatient(null);
    showStatusDialog('Request sent');
  };

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return patients;
    }
    return patients.filter((patient) => {
      const patientName = patient.name.toLowerCase();
      const patientEmail = patient.email.toLowerCase();
      return patientName.startsWith(query) || patientEmail.startsWith(query);
    });
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.page}>
        <BackButton
          onPress={() => navigation?.goBack?.()}
          disabled={!navigation?.canGoBack}
          style={styles.backButton}
        />

        <View style={styles.headerWrap}>
          <View style={styles.titleRow}>
            <Ionicons name="people-outline" size={24} color={colors.brandText} />
            <Text style={styles.title}>Patients</Text>
          </View>
          <Text style={styles.subtitle}>Add a patient under your care.</Text>
        </View>

        <TextCard cardStyle={styles.listCard}>
          <View style={styles.searchContainer}>
            <View pointerEvents="none">
              <SearchBar placeholder="Find a patient" />
            </View>
            <TextInput
              placeholder={searchQuery ? '' : 'Find a patient'}
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchOverlayInput}
              returnKeyType="search"
            />
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {filteredPatients.map((patient) => (
              <View key={patient.id} style={styles.patientRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-circle-outline" size={34} color={colors.brandText} />
                  <View>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientEmail}>{patient.email}</Text>
                  </View>
                </View>

                <CrudButton
                  label=""
                  onPress={() => setSelectedPatient(patient)}
                  style={styles.plusButton}
                  textStyle={styles.hiddenLabel}
                />
              </View>
            ))}
          </ScrollView>
        </TextCard>
      </View>

      <Modal
        transparent
        visible={Boolean(selectedPatient)}
        animationType="fade"
        onRequestClose={() => setSelectedPatient(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedPatient(null)}>
          <Pressable style={styles.dialogWrap} onPress={() => {}}>
            <View style={styles.dialogCard}>
              <Text style={styles.requestDialogTitle}>Send Access Request</Text>
              <View style={styles.dialogContent}>
                <Ionicons name="person-circle-outline" size={88} color={colors.body} />
                <Text style={styles.dialogName}>{selectedPatient?.name || ''}</Text>
                <Text style={styles.dialogEmail}>{selectedPatient?.email || ''}</Text>
              </View>
              <View style={styles.dialogActionsRow}>
                <ActionButton
                  label="Cancel"
                  variant="outline"
                  onPress={onCancelRequest}
                  textStyle={styles.cancelButtonText}
                />
                <ActionButton
                  label="Send Request"
                  variant="solid"
                  onPress={onSendRequest}
                  textStyle={styles.sendButtonText}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(requestStatus)} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialogWrap}>
            <View style={styles.statusDialogCard}>
              <Text style={styles.statusDialogTitle}>{requestStatus}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  page: {
    flex: 1,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.brandText,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.brandText,
  },
  listCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: '#C9D6EA',
    borderWidth: 1,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  searchOverlayInput: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.brandText,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F6FB',
    borderColor: '#0B5FFF',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  patientName: {
    ...typography.body,
    color: colors.brandText,
    fontWeight: '700',
  },
  patientEmail: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
  },
  plusButton: {
    minWidth: 0,
    marginTop: 2,
  },
  hiddenLabel: {
    fontSize: 0,
    lineHeight: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  dialogCard: {
    backgroundColor: '#E8EFF1',
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  dialogContent: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dialogName: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
  },
  dialogEmail: {
    ...typography.body,
    color: colors.body,
    marginBottom: spacing.xs,
  },
  requestDialogTitle: {
    color: colors.brand,
    fontSize: 34,
    lineHeight: 38,
    textAlign: 'center',
  },
  requestDialogActionText: {
    fontSize: 16,
    lineHeight: 20,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: colors.brand,
  },
  sendButtonText: {
    color: colors.surface,
  },
  statusDialogCard: {
    backgroundColor: '#E8EFF1',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  statusDialogTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: colors.brandText,
    textAlign: 'center',
  },
});
