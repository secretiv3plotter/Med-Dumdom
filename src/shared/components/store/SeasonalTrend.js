import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function SeasonalTrend({
  imageSource,
  storeName = '',
  address = '',
  distance = '',
  likes = '',
  description = '',
  readMoreLabel = 'Read More',
  onPress = () => {},
  accessibilityLabel,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${storeName || 'Store'} card`}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ImageBackground source={imageSource} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.overlay}>
          <View style={styles.heroSpacer} />

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {address}
                  {!!distance ? ` • ${distance}` : ''}
                </Text>
              </View>

              {!!likes && (
                <View style={styles.likesBlock}>
                  <View style={styles.likesRow}>
                    <Ionicons name="thumbs-up" size={14} color={colors.brand} />
                    <Text style={styles.likesValue}>{likes}</Text>
                  </View>
                  <Text style={styles.likesLabel}>Likes This</Text>
                </View>
              )}
            </View>

            {!!description && (
              <Text style={styles.description} numberOfLines={3}>
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
    flexBasis: '48%',
    maxWidth: moderateScale(260),
    minWidth: moderateScale(180),
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    aspectRatio: 0.8,
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
    backgroundColor: 'rgba(14, 14, 14, 0.42)',
    justifyContent: 'space-between',
  },
  heroSpacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleLayoutValue(spacing.md),
    paddingTop: scaleLayoutValue(spacing.sm),
    paddingBottom: scaleLayoutValue(spacing.md),
    gap: scaleLayoutValue(spacing.xs),
    backgroundColor: 'rgba(12, 12, 12, 0.5)',
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
  address: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
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
  likesLabel: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: scaleLayoutValue(11),
  },
  description: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: scaleLayoutValue(18),
  },
  readMore: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
});
