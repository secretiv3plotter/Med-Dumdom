import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PracticeGround from './src/screens/PracticeGround';
//import MainDashboardCaregiver from './src/screens/MainDashboardCaregiver';
//import PatientSpecificDashboard from './src/screens/PatientSpecificDashboard';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Uncomment only one screen at a time */}
      <PracticeGround />
      {/* <MainDashboardCaregiver /> */}
      {/* <PatientSpecificDashboard /> */}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}