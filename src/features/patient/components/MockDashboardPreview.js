import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getFontSize, getLineHeight, moderateScale, radius, spacing } from '../../../shared/theme';
import PatientIdCard, { formatBirthdate, getWideProfileSpacing } from './PatientIdCard';

const logoSource = require('../../../assets/splash-icon.png');
const actionColor = '#475568';
const headerActionIconSize = moderateScale(30);
const helpIconSize = moderateScale(34);

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
  const [containerWidth, setContainerWidth] = useState(0);
  const isCompact = containerWidth > 0 && containerWidth < 385;
  const wideProfileSpacing = getWideProfileSpacing(containerWidth);

  const hasProfile = profile !== null && profile !== undefined;
  const resolvedName = getProfileName(profile, hasProfile ? 'Patient' : profileName);
  const resolvedBirthdateValue = getProfileBirthdate(profile, hasProfile ? null : birthdate);
  const resolvedBirthdate = formatBirthdate(resolvedBirthdateValue);
  const resolvedImageSource = getProfileImageSource(profile, profileImageSource);
  const isProfileEmpty = hasProfile && !hasAnyProfileInfo(profile);

  return (
    <View
      style={[styles.screen, isCompact && styles.screenCompact, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
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

function getProfileName(profile, fallbackName) {
  return String(profile?.fullName || profile?.name || fallbackName || 'Patient').trim() || 'Patient';
}

function getProfileBirthdate(profile, fallbackBirthdate) {
  return profile?.birthDate || profile?.birthdate || fallbackBirthdate || null;
}

function hasAnyProfileInfo(profile) {
  if (!profile || typeof profile !== 'object') return false;
  return Boolean(
    String(profile.fullName || profile.name || '').trim() ||
      profile.birthDate ||
      profile.birthdate ||
      String(profile.profilePicture || profile.profilePictureUrl || '').trim() ||
      (Number.isInteger(Number(profile.age)) && Number(profile.age) > 0)
  );
}

function getProfileImageSource(profile, explicitImageSource) {
  if (explicitImageSource) return explicitImageSource;
  const picture = String(profile?.profilePicture || profile?.profilePictureUrl || '').trim();
  return picture ? { uri: picture } : null;
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
