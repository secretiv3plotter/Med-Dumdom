import { ROUTES } from './routes';
import LogInScreen from '../../features/auth/screens/LogInScreen';
import SignUpScreen from '../../features/auth/screens/SignUpScreen';
import MainDashboardCaregiverScreen from '../../features/caregiver/screens/MainDashboardCaregiverScreen';
import LinkRequestsScreen from '../../features/linking/screens/LinkRequestsScreen';
import LinkToCaregiverScreen from '../../features/linking/screens/LinkToCaregiverScreen';
import LinkToPatientMainPageScreen from '../../features/linking/screens/LinkToPatientMainPageScreen';
import AppointmentTrackerScreen from '../../features/patient/screens/AppointmentTrackerScreen';
import MedTrackerHistoryScreen from '../../features/patient/screens/MedTrackerHistoryScreen';
import MedTrackerScreen from '../../features/patient/screens/MedTrackerScreen';
import PatientSpecificDashboardScreen from '../../features/patient/screens/PatientSpecificDashboardScreen';
import ProfileScreen from '../../features/patient/screens/ProfileScreen';
import AccessibilitySettingsScreen from '../../features/settings/screens/AccessibilitySettingsScreen';
import PrivacySettingsScreen from '../../features/settings/screens/PrivacySettingsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import HelpAndSupportScreen from '../../features/support/screens/HelpAndSupportScreen';

export const SCREEN_REGISTRY = {
  [ROUTES.SIGN_UP]: SignUpScreen,
  [ROUTES.LOG_IN]: LogInScreen,
  [ROUTES.SETTINGS]: SettingsScreen,
  [ROUTES.HOME]: PatientSpecificDashboardScreen,
  [ROUTES.PATIENT_SPECIFIC_DASHBOARD]: PatientSpecificDashboardScreen,
  [ROUTES.CAREGIVER_HOME]: MainDashboardCaregiverScreen,
  [ROUTES.APPOINTMENT_TRACKER]: AppointmentTrackerScreen,
  [ROUTES.MED_TRACKER]: MedTrackerScreen,
  [ROUTES.MED_TRACKER_HISTORY]: MedTrackerHistoryScreen,
  [ROUTES.HELP_AND_SUPPORT]: HelpAndSupportScreen,
  [ROUTES.ACCESSIBILITY_SETTINGS]: AccessibilitySettingsScreen,
  [ROUTES.PROFILE]: ProfileScreen,
  [ROUTES.PRIVACY_SETTINGS]: PrivacySettingsScreen,
  [ROUTES.LINK_TO_CAREGIVER]: LinkToCaregiverScreen,
  [ROUTES.LINK_TO_PATIENT_MAIN]: LinkToPatientMainPageScreen,
  [ROUTES.LINK_REQUESTS]: LinkRequestsScreen,
};
