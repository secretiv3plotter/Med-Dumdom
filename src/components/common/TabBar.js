import { View, StyleSheet } from 'react-native';
import ActionButton from './ActionButton'; //Sample Button
//add another here
import { spacing, colors as defaultColors, radius } from '../../constants/Themes'; 

export default function TabBar({ tabs = [], activeTab = -1, onTabPress = () => {}, theme = {} }) {
  const maxSlots = 5;
  const slots = Array.from({ length: maxSlots }).map((_, i) => tabs[i] ?? null);
  const merged = { ...defaultColors, ...theme };

  const containerTheme = { backgroundColor: merged.surface, borderTopColor: merged.border, borderTopWidth: 1, borderRadius: radius.lg };

  return (
    <View style={[styles.container, containerTheme]}>
      {slots.map((tab, index) => (
        <ActionButton
          key={index}
          label={tab ?? ''}
          onPress={() => onTabPress(index)}
          variant={activeTab === index ? 'solid' : 'outline'}
          brandColor={merged.brand}
          surfaceColor={merged.surface}
          style={styles.button}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs / 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});


