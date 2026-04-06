import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ROUTES } from './navigation/routes';
import { SCREEN_REGISTRY } from './navigation/screenRegistry';

export default function AppRoot() {
  const [history, setHistory] = useState([{ routeName: ROUTES.SIGN_UP, params: {} }]);
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

  const CurrentScreen = SCREEN_REGISTRY[currentRoute] ?? SCREEN_REGISTRY[ROUTES.CAREGIVER_HOME];

  return (
    <SafeAreaProvider>
      <CurrentScreen navigation={navigation} />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
