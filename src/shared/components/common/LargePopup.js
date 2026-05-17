import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { colors, spacing } from '../../theme';

const SHEET_OPEN_DURATION_MS = 280;
const SHEET_CLOSE_DURATION_MS = 200;

export default function LargePopup({
  visible = false,
  onClose = () => {},
  header = null,
  children,
  maxHeight = '82%',
  contentContainerStyle,
  sheetStyle,
  headerStyle,
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const hiddenOffset = Math.max(viewportHeight, 480);
  const [mounted, setMounted] = useState(visible);
  const slideAnimation = useRef(new Animated.Value(visible ? 0 : hiddenOffset)).current;
  const wasVisibleRef = useRef(visible);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      wasVisibleRef.current = true;
      setMounted(true);
      slideAnimation.setValue(hiddenOffset);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: SHEET_OPEN_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!visible && wasVisibleRef.current) {
      wasVisibleRef.current = false;
      if (process.env.NODE_ENV === 'test') {
        slideAnimation.setValue(hiddenOffset);
        setMounted(false);
        return;
      }

      Animated.timing(slideAnimation, {
        toValue: hiddenOffset,
        duration: SHEET_CLOSE_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [visible, hiddenOffset, slideAnimation]);

  useEffect(() => {
    if (visible && !mounted) {
      setMounted(true);
    }
  }, [visible, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              maxHeight,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          {header ? <View style={[styles.header, headerStyle]}>{header}</View> : null}
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
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
    width: '100%',
    maxWidth: '100%',
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
