import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { AddButton, DeleteButton, EditButton } from '../../../shared/components/common/CrudButton';
import DialogBox from '../../../shared/components/common/DialogBox';
import InputBar from '../../../shared/components/common/InputBar';
import LargePopup from '../../../shared/components/common/LargePopup';
import ThemedScrollView from '../../../shared/components/common/ThemedScrollView';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';
import { MedTrackerEditorContent } from './MedTrackerEditorContent';
import { MedicineDetailsContent, MedicinePreviewCard } from './MedTrackerScreenComponents';

export function MedTrackerHeader({ onBack, onCreate, pinHeader = true }) {
  const { darkModeEnabled } = useTextScale();
  const headerRow = (
    <View style={styles.headerRow}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>Medicines</Text>
        <Text style={styles.subtitle}>Manage all your medications and supplements in one place.</Text>
      </View>
      <AddButton onPress={onCreate} iconOnly />
    </View>
  );

  return (
    <View style={[styles.topHeader, { backgroundColor: colors.pageBg, borderBottomColor: darkModeEnabled ? colors.border : 'transparent' }]}>
      <View style={styles.backButtonRow}>
        <BackButton onPress={onBack} />
      </View>
      {pinHeader ? headerRow : null}
    </View>
  );
}

export function MedTrackerHeaderContent({ onCreate }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>Medicines</Text>
        <Text style={styles.subtitle}>Manage all your medications and supplements in one place.</Text>
      </View>
      <AddButton onPress={onCreate} iconOnly />
    </View>
  );
}

