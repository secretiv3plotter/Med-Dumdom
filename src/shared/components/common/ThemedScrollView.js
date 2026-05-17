import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { useTextScale } from '../../theme/textScale';

const LIGHT_TRACK_COLOR = 'rgba(100, 116, 139, 0.14)';
const DARK_TRACK_COLOR = 'rgba(148, 163, 184, 0.18)';

export default function ThemedScrollView({
  children,
  contentContainerStyle,
  style,
  scrollbarContainerStyle,
  scrollbarThumbStyle,
  scrollbarTrackStyle,
  showsVerticalScrollIndicator,
  scrollEventThrottle = 16,
  onLayout,
  onContentSizeChange,
  onScroll,
  ...scrollViewProps
}) {
  const { darkModeEnabled } = useTextScale();
  const [scrollMetrics, setScrollMetrics] = useState({
    contentHeight: 0,
    viewportHeight: 0,
    scrollY: 0,
  });

  const maxScrollY = Math.max(scrollMetrics.contentHeight - scrollMetrics.viewportHeight, 0);
  const hasScrollableContent = maxScrollY > 1;
  const thumbHeight = hasScrollableContent
    ? Math.max(
        28,
        Math.round(
          (scrollMetrics.viewportHeight * scrollMetrics.viewportHeight) /
            Math.max(scrollMetrics.contentHeight, 1)
        )
      )
    : 0;
  const thumbTravel = Math.max(scrollMetrics.viewportHeight - thumbHeight - spacing.xs, 0);
  const thumbTop = hasScrollableContent
    ? Math.min(scrollMetrics.scrollY, maxScrollY) * (thumbTravel / maxScrollY)
    : 0;
  const trackColor = darkModeEnabled ? DARK_TRACK_COLOR : LIGHT_TRACK_COLOR;
  const thumbColor = darkModeEnabled ? colors.brand : colors.brandText;
  const showCustomScrollbar = showsVerticalScrollIndicator !== false && darkModeEnabled && hasScrollableContent;

  return (
    <View style={[styles.shell, style]}>
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={showCustomScrollbar ? false : (showsVerticalScrollIndicator ?? true)}
        scrollEventThrottle={scrollEventThrottle}
        onLayout={(event) => {
          const viewportHeight = Math.round(event.nativeEvent.layout.height);
          setScrollMetrics((current) =>
            current.viewportHeight === viewportHeight ? current : { ...current, viewportHeight }
          );
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          const contentHeight = Math.round(height);
          setScrollMetrics((current) =>
            current.contentHeight === contentHeight ? current : { ...current, contentHeight }
          );
          onContentSizeChange?.(width, height);
        }}
        onScroll={(event) => {
          const scrollY = Math.max(0, Math.round(event.nativeEvent.contentOffset.y));
          setScrollMetrics((current) =>
            current.scrollY === scrollY ? current : { ...current, scrollY }
          );
          onScroll?.(event);
        }}
      >
        {children}
      </ScrollView>

      {showCustomScrollbar ? (
        <View
          pointerEvents="none"
          style={[
            styles.track,
            scrollbarContainerStyle,
            scrollbarTrackStyle,
            { backgroundColor: trackColor },
          ]}
        >
          <View
            style={[
              styles.thumb,
              scrollbarThumbStyle,
              {
                height: thumbHeight,
                transform: [{ translateY: thumbTop }],
                backgroundColor: thumbColor,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.pageBg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    flexGrow: 1,
  },
  track: {
    position: 'absolute',
    top: 8,
    right: 4,
    bottom: 8,
    width: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    borderRadius: 999,
    opacity: 0.92,
  },
});
