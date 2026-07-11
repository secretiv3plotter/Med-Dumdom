import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accessibility, colors, moderateScale, radius, spacing, typography } from '../../theme';
import { scaleLayoutValue } from '../../theme/textScale';

export default function TrendingStore({
  imageSource,
  storeName = '',
  address = '',
  rating = '',
  ratingLabel = '',
  distance = '',
  ctaLabel = 'View More',
  onPress = () => {},
  accessibilityLabel,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="storefront-outline" size={36} color={colors.bodyMuted} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <Text style={styles.storeName} numberOfLines={1}>
            {storeName}
          </Text>

          {!!address && (
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          )}

          <View style={styles.metaRow}>
            {!!rating && (
              <View style={styles.metaItem}>
                <Ionicons name="thumbs-up" size={14} color={colors.brand} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {rating}
                </Text>
                {!!ratingLabel && <Text style={styles.metaMuted}>({ratingLabel})</Text>}
              </View>
            )}

            {!!distance && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={14} color={colors.brand} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {distance}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `${storeName || 'Store'} ${ctaLabel}`}
          onPress={onPress}
          unstable_pressDelay={0}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(12, 12, 12, 0.7)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.35,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  content: {
    paddingHorizontal: scaleLayoutValue(spacing.md),
    paddingTop: scaleLayoutValue(spacing.sm),
    paddingBottom: scaleLayoutValue(spacing.md),
    gap: scaleLayoutValue(spacing.sm),
  },
  copyBlock: {
    gap: scaleLayoutValue(spacing.xxs),
  },
  storeName: {
    ...typography.titleSmall,
    color: colors.surface,
    fontWeight: '700',
  },
  address: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scaleLayoutValue(spacing.sm),
    marginTop: scaleLayoutValue(spacing.xxs),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleLayoutValue(spacing.xxs),
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
  metaMuted: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  button: {
    minHeight: scaleLayoutValue(accessibility.minTouchTarget),
    alignSelf: 'center',
    minWidth: scaleLayoutValue(moderateScale(116)),
    paddingHorizontal: scaleLayoutValue(spacing.lg),
    paddingVertical: scaleLayoutValue(spacing.xs),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    borderColor: colors.brandText,
  },
  buttonText: {
    ...typography.button,
    color: colors.brand,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
