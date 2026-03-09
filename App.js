import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ROUTES } from './src/constants/routes';
import ApptTracker from './src/screens/ApptTracker';
import HelpAndSupport from './src/screens/HelpAndSupport';
import EditProfileScreen from './src/screens/EditProfileScreen';
import LinkRequestsPage from './src/screens/LinkRequestsPage';
import LinktoPatientMainPage from './src/screens/LinktoPatientMainPage';
import MainDashboardCaregiver from './src/screens/MainDashboardCaregiver';
import MedTracker from './src/screens/MedTracker';
import NotificationScreen from './src/screens/NotificationScreen';
import PatientSpecificDashboard from './src/screens/PatientSpecificDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import ProgressReport from './src/screens/ProgressReport';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [history, setHistory] = useState([{ routeName: ROUTES.HOME, params: {} }]);
  const currentEntry = history[history.length - 1];
  const currentRoute = currentEntry?.routeName;
  const currentParams = currentEntry?.params ?? {};

  const navigation = useMemo(
    () => ({
      navigate: (routeName, params = {}) => {
        setHistory((previousHistory) => {
          const activeEntry = previousHistory[previousHistory.length - 1];
          const sameRoute = activeEntry?.routeName === routeName;
          const sameParams = JSON.stringify(activeEntry?.params ?? {}) === JSON.stringify(params);
          if (sameRoute && sameParams) {
            return previousHistory;
          }
          if (sameRoute) {
            return [...previousHistory.slice(0, -1), { routeName, params }];
          }
          return [...previousHistory, { routeName, params }];
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
      currentParams,
    }),
    [history, currentRoute, currentParams],
  );

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case ROUTES.APPOINTMENT_TRACKER:
        return <ApptTracker navigation={navigation} />;
      case ROUTES.MED_TRACKER:
        return <MedTracker navigation={navigation} />;
      case ROUTES.PROGRESS_REPORT:
        return <ProgressReport navigation={navigation} />;
      case ROUTES.HELP_AND_SUPPORT:
        return <HelpAndSupport navigation={navigation} />;
      case ROUTES.NOTIFICATION:
        return <NotificationScreen navigation={navigation} />;
      case ROUTES.PROFILE:
        return <ProfileScreen navigation={navigation} />;
      case ROUTES.SETTINGS:
        return <SettingsScreen navigation={navigation} />;
      case ROUTES.EDIT_PROFILE:
        return <EditProfileScreen navigation={navigation} />;
      case ROUTES.PATIENT_SPECIFIC_DASHBOARD:
        return <PatientSpecificDashboard navigation={navigation} />;
      case ROUTES.LINK_TO_PATIENT_MAIN:
        return <LinktoPatientMainPage navigation={navigation} />;
      case ROUTES.LINK_REQUESTS:
        return <LinkRequestsPage navigation={navigation} />;
      case ROUTES.HOME:
      default:
        return <MainDashboardCaregiver navigation={navigation} />;
    }
  };

  return (
    <SafeAreaProvider>
      {renderCurrentScreen()}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
