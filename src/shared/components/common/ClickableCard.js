//2 sizes: landscape and portrait 
// variants: solid, ghost

import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { accessibility, colors, getFontSize, getLineHeight, moderateScale, radius, spacing, typography } from '../../theme';

function isBoldStyle(style) {
  const flattened = StyleSheet.flatten(style);
  const weight = flattened?.fontWeight;

  if (!weight) {
    return false;
  }

  if (typeof weight === 'number') {
    return weight >= 600;
  }

  const normalized = String(weight).toLowerCase();
  if (normalized === 'bold') {
    return true;
  }
  if (normalized === 'normal') {
    return false;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed >= 600 : false;
}

function shouldApplyBoldStyle(style, minSize) {
  const flattened = StyleSheet.flatten(style);
  const fontSize = flattened?.fontSize;

  if (!fontSize) {
    return true;
  }

  return fontSize < minSize;
}

function forceBoldTextStyle(node, boldStyle) {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

  const isText = child.type === Text;
  const nextChildren =
    child.props && child.props.children
      ? forceBoldTextStyle(child.props.children, boldStyle)
      : child.props?.children;

  const nextProps = {};

  if (isText && isBoldStyle(child.props?.style) && shouldApplyBoldStyle(child.props?.style, boldStyle.fontSize)) {
    nextProps.style = child.props?.style ? [child.props.style, boldStyle] : boldStyle;
  }

  if (nextChildren !== child.props?.children) {
    nextProps.children = nextChildren;
  }

  return React.cloneElement(child, nextProps);
  });
}

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
  const forcedLeftSlot = forceBoldTextStyle(leftSlot, styles.boldText);
  const titleIsBold = isBoldStyle([styles.title, titleStyle]);
  const shouldLockTitleSize = shouldApplyBoldStyle([styles.title, titleStyle], styles.boldText.fontSize);

  // Dynamic font sizing & line-height calculation to prevent long words from breaking/cropping
  const baseTitleStyle = StyleSheet.flatten([styles.title, titleStyle]);
  
  // Extract fontSize safely, converting relative rem to numeric if parsed as a string on Web
  let baseFontSize = 16;
  if (baseTitleStyle?.fontSize) {
    if (typeof baseTitleStyle.fontSize === 'string') {
      const parsedRem = parseFloat(baseTitleStyle.fontSize);
      baseFontSize = Number.isFinite(parsedRem) ? parsedRem * 16 : 16;
    } else {
      baseFontSize = baseTitleStyle.fontSize;
    }
  }

  let dynamicFontSize = baseFontSize;

  if (title && title.length > 10) {
    if (size === 'portrait') {
      // For narrow grid cards, scale down long titles/words dynamically to keep them clean
      dynamicFontSize = Math.max(13, baseFontSize * 0.72); 
    }
  }

  // Format final styles using relative rem on Web or raw pixels on Mobile
  const finalFontSize = getFontSize(dynamicFontSize);
  const finalLineHeight = getLineHeight(
    baseTitleStyle?.lineHeight 
      ? Math.round(baseTitleStyle.lineHeight * (dynamicFontSize / baseFontSize)) 
      : Math.round(dynamicFontSize * 1.25)
  );

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
            {!!leftSlot ? (
              forcedLeftSlot
            ) : (
              !!icon && <Text style={[styles.icon, iconStyle, styles.iconLock]}>{icon}</Text>
            )}
          </View>
          <View style={styles.slot}>{rightSlot}</View>
        </View>
      ) : null}

      <View style={styles.textBlock}>
        {!!title && (
          <Text
            style={[
              styles.title,
              titleStyle,
              titleIsBold && styles.titleLock,
              titleIsBold && shouldLockTitleSize && styles.boldText,
              { fontSize: finalFontSize, lineHeight: finalLineHeight }
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {title}
          </Text>
        )}
        {!!subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
        {!!details && <Text style={[styles.details, detailsStyle]}>{details}</Text>}
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      unstable_pressDelay={0}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title || subtitle || 'Card button'}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        isLandscape ? styles.landscape : styles.portrait,
        isGhost ? styles.ghost : styles.solid,
        cardStyle,
        styles.surface,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
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
      <View pointerEvents="none" style={styles.borderOverlay} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: accessibility.minTouchTarget,
    overflow: 'hidden',
    position: 'relative',
  },
  portrait: {
    minHeight: moderateScale(190),
  },
  landscape: {
    minHeight: moderateScale(140),
  },
  solid: {
    backgroundColor: colors.brandSoft,
  },
  ghost: {
    backgroundColor: colors.brandSoft,
  },
  surface: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.xl,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.xl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
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
    fontSize: getFontSize(32),
    lineHeight: getLineHeight(34),
    color: colors.brandText,
  },
  iconLock: {
    color: colors.brandText,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.brandText,
    flexShrink: 1,
  },
  titleLock: {
    color: colors.brandText,
  },
  boldText: {
    color: colors.brandText,
    fontSize: getFontSize(18),
    lineHeight: getLineHeight(24),
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
    backgroundColor: '#C7DBFF',
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
