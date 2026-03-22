import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/common/BackButton';
import ActionButton from '../components/common/ActionButton';
import CrudButton from '../components/common/CrudButton';
import SearchBar from '../components/common/SearchBar';
import TextCard from '../components/common/TextCard';
import UserCard from '../components/common/UserCard';
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
      <View style={styles.topArea}>
        <BackButton
          onPress={() => navigation?.goBack?.()}
          disabled={!navigation?.canGoBack}
          style={styles.backButton}
          iconStyle={styles.backButtonIcon}
          labelStyle={styles.backButtonLabel}
        />
        <View style={styles.headerWrap}>
          <View style={styles.titleRow}>
            <Ionicons name="people-outline" size={24} color={colors.surface} />
            <Text style={styles.title}>Patients</Text>
          </View>
          <Text style={styles.subtitle}>Add a patient under your care.</Text>
        </View>
      </View>

      <View style={styles.page}>
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
              <UserCard
                key={patient.id}
                variant="link"
                name={patient.name}
                subtitle={patient.email}
                avatarContent={<Ionicons name="person-circle-outline" size={54} color={colors.brandText} />}
                rightAccessory={
                  <CrudButton
                    label=""
                    onPress={() => setSelectedPatient(patient)}
                    style={styles.plusButton}
                    circleStyle={styles.actionCircle}
                    iconSize={14}
                    textStyle={styles.hiddenLabel}
                  />
                }
              />
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
    backgroundColor: colors.brand,
  },
  topArea: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs,
    gap: spacing.xxs,
    position: 'relative',
  },
  page: {
    flex: 1,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    top: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  backButtonIcon: {
    color: colors.surface,
  },
  backButtonLabel: {
    color: colors.surface,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.surface,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.surface,
    textAlign: 'center',
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
  plusButton: {
    minWidth: 0,
    marginTop: 0,
    gap: 0,
    justifyContent: 'center',
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
