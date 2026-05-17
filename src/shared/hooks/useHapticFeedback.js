import * as Haptics from 'expo-haptics';
import { useTextScale } from '../theme/textScale';

export function useHapticFeedback() {
  const { hapticEnabled } = useTextScale();

  const triggerImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const triggerSuccess = () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const triggerError = () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  return { triggerImpact, triggerSuccess, triggerError };
}
