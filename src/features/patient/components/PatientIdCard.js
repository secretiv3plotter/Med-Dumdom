import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getFontSize, getLineHeight, moderateScale, radius, spacing } from '../../../shared/theme';
import { useTextScale } from '../../../shared/theme/textScale';

const logoSource = require('../../../assets/splash-icon.png');
const addFieldPlaceholder = 'Not provided';
export const missingBirthdatePlaceholder = 'Not provided';

const wideProfileSpacingStart = 525;
const maxWideProfileSpacing = moderateScale(28);

const profileGradientStops = [
  '#FFFFFF', '#FFFFFF', '#FCFEFF', '#F8FCFE', '#F4FAFD', '#F0F8FC', '#ECF6FB',
  '#E8F5FA', '#E3F2F8', '#DFF0F7', '#DBEEF6', '#D7ECF5', '#D3EAF4', '#D0E8F3',
  '#CDE7F2', '#CAE5F1', '#C7E3EF', '#C4E1EE',
];

const darkProfileGradientStops = [
  '#1A2B35', '#1A2B35', '#192A34', '#182933', '#172832', '#162731', '#152630',
  '#14252F', '#13242E', '#12232D', '#11222C', '#10212B', '#0F202A', '#0E1F29',
  '#0D1E28', '#0C1D27', '#0B1C26', '#0A1B25',
];

export const getWideProfileSpacing = (width) =>
  Math.min(maxWideProfileSpacing, Math.max(0, width - wideProfileSpacingStart) * 0.08);

export const getInitials = (name) =>
  String(name || 'Patient')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';

