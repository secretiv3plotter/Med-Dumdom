import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ROUTES } from './src/constants/routes';
import ApptTracker from './src/screens/ApptTracker';
import Accessibility from './src/screens/Accessibility';
import HelpAndSupport from './src/screens/HelpAndSupport';
import LogIn from './src/screens/LogIn';
import MainDashboardCaregiver from './src/screens/MainDashboardCaregiver';
import MedTracker from './src/screens/MedTracker';
import NotificationScreen from './src/screens/NotificationScreen';
import PatientPrivacy from './src/screens/PatientPrivacy';
import PatientSpecificDashboard from './src/screens/PatientSpecificDashboard';
import PrivacySettings from './src/screens/PrivacySettings';
import ProfileScreen from './src/screens/ProfileScreen';
import ProgressReport from './src/screens/ProgressReport';
import SettingsScreen from './src/screens/SettingsScreen';
import SignUp from './src/screens/SignUp';

export default function App() {
  const [history, setHistory] = useState([ROUTES.SIGN_UP]);
  const currentRoute = history[history.length - 1];

  const navigation = useMemo(
    () => ({
      navigate: (routeName) => {
        setHistory((previousHistory) => {
          const activeRoute = previousHistory[previousHistory.length - 1];
          if (activeRoute === routeName) {
            return previousHistory;
          }
          return [...previousHistory, routeName];
        });
      },
      goBack: () => {
        setHistory((previousHistory) => {
          if (previousHistory.length <= 1) {
            return previousHistory;
          }
          return previousHistory.slice(0, -1);
        });
      },
      canGoBack: history.length > 1,
      currentRoute,
    }),
    [history, currentRoute],
  );

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case ROUTES.SIGN_UP:
        return <SignUp navigation={navigation} />;
      case ROUTES.LOG_IN:
        return <LogIn navigation={navigation} />;
      case ROUTES.SETTINGS:
        return <SettingsScreen navigation={navigation} />;
      case ROUTES.APPOINTMENT_TRACKER:
        return <ApptTracker navigation={navigation} />;
      case ROUTES.CAREGIVER_HOME:
        return <MainDashboardCaregiver navigation={navigation} />;
      case ROUTES.MED_TRACKER:
        return <MedTracker navigation={navigation} />;
      case ROUTES.PROGRESS_REPORT:
        return <ProgressReport navigation={navigation} />;
      case ROUTES.HELP_AND_SUPPORT:
        return <HelpAndSupport navigation={navigation} />;
      case ROUTES.NOTIFICATION:
        return <NotificationScreen navigation={navigation} />;
      case ROUTES.PATIENT_PRIVACY:
        return <PatientPrivacy navigation={navigation} />;
      case ROUTES.ACCESSIBILITY:
        return <Accessibility navigation={navigation} />;
      case ROUTES.PROFILE:
        return <ProfileScreen navigation={navigation} />;
      case ROUTES.PRIVACY_SETTINGS:
        return <PrivacySettings navigation={navigation} />;
      case ROUTES.LINK_TO_CAREGIVER:
        return <LinkToCaregiver navigation={navigation} />;
      case ROUTES.HOME:
      default:
        return <PatientSpecificDashboard navigation={navigation} />;
    }
  };

  return (
    <SafeAreaProvider>
      {renderCurrentScreen()}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
