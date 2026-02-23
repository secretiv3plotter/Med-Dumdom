//variants: default, offLocked
import { Pressable, StyleSheet, View } from 'react-native';
import { colors,spacing } from '../../constants/Themes';

export default function ToggleButton({
  value = false,
  onChange = () => {},
  size = 40,
  theme = {},
  variant = 'default',
}) {
  const t = { ...colors, ...theme };
  const isLockedOff = variant === 'offLocked';
  const isOn = isLockedOff ? false : value;
  const background = isOn ? t.brand : t.border;
  const trackColor = isOn ? t.brandText : t.border;
  const knobSize = size - spacing.xs;
  const trackWidth = size * 2.2;
  const knobTravel = trackWidth - knobSize - 4;

  return (
    <Pressable
      disabled={isLockedOff}
      onPress={() => onChange(!isOn)}
      style={[styles.wrapper, { width: trackWidth, height: size, opacity: isLockedOff ? 0.7 : 1 }]}
    >
      <View style={[styles.track, { backgroundColor: background, borderColor: trackColor, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.knob,
            {
              backgroundColor: t.surface,
              transform: [{ translateX: isOn ? knobTravel : 0 }],
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center' },
  track: {
    flex: 1,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  knob: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
