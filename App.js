import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import HomeScreen from './src/screens/PracticeGround';
import BackButtonTestScreen from './src/screens/BackButtonTestScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('practice');

  return (
    <SafeAreaProvider>
      {activeScreen === 'practice' ? (
        <HomeScreen onOpenBackButtonTest={() => setActiveScreen('backButtonTest')} />
      ) : (
        <BackButtonTestScreen onGoBack={() => setActiveScreen('practice')} />
      )}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