export function MedicineListSection({
  footerNavHeight,
  medicines,
  hasActiveSearch,
  observedNow,
  searchQuery,
  onSearchChange,
  onOpenMedicine,
  onReviewRecords,
  onScheduleStatusChange,
  headerContent = null,
}) {
  return (
    <ThemedScrollView contentContainerStyle={[styles.content, { paddingBottom: footerNavHeight + spacing.lg }]}>
      {headerContent ? <View style={styles.headerBlock}>{headerContent}</View> : null}
      <View style={styles.searchWrap}>
        <InputBar
          placeholder="Search medicines"
          accessibilityLabel="Search medicines"
          value={searchQuery}
          onChangeText={onSearchChange}
          showSearchIcon
          autoComplete="off"
        />
      </View>
      <View style={styles.listSection}>
        {medicines.length ? medicines.map((medicine) => (
          <MedicinePreviewCard
            key={medicine.medEntryId}
            medicine={medicine}
            observedNow={observedNow}
            onOpen={() => onOpenMedicine(medicine)}
            onScheduleStatusChange={onScheduleStatusChange}
          />
        )) : hasActiveSearch ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No medicines found.</Text>
            <Text style={styles.emptyText}>Try another name, strength, schedule, or status.</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Review previous records"
          unstable_pressDelay={0}
          onPress={onReviewRecords}
          style={({ pressed }) => [styles.historyBar, pressed && styles.pressedControl]}
        >
          <Text style={styles.historyBarText}>Review previous records</Text>
        </Pressable>
      </View>
    </ThemedScrollView>
  );
}

export function MedicineDetailsPopup({
  medicine,
  visible,
  observedNow,
  onClose,
  onEdit,
  onDelete,
  onScheduleStatusChange,
}) {
  return (
    <LargePopup
      visible={visible && Boolean(medicine)}
      onClose={onClose}
      header={
        medicine ? (
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>Medicine Details</Text>
              <Text style={styles.detailsMedicineName}>{medicine.medName}</Text>
            </View>
            <View style={styles.detailActionsTop}>
              <EditButton onPress={onEdit} />
              <DeleteButton onPress={onDelete} />
            </View>
          </View>
        ) : null
      }
      contentContainerStyle={styles.modalContent}
      sheetStyle={[styles.medModalSheet, { backgroundColor: colors.surface }]}
      headerStyle={[styles.medModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
    >
      {medicine ? (
        <>
          <MedicineDetailsContent
            medicine={medicine}
            observedNow={observedNow}
            onScheduleStatusChange={onScheduleStatusChange}
          />

          <View style={styles.footerActionsRow}>
            <ActionButton label="Close" variant="outline" onPress={onClose} />
          </View>
        </>
      ) : null}
    </LargePopup>
  );
}

export function MedicineEditorPopup({
  visible,
  editorMode,
  editorStep,
  selectedScheduleType,
  formState,
  units,
  onAddUnit,
  onDeleteUnit,
  scheduleDraft,
  scheduleEntries,
  editingScheduleIndex,
  formError,
  setFormState,
  setScheduleDraft,
  onSelectScheduleType,
  onCancelScheduleEdit,
  onSaveScheduleEntry,
  onSaveInlineScheduleEntry,
  onEditScheduleEntry,
  onDeleteScheduleEntry,
  onCancel,
  onPreviousStep,
  onNextStep,
  onSaveMedicine,
}) {
  return (
    <LargePopup
      visible={visible}
      onClose={onCancel}
      header={
        <View style={styles.detailsHeaderRow}>
          <View style={styles.detailsHeaderTextBlock}>
            <Text style={styles.detailsTitle}>{editorMode === 'edit' ? 'Edit Medicine' : 'Add Medicine'}</Text>
          </View>
        </View>
      }
      contentContainerStyle={styles.modalContent}
      sheetStyle={[styles.medModalSheet, { backgroundColor: colors.surface }]}
      headerStyle={[styles.medModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
    >
      <MedTrackerEditorContent
        editorMode={editorMode}
        editorStep={editorStep}
        selectedScheduleType={selectedScheduleType}
        formState={formState}
        units={units}
        onAddUnit={onAddUnit}
        onDeleteUnit={onDeleteUnit}
        scheduleDraft={scheduleDraft}
        scheduleEntries={scheduleEntries}
        editingScheduleIndex={editingScheduleIndex}
        formError={formError}
        setFormState={setFormState}
        setScheduleDraft={setScheduleDraft}
        onSelectScheduleType={onSelectScheduleType}
        onCancelScheduleEdit={onCancelScheduleEdit}
        onSaveScheduleEntry={onSaveScheduleEntry}
        onSaveInlineScheduleEntry={onSaveInlineScheduleEntry}
        onEditScheduleEntry={onEditScheduleEntry}
        onDeleteScheduleEntry={onDeleteScheduleEntry}
        onCancel={onCancel}
        onPreviousStep={onPreviousStep}
        onNextStep={onNextStep}
        onSaveMedicine={onSaveMedicine}
      />
    </LargePopup>
  );
}

export function ConfirmationDialogModal({
  visible,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  cancelActionStyle,
  cancelTextStyle,
  cancelPressedStyle,
  confirmActionStyle,
  confirmTextStyle,
  confirmPressedStyle,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.confirmOverlay} onPress={onCancel}>
        <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
          <DialogBox
            title={title}
            message={message}
            actions={[
              {
                label: 'Cancel',
                variant: 'outline',
                onPress: onCancel,
                style: cancelActionStyle,
                textStyle: cancelTextStyle,
                pressedStyle: cancelPressedStyle,
              },
              {
                label: confirmLabel,
                variant: 'solid',
                onPress: onConfirm,
                style: confirmActionStyle,
                textStyle: confirmTextStyle,
                pressedStyle: confirmPressedStyle,
              },
            ]}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  headerBlock: {
    marginBottom: spacing.sm,
  },
  backButtonRow: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
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
  searchWrap: {
    marginBottom: 0,
  },
  listSection: {
    marginTop: 0,
    gap: spacing.sm,
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
  historyBar: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  historyBarText: {
    ...typography.body,
    color: colors.brand,
    fontWeight: '700',
  },
  pressedControl: {
    backgroundColor: '#C7DBFF',
    borderColor: colors.brandText,
  },
  modalContent: {
    paddingBottom: spacing.xl + spacing.sm,
  },
  medModalSheet: {
    backgroundColor: '#E5E7EB',
  },
  medModalHeader: {
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
  },
  detailsHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxs,
  },
  detailsMedicineName: {
    ...typography.body,
    color: colors.body,
    fontWeight: '600',
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 360,
  },
  topHeader: {
    paddingHorizontal: BACK_HEADER_HORIZONTAL_PADDING,
    paddingTop: BACK_HEADER_TOP_OFFSET,
    paddingBottom: BACK_HEADER_BOTTOM_PADDING,
    gap: spacing.xxs,
  },
});
