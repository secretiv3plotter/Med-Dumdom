//practice ground for testing new components and styles

import { Alert, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/common/ActionButton';
import { AddButton, DeleteButton, EditButton } from '../components/common/CrudButton';
import DashboardHeader from '../components/common/DashboardHeader';
import HelpButton from '../components/dashboard_header/HelpButton';
import ProfileButton from '../components/dashboard_header/ProfileButton';
import AppointmentCard from '../components/practice_ground/AppointmentCard';
import SearchBar from '../components/common/SearchBar';
import { colors, spacing } from '../constants/Themes';
import { homeContent } from '../data/PracticeGroundText';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.stickyHeader}>
        <DashboardHeader
          firstName="Mia"
          onHelpPress={() => Alert.alert('DashboardHeader', 'Help pressed')}
          onProfilePress={() => Alert.alert('DashboardHeader', 'Profile pressed')}
          profileImageSource={{ uri: 'https://i.pravatar.cc/224?img=12' }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{homeContent.appName}</Text>
        <Text style={styles.subtitle}>{homeContent.greeting}</Text>

        <SearchBar placeholder={homeContent.searchPlaceholder} />

        <AppointmentCard
          title={homeContent.appointment.title}
          details={homeContent.appointment.details}
        />

        <View style={styles.row}>
          <ActionButton label={homeContent.actions.primary} />
          <ActionButton label={homeContent.actions.secondary} variant="outline" />
        </View>

        <Text style={styles.sectionTitle}>CRUD Buttons</Text>

        <View style={styles.row}>
          <AddButton onPress={() => Alert.alert('CrudButton', 'Add pressed')} />
          <EditButton onPress={() => Alert.alert('CrudButton', 'Edit pressed')} />
          <DeleteButton onPress={() => Alert.alert('CrudButton', 'Delete pressed')} />
        </View>

        <View style={styles.row}>
          <AddButton disabled />
          <EditButton disabled />
          <DeleteButton disabled />
        </View>

        <Text style={styles.sectionTitle}>Help Button</Text>

        <View style={styles.row}>
          <HelpButton onPress={() => Alert.alert('HelpButton', 'Help pressed')} />
          <HelpButton disabled />
        </View>

        <Text style={styles.sectionTitle}>Profile Button</Text>

        <View style={styles.row}>
          <ProfileButton onPress={() => Alert.alert('ProfileButton', 'Profile pressed')} />
          <ProfileButton
            imageSource={{ uri: 'https://i.pravatar.cc/224?img=12' }}
            onPress={() => Alert.alert('ProfileButton', 'Photo profile pressed')}
          />
        </View>

        <View style={styles.row}>
          <ProfileButton disabled />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  stickyHeader: {
    position: 'absolute',
    top: spacing.xxl,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.pageBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  container: {
    paddingTop: 120,
    padding: spacing.lg,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.title,
  },
  subtitle: {
    fontSize: 15,
    color: colors.body,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.title,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
