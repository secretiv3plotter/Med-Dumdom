import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../../shared/components/common/ActionButton';
import BackButton from '../../../shared/components/common/BackButton';
import {
  BACK_HEADER_BOTTOM_PADDING,
  BACK_HEADER_HORIZONTAL_PADDING,
  BACK_HEADER_TOP_OFFSET,
} from '../../../shared/components/common/backHeaderMetrics';
import { AddButton } from '../../../shared/components/common/CrudButton';
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
      <View style={styles.addButtonWrap}>
        <AddButton onPress={onCreate} iconOnly accessibilityLabel="Add medicine" />
        <Text style={styles.addButtonLabel}>Add</Text>
      </View>
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
      <View style={styles.addButtonWrap}>
        <AddButton onPress={onCreate} iconOnly accessibilityLabel="Add medicine" />
        <Text style={styles.addButtonLabel}>Add</Text>
      </View>
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
  scrollHandlers = {},
}) {
  return (
    <ThemedScrollView
      contentContainerStyle={[styles.content, { paddingBottom: footerNavHeight + spacing.lg }]}
      {...scrollHandlers}
    >
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
            <Text style={styles.emptyText}>Try another medicine name, dose, time, day, or status.</Text>
          </View>
        ) : (
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel="No medicines added yet. Tap the Add button at the top to add your first medicine."
            style={styles.emptyCard}
          >
            <Text style={styles.emptyTitle}>No medicines yet.</Text>
            <Text style={styles.emptyText}>Tap the <Text style={styles.emptyTextBold}>Add</Text> button at the top to add your first medicine.</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Review previous medicine records"
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
      accessibilityLabel={medicine ? `Medicine details for ${medicine.medName}` : 'Medicine details'}
      header={
        medicine ? (
          <View style={styles.detailsHeaderRow}>
            <View style={styles.detailsHeaderTextBlock}>
              <Text style={styles.detailsTitle}>Medicine Details</Text>
              <Text style={styles.detailsMedicineName}>{medicine.medName}</Text>
            </View>
            <View style={styles.detailActionsTop}>
              <SmallHeaderAction
                label="Edit"
                accessibilityLabel={`Edit ${medicine.medName}`}
                icon="create-outline"
                color={colors.brand}
                onPress={onEdit}
              />
              <SmallHeaderAction
                label="Delete"
                accessibilityLabel={`Delete ${medicine.medName}`}
                icon="trash-outline"
                color={colors.error || '#D32F2F'}
                onPress={onDelete}
              />
            </View>
          </View>
        ) : null
      }
      contentContainerStyle={styles.modalContent}
      sheetStyle={styles.medModalSheet}
      headerStyle={styles.medModalHeader}
    >
      {medicine ? (
        <>
          <MedicineDetailsContent
            medicine={medicine}
            observedNow={observedNow}
            onScheduleStatusChange={onScheduleStatusChange}
          />

          <View style={styles.footerActionsRow}>
            <ActionButton
              label="Close"
              accessibilityLabel={medicine ? `Close medicine details for ${medicine.medName}` : 'Close medicine details'}
              variant="outline"
              onPress={onClose}
            />
          </View>
        </>
      ) : null}
    </LargePopup>
  );
}

function SmallHeaderAction({ label, accessibilityLabel, icon, color, onPress }) {
  return (
    <View style={styles.iconActionCol}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.iconActionBtn,
          pressed && styles.iconActionPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
      >
        <Ionicons name={icon} size={18} color={color} />
      </Pressable>
      <Text style={[styles.iconActionLabel, { color }]}>{label}</Text>
    </View>
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
  originalScheduleType,
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
      accessibilityLabel={editorMode === 'edit' ? 'Edit medicine' : 'Add medicine'}
      header={
        <View style={styles.detailsHeaderRow}>
          <View style={styles.detailsHeaderTextBlock}>
            <Text style={styles.detailsTitle}>{editorMode === 'edit' ? 'Edit Medicine' : 'Add Medicine'}</Text>
          </View>
        </View>
      }
      contentContainerStyle={styles.modalContent}
      sheetStyle={styles.medModalSheet}
      headerStyle={styles.medModalHeader}
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
        originalScheduleType={originalScheduleType}
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
    <Modal visible={visible} transparent animationType="fade" accessibilityViewIsModal onRequestClose={onCancel}>
      <Pressable accessible={false} style={styles.confirmOverlay} onPress={onCancel}>
        <Pressable accessible={false} style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
          <DialogBox
            title={title}
            message={message}
            actions={[
              {
                label: 'Cancel',
                accessibilityLabel: `Cancel ${title}`,
                variant: 'outline',
                onPress: onCancel,
                style: cancelActionStyle,
                textStyle: cancelTextStyle,
                pressedStyle: cancelPressedStyle,
              },
              {
                label: confirmLabel,
                accessibilityLabel: `${confirmLabel} ${title}`,
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
  addButtonWrap: {
    alignItems: 'center',
    gap: 2,
  },
  addButtonLabel: {
    ...typography.bodySmall,
    color: colors.brandText,
    fontWeight: '600',
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
  emptyTextBold: {
    fontWeight: '700',
    color: colors.brandText,
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
    backgroundColor: colors.surface,
    paddingBottom: spacing.xl + spacing.sm,
  },
  medModalSheet: {
    backgroundColor: colors.surface,
  },
  medModalHeader: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
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
