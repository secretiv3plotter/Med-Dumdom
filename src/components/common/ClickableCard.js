//2 sizes: landscape and portrait 
// variants: solid, ghost

import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, radius, spacing, typography } from '../../constants/Themes';

export default function ClickableCard({
  title = '',
  subtitle = '',
  details = '',
  accessibilityLabel,
  icon = '',
  onPress = () => {},
  size = 'portrait', // 'portrait' | 'landscape'
  variant = 'solid', // 'solid' | 'ghost'
  disabled = false,
  ghostInteractive = false,
  imageSource,
  cardStyle,
  contentStyle,
  overlayStyle,
  iconStyle,
  titleStyle,
  subtitleStyle,
  detailsStyle,
  leftSlot,
  rightSlot,
}) {
  const isLandscape = size === 'landscape';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || (isGhost && !ghostInteractive);
  const hasImage = Boolean(imageSource);

  const content = (
    <View
      style={[
        styles.content,
        isLandscape ? styles.landscapeContent : styles.portraitContent,
        hasImage && styles.withImageContent,
        contentStyle,
      ]}
    >
      {!!leftSlot || !!icon || !!rightSlot ? (
        <View style={styles.topRow}>
          <View style={styles.slot}>
            {!!leftSlot ? leftSlot : !!icon && <Text style={[styles.icon, iconStyle]}>{icon}</Text>}
          </View>
          <View style={styles.slot}>{rightSlot}</View>
        </View>
      ) : null}

      <View style={styles.textBlock}>
        {!!title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
        {!!subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
        {!!details && <Text style={[styles.details, detailsStyle]}>{details}</Text>}
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title || subtitle || 'Card button'}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        isLandscape ? styles.landscape : styles.portrait,
        isGhost ? styles.ghost : styles.solid,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        cardStyle,
      ]}
    >
      {hasImage ? (
        <ImageBackground source={imageSource} style={styles.imageFill} imageStyle={styles.imageStyle}>
          <View style={[styles.imageOverlay, isGhost ? styles.ghostOverlay : styles.solidOverlay, overlayStyle]}>
            {content}
          </View>
        </ImageBackground>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: accessibility.minTouchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  portrait: {
    minHeight: 190,
  },
  landscape: {
    minHeight: 140,
  },
  solid: {
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: '#BCC2C9',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  withImageContent: {
    justifyContent: 'space-between',
  },
  landscapeContent: {
    justifyContent: 'space-between',
  },
  portraitContent: {
    justifyContent: 'flex-end',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slot: {
    minHeight: 24,
    minWidth: 24,
  },
  icon: {
    fontSize: 32,
    lineHeight: 34,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.body,
    marginTop: 2,
    flexShrink: 1,
  },
  details: {
    ...typography.bodySmall,
    color: colors.bodyMuted,
    marginTop: spacing.xs,
    fontWeight: '700',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
  imageFill: {
    flex: 1,
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    flex: 1,
  },
  ghostOverlay: {
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  solidOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
