import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform, Vibration } from 'react-native';
import { useTextScale } from '../theme/textScale';

const WEB_IMPACT_PATTERNS = {
  [Haptics.ImpactFeedbackStyle.Light]: 10,
  [Haptics.ImpactFeedbackStyle.Medium]: 20,
  [Haptics.ImpactFeedbackStyle.Heavy]: 30,
  [Haptics.ImpactFeedbackStyle.Rigid]: 15,
  [Haptics.ImpactFeedbackStyle.Soft]: 8,
};

function vibrateFallback(pattern) {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
      return true;
    }
    Vibration.vibrate(pattern);
    return true;
  }

  Vibration.vibrate(pattern);
  return true;
}

export function useHapticFeedback() {
  const { hapticEnabled } = useTextScale();

  const triggerImpact = useCallback((style = Haptics.ImpactFeedbackStyle.Light) => {
    if (!hapticEnabled) {
      return;
    }

    if (Platform.OS === 'web') {
      const pattern = WEB_IMPACT_PATTERNS[style] ?? WEB_IMPACT_PATTERNS[Haptics.ImpactFeedbackStyle.Light];
      vibrateFallback(pattern);
      return;
    }

    Haptics.impactAsync(style).catch(() => {
      vibrateFallback(10);
    });
  }, [hapticEnabled]);

  const triggerSuccess = useCallback(() => {
    if (!hapticEnabled) {
      return;
    }

    if (Platform.OS === 'web') {
      vibrateFallback([10, 40, 15]);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      vibrateFallback([10, 40, 15]);
    });
  }, [hapticEnabled]);

  const triggerError = useCallback(() => {
    if (!hapticEnabled) {
      return;
    }

    if (Platform.OS === 'web') {
      vibrateFallback([20, 40, 20, 40, 20]);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
      vibrateFallback([20, 40, 20, 40, 20]);
    });
  }, [hapticEnabled]);

  return { triggerImpact, triggerSuccess, triggerError };
}
