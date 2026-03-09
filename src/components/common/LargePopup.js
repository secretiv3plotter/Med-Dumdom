import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../constants/Themes';

export default function LargePopup({
  visible = false,
  onClose = () => {},
  header = null,
  children,
  maxHeight = '82%',
  contentContainerStyle,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight }]}>
          {header ? <View style={styles.header}>{header}</View> : null}
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
