import { ROUTES } from './routes';
import LogInScreen from '../../features/auth/screens/LogInScreen';
import LoadingScreen from '../../features/auth/screens/LoadingScreen';
import SignUpScreen from '../../features/auth/screens/SignUpScreen';
import AppointmentTrackerHistoryScreen from '../../features/patient/screens/AppointmentTrackerHistoryScreen';
import AppointmentTrackerScreen from '../../features/patient/screens/AppointmentTrackerScreen';
import MedTrackerHistoryScreen from '../../features/patient/screens/MedTrackerHistoryScreen';
import MedTrackerScreen from '../../features/patient/screens/MedTrackerScreen';
import PatientDashboardScreen from '../../features/patient/screens/PatientDashboardScreen';
import ProfileScreen from '../../features/patient/screens/ProfileScreen';
import AccessibilitySettingsScreen from '../../features/settings/screens/AccessibilitySettingsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import HelpAndSupportScreen from '../../features/support/screens/HelpAndSupportScreen';

export const SCREEN_REGISTRY = {
  [ROUTES.SIGN_UP]: SignUpScreen,
  [ROUTES.LOG_IN]: LogInScreen,
  [ROUTES.LOADING]: LoadingScreen,
  [ROUTES.SETTINGS]: SettingsScreen,
  [ROUTES.HOME]: PatientDashboardScreen,
  [ROUTES.PATIENT_DASHBOARD]: PatientDashboardScreen,
  [ROUTES.APPOINTMENT_TRACKER]: AppointmentTrackerScreen,
  [ROUTES.APPOINTMENT_TRACKER_HISTORY]: AppointmentTrackerHistoryScreen,
  [ROUTES.MED_TRACKER]: MedTrackerScreen,
  [ROUTES.MED_TRACKER_HISTORY]: MedTrackerHistoryScreen,
  [ROUTES.HELP_AND_SUPPORT]: HelpAndSupportScreen,
  [ROUTES.ACCESSIBILITY_SETTINGS]: AccessibilitySettingsScreen,
  [ROUTES.PROFILE]: ProfileScreen,
};
