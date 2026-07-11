import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function StoreAd({
  imageSource,
  storeName = '',
  address = '',
  distance = '',
  likes = '',
  votes = '',
  description = '',
  readMoreLabel = 'Read More',
  onPress = () => {},
  accessibilityLabel,
  compact = true,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${storeName || 'Store'} card`}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.fullCard,
        pressed && styles.pressed,
      ]}
    >
      <ImageBackground source={imageSource} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.overlay}>
          <View style={styles.topSpacer} />

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {storeName}
                </Text>

                <View style={styles.subInfoRow}>
                  {!!address && (
                    <Text style={styles.subInfo} numberOfLines={1}>
                      {address}
                      {!!distance ? ` • ${distance}` : ''}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.likesBlock}>
                <View style={styles.likesRow}>
                  <Ionicons name="thumbs-up" size={14} color={colors.brand} />
                  <Text style={styles.likesValue}>{likes}</Text>
                </View>
                {!!votes && <Text style={styles.votes}>{votes} Votes</Text>}
              </View>
            </View>

            {!!description && (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            )}

            <Text style={styles.readMore}>{readMoreLabel}</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  compactCard: {
    width: '48%',
    minWidth: moderateScale(280),
    maxWidth: moderateScale(520),
    aspectRatio: 1.55,
  },
  fullCard: {
    width: '100%',
    minHeight: moderateScale(280),
  },
  pressed: {
    opacity: 0.92,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 10, 10, 0.42)',
  },
  topSpacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleLayoutValue(spacing.md),
    paddingTop: scaleLayoutValue(spacing.sm),
    paddingBottom: scaleLayoutValue(spacing.md),
    gap: scaleLayoutValue(spacing.xs),
    backgroundColor: 'rgba(10, 10, 10, 0.38)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: scaleLayoutValue(spacing.sm),
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: scaleLayoutValue(spacing.xxs),
  },
  storeName: {
    ...typography.titleSmall,
    color: colors.brand,
    fontWeight: '700',
  },
  subInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subInfo: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  likesBlock: {
    alignItems: 'flex-end',
    gap: scaleLayoutValue(2),
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleLayoutValue(spacing.xxs),
  },
  likesValue: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
  votes: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: scaleLayoutValue(11),
  },
  description: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: scaleLayoutValue(18),
  },
  readMore: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
});
