import { View, StyleSheet } from 'react-native';
import ActionButton from './ActionButton'; //Sample Button
//add another here
import { spacing, colors as defaultColors, radius } from '../../constants/Themes'; 

export default function TabBar({ tabs = [], activeTab = -1, onTabPress = () => {}, theme = {} }) {
  const slots = tabs.filter((tab) => typeof tab === 'string' && tab.length > 0);
  const merged = { ...defaultColors, ...theme };

  const containerTheme = { backgroundColor: 'transparent', borderRadius: radius.lg };

  return (
    <View style={[styles.container, containerTheme]}>
      {slots.map((tab, index) => (
        <ActionButton
          key={`${tab}-${index}`}
          label={tab}
          onPress={() => onTabPress(index)}
          variant="outline"
          style={[
            styles.button,
            { backgroundColor: 'transparent' },
            activeTab === index && {
              backgroundColor: 'transparent',
              borderColor: merged.brand,
              borderWidth: 2,
            },
          ]}
          textStyle={activeTab === index ? { color: merged.brandText } : undefined}
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