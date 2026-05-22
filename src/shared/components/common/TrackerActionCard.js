import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import {
  colors,
  moderateScale,
  radius,
  typography,
} from '../../theme';
import { useTextScale } from '../../theme/textScale';

const DEFAULT_ACTION_ICON_SIZE = moderateScale(18);

function Card({
  accent,
  title,
  statusLabel,
  content,
  buttonPosition = 'right',
  onPress,
  onAddPress,
}) {
  const hasContent = Boolean(content?.trim());

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && {
          transform: [{ scale: 0.98 }],
          shadowColor: accent,
          shadowOpacity: 0.9,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          elevation: 15,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.waveContainer}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Path
            d="
              M0,25
              C50,15 100,35 150,25
              C200,10 250,32 300,20
              C350,10 380,25 400,15
              L400,100
              L0,100
              Z"
            fill={accent}
            opacity={0.20}
          />

          <Path
            d="
              M0,38
              C50,28 100,48 150,38
              C200,22 250,46 300,32
              C350,22 380,38 400,28
              L400,100
              L0,100
              Z"
            fill={accent}
            opacity={0.45}
          />

          <Path
            d="
              M0,52
              C50,42 100,62 150,52
              C200,35 250,60 300,45
              C350,35 380,52 400,42
              L400,100
              L0,100
              Z"
            fill={accent}
            opacity={1}
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          {buttonPosition === 'left' && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: accent },
                pressed && {
                  shadowColor: accent,
                  shadowOpacity: 1,
                  shadowRadius: 14,
                  elevation: 15,
                  transform: [{ scale: 0.92 }],
                },
              ]}
              onPress={onAddPress}
            >
              <Ionicons
                name="add"
                size={DEFAULT_ACTION_ICON_SIZE}
                color={colors.title}
              />
            </Pressable>
          )}

          <Text
            style={[
              styles.title,
              buttonPosition === 'left' && styles.titleRight,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {buttonPosition === 'right' && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: accent },
                pressed && {
                  shadowColor: accent,
                  shadowOpacity: 1,
                  shadowRadius: 14,
                  elevation: 15,
                  transform: [{ scale: 0.92 }],
                },
              ]}
              onPress={onAddPress}
            >
              <Ionicons
                name="add"
                size={DEFAULT_ACTION_ICON_SIZE}
                color={colors.title}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.cardTextWrapper}>
          {hasContent && statusLabel ? (
            <>
              <Text style={styles.statusLabel}>{statusLabel}</Text>
              <Text style={styles.cardText} numberOfLines={3}>{content}</Text>
            </>
          ) : (
            <Text style={[styles.cardText, styles.placeholderText]} numberOfLines={4}>
              No updates available yet...
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function TrackerActionCard({
  medContent,
  medLabel,
  apptContent,
  apptLabel,
  onMedPress,
  onMedAddPress,
  onApptPress,
  onApptAddPress,
}) {
  const { colorBlindModeEnabled } = useTextScale();
  const apptAccent = colorBlindModeEnabled ? '#D55E00' : '#52b788';

  return (
    <View style={styles.container}>
      <Card
        accent="#0077b6"
        title={'Med\nTracker'}
        statusLabel={medLabel}
        content={medContent}
        buttonPosition="right"
        onPress={onMedPress}
        onAddPress={onMedAddPress}
      />

      <Card
        accent={apptAccent}
        title={'Appt\nTracker'}
        statusLabel={apptLabel}
        content={apptContent}
        buttonPosition="left"
        onPress={onApptPress}
        onAddPress={onApptAddPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },

  card: {
    flex: 1,
    height: 350,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.30)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  content: {
    flex: 1,
    padding: 14,
    zIndex: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 18,
  },

  title: {
    ...typography.titleSmall,
    flex: 1,
    fontWeight: '700',
    fontFamily: 'Helvetica',
    color: colors.title,
    lineHeight: 28,
  },

  titleRight: {
    textAlign: 'right',
  },

  cardTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },

  statusLabel: {
    ...typography.bodySmall,
    fontFamily: 'Helvetica',
    fontWeight: '700',
    color: colors.title,
    marginBottom: 6,
  },

  cardText: {
    ...typography.bodySmall,
    fontFamily: 'Helvetica',
    color: colors.body,
    lineHeight: 24,
  },

  placeholderText: {
    color: 'rgba(0,0,0,0.45)',
    fontStyle: 'italic',
  },

  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
  },

  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});