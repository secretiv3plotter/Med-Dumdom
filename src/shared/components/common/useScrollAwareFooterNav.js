import { useCallback, useMemo, useRef, useState } from 'react';

const DEFAULT_SCROLL_THRESHOLD = 8;

export default function useScrollAwareFooterNav({ threshold = DEFAULT_SCROLL_THRESHOLD } = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const metricsRef = useRef({
    contentHeight: 0,
    viewportHeight: 0,
    scrollY: 0,
    lastKnownY: 0,
  });

  const setVisible = useCallback((nextVisible) => {
    setIsVisible((current) => (current === nextVisible ? current : nextVisible));
  }, []);

  const updateVisibilityFromScroll = useCallback(
    (scrollY) => {
      const nextY = Math.max(0, Math.round(scrollY));
      const metrics = metricsRef.current;
      const isScrollable = metrics.contentHeight - metrics.viewportHeight > 1;

      metrics.scrollY = nextY;

      if (!isScrollable) {
        metrics.lastKnownY = nextY;
        setVisible(true);
        return;
      }

      const delta = nextY - metrics.lastKnownY;
      if (nextY <= threshold) {
        setVisible(true);
      } else if (delta > 0) {
        setVisible(false);
      } else if (delta < 0) {
        setVisible(true);
      }

      metrics.lastKnownY = nextY;
    },
    [setVisible, threshold]
  );

  const onLayout = useCallback((event) => {
    const viewportHeight = Math.round(event.nativeEvent.layout.height);
    const metrics = metricsRef.current;
    metrics.viewportHeight = viewportHeight;

    if (metrics.contentHeight - metrics.viewportHeight <= 1) {
      setVisible(true);
    }
  }, [setVisible]);

  const onContentSizeChange = useCallback((width, height) => {
    const contentHeight = Math.round(height);
    const metrics = metricsRef.current;
    metrics.contentHeight = contentHeight;

    if (metrics.contentHeight - metrics.viewportHeight <= 1) {
      setVisible(true);
    }
  }, [setVisible]);

  const onScroll = useCallback((event) => {
    updateVisibilityFromScroll(event.nativeEvent.contentOffset.y);
  }, [updateVisibilityFromScroll]);

  return useMemo(() => ({
    isVisible,
    isScrollable: metricsRef.current.contentHeight - metricsRef.current.viewportHeight > 1,
    onLayout,
    onContentSizeChange,
    onScroll,
  }), [isVisible, onLayout, onContentSizeChange, onScroll]);
}
