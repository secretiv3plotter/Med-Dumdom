import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../components/common/ActionButton';
import BackButton from '../components/common/BackButton';
import CrudButton from '../components/common/CrudButton';
import SearchBar from '../components/common/SearchBar';
import TextCard from '../components/common/TextCard';
import UserCard from '../components/common/UserCard';
import { colors, radius, spacing, typography } from '../constants/Themes';

const incomingRequests = [
  { id: '1', name: 'Jane Doe', email: 'janedoe@gmail.com' },
  { id: '2', name: 'John Doe', email: 'johndoe@gmail.com' },
  { id: '3', name: 'Andrea Santos', email: 'andrea.santos@gmail.com' },
  { id: '4', name: 'Miguel Santos', email: 'miguel.santos@gmail.com' },
  { id: '5', name: 'Alyssa Mae Rivera', email: 'alyssa.rivera@gmail.com' },
];

export default function LinkRequestsPage({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showStatus = (message) => {
    setStatusMessage(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleDecline = () => {
    setSelectedRequest(null);
    showStatus('Request declined');
  };

  const handleAccept = () => {
    setSelectedRequest(null);
    showStatus('Request accepted');
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return incomingRequests;
    }
    return incomingRequests.filter((request) => {
      const patientName = request.name.toLowerCase();
      const patientEmail = request.email.toLowerCase();
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
            <Ionicons name="git-pull-request-outline" size={24} color={colors.surface} />
            <Text style={styles.title}>Link Requests</Text>
          </View>
          <Text style={styles.subtitle}>Review patient link requests.</Text>
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
            {filteredRequests.map((request) => (
              <UserCard
                key={request.id}
                variant="link"
                name={request.name}
                subtitle={request.email}
                avatarContent={<Ionicons name="person-circle-outline" size={54} color={colors.brandText} />}
                rightAccessory={
                  <CrudButton
                    label=""
                    icon="checkmark"
                    onPress={() => setSelectedRequest(request)}
                    style={styles.checkButton}
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
        visible={Boolean(selectedRequest)}
        animationType="fade"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedRequest(null)}>
          <Pressable style={styles.dialogWrap} onPress={() => {}}>
            <View style={styles.dialogCard}>
              <Text style={styles.requestDialogTitle}>Review Link Request</Text>
              <View style={styles.dialogContent}>
                <Ionicons name="person-circle-outline" size={88} color={colors.body} />
                <Text style={styles.dialogName}>{selectedRequest?.name || ''}</Text>
                <Text style={styles.dialogEmail}>{selectedRequest?.email || ''}</Text>
              </View>
              <View style={styles.dialogActionsRow}>
                <ActionButton
                  label="Decline"
                  variant="outline"
                  onPress={handleDecline}
                  textStyle={styles.declineButtonText}
                />
                <ActionButton
                  label="Accept"
                  variant="solid"
                  onPress={handleAccept}
                  textStyle={styles.acceptButtonText}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(statusMessage)} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialogWrap}>
            <View style={styles.statusDialogCard}>
              <Text style={styles.statusDialogTitle}>{statusMessage}</Text>
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
  searchContainer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchOverlayInput: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand,
    color: colors.brandText,
    zIndex: 2,
    elevation: 3,
  },
  checkButton: {
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
  requestDialogTitle: {
    color: colors.brand,
    fontSize: 34,
    lineHeight: 38,
    textAlign: 'center',
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
  dialogActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  declineButtonText: {
    color: colors.brand,
  },
  acceptButtonText: {
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
