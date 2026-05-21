import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getFontSize, getLineHeight, moderateScale, radius, spacing } from '../../../shared/theme';

const logoSource = require('../../../assets/splash-icon.png');
const actionColor = '#475568';
const headerActionIconSize = moderateScale(30);
const helpIconSize = moderateScale(34);
const wideProfileSpacingStart = 525;
const maxWideProfileSpacing = moderateScale(28);
const addFieldPlaceholder = 'Not provided';
const missingBirthdatePlaceholder = 'Not provided';

const profileGradientStops = [
  '#FFFFFF',
  '#FFFFFF',
  '#FCFEFF',
  '#F8FCFE',
  '#F4FAFD',
  '#F0F8FC',
  '#ECF6FB',
  '#E8F5FA',
  '#E3F2F8',
  '#DFF0F7',
  '#DBEEF6',
  '#D7ECF5',
  '#D3EAF4',
  '#D0E8F3',
  '#CDE7F2',
  '#CAE5F1',
  '#C7E3EF',
  '#C4E1EE',
];

export default function MockDashboardPreview({
  profile = null,
  profileName = 'Janna Alexa Gutierrez',
  birthdate = '2004-03-15',
  profileImageSource = null,
  onSettingsPress = () => {},
  onHelpPress = () => {},
  onProfilePress = () => {},
  onMedTrackerPress = () => {},
  onAppointmentTrackerPress = () => {},
  showTrackers = true,
  style,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 385;
  const wideProfileSpacing = getWideProfileSpacing(width);

  const hasProfile = profile !== null && profile !== undefined;
  const resolvedName = getProfileName(profile, hasProfile ? 'Patient' : profileName);
  const resolvedBirthdateValue = getProfileBirthdate(profile, hasProfile ? null : birthdate);
  const resolvedBirthdate = formatBirthdate(resolvedBirthdateValue);
  const resolvedImageSource = getProfileImageSource(profile, profileImageSource);
  const isProfileEmpty = hasProfile && !hasAnyProfileInfo(profile);

  return (
    <View style={[styles.screen, isCompact && styles.screenCompact, style]}>
      <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
        {isCompact && (
          <View style={[styles.actionRail, styles.actionRailCompact]}> 
            <DashboardAction
              label="Settings"
              iconName="settings-outline"
              iconSize={headerActionIconSize}
              isCompact={isCompact}
              onPress={onSettingsPress}
            />
            <DashboardAction
              label="Help"
              iconName="help-circle-outline"
              iconSize={helpIconSize}
              isCompact={isCompact}
              onPress={onHelpPress}
            />
          </View>
        )}

        <PatientIdCard
          name={resolvedName}
          birthdate={resolvedBirthdate}
          imageSource={resolvedImageSource}
          isEmpty={isProfileEmpty}
          isCompact={isCompact}
          wideSpacing={wideProfileSpacing}
          onPress={onProfilePress}
        />

        {!isCompact && (
          <View style={styles.actionRail}>
            <DashboardAction
              label="Settings"
              iconName="settings-outline"
              iconSize={headerActionIconSize}
              onPress={onSettingsPress}
            />
            <DashboardAction
              label="Help"
              iconName="help-circle-outline"
              iconSize={helpIconSize}
              onPress={onHelpPress}
            />
          </View>
        )}
      </View>

      {showTrackers ? (
        <View style={[styles.trackerGrid, isCompact && styles.trackerGridCompact]}>
          <TrackerMockCard
            title="Med Tracker"
            accentColor={styles.blueAccent.backgroundColor}
            onPress={onMedTrackerPress}
          />
          <TrackerMockCard
            title="Appt Tracker"
            accentColor={styles.greenAccent.backgroundColor}
            alignTitleRight
            onPress={onAppointmentTrackerPress}
          />
        </View>
      ) : null}
    </View>
  );
}

function getWideProfileSpacing(width) {
  return Math.min(maxWideProfileSpacing, Math.max(0, width - wideProfileSpacingStart) * 0.08);
}

function getProfileName(profile, fallbackName) {
  return String(profile?.fullName || profile?.name || fallbackName || 'Patient').trim() || 'Patient';
}

function getProfileBirthdate(profile, fallbackBirthdate) {
  return profile?.birthDate || profile?.birthdate || fallbackBirthdate || null;
}

function hasAnyProfileInfo(profile) {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  return Boolean(
    String(profile.fullName || profile.name || '').trim() ||
      profile.birthDate ||
      profile.birthdate ||
      String(profile.profilePicture || profile.profilePictureUrl || '').trim() ||
      (Number.isInteger(Number(profile.age)) && Number(profile.age) > 0)
  );
}

function getProfileImageSource(profile, explicitImageSource) {
  if (explicitImageSource) {
    return explicitImageSource;
  }

  const picture = String(profile?.profilePicture || profile?.profilePictureUrl || '').trim();
  return picture ? { uri: picture } : null;
}

function formatBirthdate(value) {
  if (!value) {
    return missingBirthdatePlaceholder;
  }

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const parsed = parseBirthdate(value);

  if (!parsed) {
    return missingBirthdatePlaceholder;
  }

  return parsed.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function parseBirthdate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

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
}

function getInitials(name) {
  return String(name || 'Patient')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';
}

function PatientIdCard({ name, birthdate, imageSource, isEmpty, isCompact, wideSpacing = 0, onPress }) {
  const displayName = isEmpty ? addFieldPlaceholder : name;
  const profileWideStyle = wideSpacing
    ? {
        paddingHorizontal: spacing.md + wideSpacing,
      }
    : null;
  const profileContentWideStyle = wideSpacing
    ? {
        gap: spacing.sm + wideSpacing * 1.45,
      }
    : null;
  const avatarBlockWideStyle = wideSpacing
    ? {
        width: moderateScale(96) + wideSpacing * 0.6,
      }
    : null;
  const avatarFrameWideStyle = wideSpacing
    ? {
        width: moderateScale(84) + wideSpacing * 0.6,
        height: moderateScale(84) + wideSpacing * 0.6,
        borderRadius: (moderateScale(84) + wideSpacing * 0.6) / 2,
        padding: spacing.xs + wideSpacing * 0.3,
      }
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile ID card for ${name}`}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [
        styles.profileCard,
        isCompact && styles.profileCardCompact,
        profileWideStyle,
        pressed && styles.profileCardPressed,
      ]}
    >
      <ProfileCardGradient />
      <View style={styles.idAccentBar} />

      <View style={[styles.idHeader, isCompact && styles.idHeaderCompact]}>
        <Image source={logoSource} style={[styles.logo, isCompact && styles.logoCompact]} resizeMode="contain" />
      </View>

      <View style={[styles.profileContent, profileContentWideStyle, isCompact && styles.profileContentCompact]}>
        <View style={[styles.avatarBlock, avatarBlockWideStyle, isCompact && styles.avatarBlockCompact]}>
          <View style={[styles.avatarFrame, avatarFrameWideStyle, isCompact && styles.avatarFrameCompact]}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={[styles.avatarImage, isCompact && styles.avatarImageCompact]}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={[styles.avatarInitials, isCompact && styles.avatarInitialsCompact]}>{isEmpty ? '+' : getInitials(name)}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.avatarLabel, isCompact && styles.avatarLabelCompact]}>{isEmpty ? 'EDIT PROFILE' : 'PROFILE'}</Text>
        </View>

        <View style={[styles.identityBlock, isCompact && styles.identityBlockCompact]}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>NAME</Text>
            <Text style={[styles.detailValue, isEmpty && styles.detailPlaceholder, isCompact && styles.detailValueCompact]} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>BIRTHDATE</Text>
            <Text
              style={[
                styles.detailValue,
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

function ProfileCardGradient() {
  return (
    <View pointerEvents="none" style={styles.profileGradient}>
      {profileGradientStops.map((color, index) => (
        <View
          key={color + index}
          style={[
            styles.profileGradientStop,
            {
              top: `${(index / profileGradientStops.length) * 100}%`,
              height: `${100 / profileGradientStops.length + 0.8}%`,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

function DashboardAction({ iconName, iconSize, label, isCompact = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [
        styles.actionButton,
        isCompact && styles.actionButtonCompact,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <View style={[styles.actionIconWrap, isCompact && styles.actionIconWrapCompact]}>
        <Ionicons name={iconName} size={iconSize} color={actionColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function TrackerMockCard({ title, accentColor, alignTitleRight = false, onPress }) {
  const [firstWord, secondWord] = title.split(' ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      unstable_pressDelay={0}
      style={({ pressed }) => [styles.trackerCard, pressed && styles.trackerCardPressed]}
    >
      <View style={styles.trackerTopRow}>
        {!alignTitleRight && (
          <Text style={styles.trackerTitle}>
            {firstWord}
            {'\n'}
            {secondWord}
          </Text>
        )}
        <View style={[styles.addButton, { backgroundColor: accentColor }]}>
          <Text style={styles.addButtonText}>+</Text>
        </View>
        {alignTitleRight && (
          <Text style={[styles.trackerTitle, styles.trackerTitleRight]}>
            {firstWord}
            {'\n'}
            {secondWord}
          </Text>
        )}
      </View>

      <Text style={styles.emptyText}>
        No updates
        {'\n'}
        available yet...
      </Text>

      <WaveBand color={accentColor} />
    </Pressable>
  );
}

function WaveBand({ color }) {
  return (
    <View pointerEvents="none" style={styles.waveWrap}>
      <View style={[styles.wave, styles.waveBack, { backgroundColor: color }]} />
      <View style={[styles.wave, styles.waveMiddle, { backgroundColor: color }]} />
      <View style={[styles.wave, styles.waveFront, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  screenCompact: {
    paddingHorizontal: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  headerRowCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  idHeaderLabel: {
    color: '#607580',
    flexShrink: 1,
    fontSize: getFontSize(11),
    lineHeight: getLineHeight(15),
    fontWeight: '700',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  idHeaderLabelCompact: {
    textAlign: 'left',
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
  avatarFallback: {
    flex: 1,
    borderRadius: moderateScale(54),
    backgroundColor: '#EEF6FA',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  profileName: {
    color: '#365F72',
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(24),
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  profileNameCompact: {
    textAlign: 'center',
    fontSize: getFontSize(18),
    lineHeight: getLineHeight(22),
  },
  profilePrompt: {
    color: '#0F172A',
    fontSize: getFontSize(14),
    lineHeight: getLineHeight(19),
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  profilePromptCompact: {
    textAlign: 'center',
  },
  detailItem: {
    marginBottom: spacing.sm,
  },
  detailLabel: {
    color: '#6A7F89',
    fontSize: getFontSize(11),
    lineHeight: getLineHeight(15),
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  detailValue: {
    color: '#263F4C',
    fontSize: getFontSize(15),
    lineHeight: getLineHeight(20),
    fontWeight: '700',
  },
  detailPlaceholder: {
    color: '#6A7F89',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  detailValueCompact: {
    textAlign: 'center',
  },
  actionRail: {
    width: moderateScale(72),
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  actionRailCompact: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 0,
    paddingVertical: spacing.xs,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xxs,
    minWidth: moderateScale(56),
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  actionButtonCompact: {
    minWidth: moderateScale(48),
    paddingHorizontal: spacing.xxs,
  },
  actionIconWrap: {
    width: moderateScale(56),
    height: moderateScale(56),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -moderateScale(6),
  },
  actionIconWrapCompact: {
    width: moderateScale(44),
  },
  actionButtonPressed: {
    backgroundColor: '#E6F1F7',
  },
  actionLabel: {
    color: actionColor,
    fontSize: getFontSize(14),
    lineHeight: getLineHeight(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  trackerGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  trackerGridCompact: {
    flexDirection: 'column',
  },
  trackerCard: {
    flex: 1,
    minHeight: moderateScale(250),
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#D2D2D2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  trackerCardPressed: {
    borderColor: colors.brandText,
  },
  trackerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackerTitle: {
    color: '#0F172A',
    fontSize: getFontSize(24),
    lineHeight: getLineHeight(34),
    fontWeight: '700',
  },
  trackerTitleRight: {
    textAlign: 'right',
  },
  addButton: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: getFontSize(36),
    lineHeight: getLineHeight(38),
    fontWeight: '300',
  },
  emptyText: {
    color: '#8B8B8B',
    fontSize: getFontSize(20),
    lineHeight: getLineHeight(30),
    fontStyle: 'italic',
    marginTop: spacing.xxl,
  },
  waveWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: moderateScale(86),
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    left: -moderateScale(24),
    right: -moderateScale(24),
    borderTopLeftRadius: moderateScale(90),
    borderTopRightRadius: moderateScale(90),
  },
  waveBack: {
    height: moderateScale(54),
    bottom: moderateScale(44),
    opacity: 0.18,
    transform: [{ rotate: '-2deg' }],
  },
  waveMiddle: {
    height: moderateScale(60),
    bottom: moderateScale(28),
    opacity: 0.36,
    transform: [{ rotate: '2deg' }],
  },
  waveFront: {
    height: moderateScale(64),
    bottom: -moderateScale(2),
    opacity: 1,
    transform: [{ rotate: '-1deg' }],
  },
  blueAccent: {
    backgroundColor: '#0B84BE',
  },
  greenAccent: {
    backgroundColor: '#58BE8D',
  },
});
