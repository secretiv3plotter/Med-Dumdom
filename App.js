import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NavigationBar from './src/components/common/NavigationBar';
import MainDashboardCaregiver from './src/screens/MainDashboardCaregiver';
import MedTracker from './src/screens/MedTracker';
import ApptTracker from './src/screens/ApptTracker';
import ProgressReport from './src/screens/ProgressReport';
import AlertScreen from './src/screens/Alert';
import { colors } from './src/constants/Themes';
import { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const screenByTab = {
    home: MainDashboardCaregiver,
    med: MedTracker,
    appointment: ApptTracker,
    progress: ProgressReport,
    notification: AlertScreen,
  };

  const ActiveScreen = screenByTab[activeTab] ?? MainDashboardCaregiver;

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <View style={styles.content}>
          <ActiveScreen />
        </View>
        <NavigationBar
          selectedTab={activeTab}
          onNavigate={setActiveTab}
          notificationsUnread={activeTab !== 'notification'}
        />
      </View>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    flex: 1,
  },
});