const parseBirthdate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatBirthdate = (value) => {
  if (!value) return missingBirthdatePlaceholder;
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const parsed = parseBirthdate(value);
  if (!parsed) return missingBirthdatePlaceholder;
  return parsed.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

function ProfileCardGradient({ darkMode }) {
  const stops = darkMode ? darkProfileGradientStops : profileGradientStops;
  return (
    <View pointerEvents="none" style={styles.profileGradient}>
      {stops.map((color, index) => (
        <View
          key={color + index}
          style={[
            styles.profileGradientStop,
            {
              top: `${(index / stops.length) * 100}%`,
              height: `${100 / stops.length + 0.8}%`,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function PatientIdCard({ name, birthdate, imageSource, isEmpty, isCompact, wideSpacing = 0, onPress }) {
  const { darkModeEnabled, colorBlindModeEnabled } = useTextScale();
  const logoTintColor = colorBlindModeEnabled
    ? (darkModeEnabled ? '#56B4E9' : '#0072B2')
    : undefined;
  const displayName = isEmpty ? addFieldPlaceholder : name;
  const profileWideStyle = wideSpacing ? { paddingHorizontal: spacing.md + wideSpacing } : null;
  const profileContentWideStyle = wideSpacing ? { gap: spacing.sm + wideSpacing * 1.45 } : null;
  const avatarBlockWideStyle = wideSpacing ? { width: moderateScale(96) + wideSpacing * 0.6 } : null;
  const avatarFrameWideStyle = wideSpacing ? {
    width: moderateScale(84) + wideSpacing * 0.6,
    height: moderateScale(84) + wideSpacing * 0.6,
    borderRadius: (moderateScale(84) + wideSpacing * 0.6) / 2,
    padding: spacing.xs + wideSpacing * 0.3,
  } : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile ID card for ${name}`}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [
        styles.profileCard,
        darkModeEnabled && styles.profileCardDark,
        isCompact && styles.profileCardCompact,
        profileWideStyle,
        pressed && styles.profileCardPressed,
      ]}
    >
      <ProfileCardGradient darkMode={darkModeEnabled} />
      <View style={[styles.idAccentBar, darkModeEnabled && styles.idAccentBarDark]} />

      <View style={[styles.idHeader, isCompact && styles.idHeaderCompact]}>
        <Image source={logoSource} style={[styles.logo, isCompact && styles.logoCompact, logoTintColor && { tintColor: logoTintColor }]} resizeMode="contain" />
      </View>

      <View style={[styles.profileContent, profileContentWideStyle, isCompact && styles.profileContentCompact]}>
        <View style={[styles.avatarBlock, avatarBlockWideStyle, isCompact && styles.avatarBlockCompact]}>
          <View style={[styles.avatarFrame, darkModeEnabled && styles.avatarFrameDark, avatarFrameWideStyle, isCompact && styles.avatarFrameCompact]}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={[styles.avatarImage, isCompact && styles.avatarImageCompact]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarFallback, darkModeEnabled && styles.avatarFallbackDark]}>
                <Text style={[styles.avatarInitials, darkModeEnabled && styles.avatarInitialsDark, isCompact && styles.avatarInitialsCompact]}>
                  {isEmpty ? '+' : getInitials(name)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.avatarLabel, darkModeEnabled && styles.avatarLabelDark, isCompact && styles.avatarLabelCompact]}>
            {isEmpty ? 'EDIT PROFILE' : 'PROFILE'}
          </Text>
        </View>

        <View style={[styles.identityBlock, isCompact && styles.identityBlockCompact]}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, darkModeEnabled && styles.detailLabelDark, isCompact && styles.detailLabelCompact]}>NAME</Text>
            <Text
              style={[styles.detailValue, darkModeEnabled && styles.detailValueDark, isEmpty && styles.detailPlaceholder, isCompact && styles.detailValueCompact]}
              numberOfLines={2}
            >
              {displayName}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, darkModeEnabled && styles.detailLabelDark, isCompact && styles.detailLabelCompact]}>BIRTHDATE</Text>
            <Text
              style={[
                styles.detailValue,
                darkModeEnabled && styles.detailValueDark,
                birthdate === missingBirthdatePlaceholder && styles.detailPlaceholder,
                isCompact && styles.detailValueCompact,
              ]}
              numberOfLines={2}
            >
              {birthdate}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flex: 1,
    minHeight: moderateScale(200),
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#B7C8D1',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    shadowColor: '#1D4B60',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  profileCardCompact: {
    alignSelf: 'stretch',
    width: '100%',
    minHeight: moderateScale(270),
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  profileCardDark: {
    backgroundColor: '#1A2B35',
    borderColor: '#2D4A5A',
    shadowColor: '#000000',
  },
  profileCardPressed: {
    borderColor: '#5CBF92',
  },
  idAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: moderateScale(9),
    backgroundColor: '#BDE7D2',
  },
  idAccentBarDark: {
    backgroundColor: '#1B4A38',
  },
  profileGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  profileGradientStop: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  idHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 1,
    marginBottom: spacing.md,
  },
  idHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logo: {
    width: moderateScale(190),
    height: moderateScale(38),
    zIndex: 1,
  },
  logoCompact: {
    width: moderateScale(152),
  },
  profileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 1,
  },
  profileContentCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  avatarBlock: {
    width: moderateScale(96),
    alignItems: 'center',
    gap: spacing.xxs,
  },
  avatarBlockCompact: {
    width: moderateScale(100),
  },
  avatarFrame: {
    width: moderateScale(84),
    height: moderateScale(84),
    borderRadius: moderateScale(42),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C3D2DA',
    padding: spacing.xs,
    shadowColor: '#1D4B60',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  avatarFrameCompact: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(42),
  },
  avatarImageCompact: {
    borderRadius: moderateScale(39),
  },
  avatarFrameDark: {
    backgroundColor: '#1A2B35',
    borderColor: '#2D4A5A',
  },
  avatarFallback: {
    flex: 1,
    borderRadius: moderateScale(54),
    backgroundColor: '#EEF6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackDark: {
    backgroundColor: '#1E3545',
  },
  avatarInitials: {
    color: '#365F72',
    fontSize: getFontSize(34),
    lineHeight: getLineHeight(40),
    fontWeight: '700',
  },
  avatarInitialsCompact: {
    fontSize: getFontSize(28),
    lineHeight: getLineHeight(34),
  },
  avatarInitialsDark: {
    color: '#A0C8D8',
  },
  avatarLabel: {
    color: '#4D6876',
    fontSize: getFontSize(12),
    lineHeight: getLineHeight(16),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  avatarLabelCompact: {
    fontSize: getFontSize(11),
  },
  identityBlock: {
    flex: 1,
    alignItems: 'stretch',
    minWidth: 0,
  },
  identityBlockCompact: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  detailItem: {
    marginBottom: spacing.sm,
  },
  avatarLabelDark: {
    color: '#7A9BAB',
  },
  detailLabel: {
    color: '#6A7F89',
    fontSize: getFontSize(11),
    lineHeight: getLineHeight(15),
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  detailLabelDark: {
    color: '#7A9BAB',
  },
  detailValue: {
    color: '#263F4C',
    fontSize: getFontSize(15),
    lineHeight: getLineHeight(20),
    fontWeight: '700',
  },
  detailValueDark: {
    color: '#D0E8F3',
  },
  detailPlaceholder: {
    color: '#6A7F89',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  detailLabelCompact: {
    textAlign: 'center',
  },
  detailValueCompact: {
    textAlign: 'center',
  },
});
