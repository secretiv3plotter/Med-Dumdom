import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RealmProvider, useRealm } from '../localdb/realm';
import { ROUTES } from './navigation/routes';
import { SCREEN_REGISTRY } from './navigation/screenRegistry';

function AppContent() {
  const realm = useRealm();
  const [history, setHistory] = useState([{ routeName: ROUTES.HOME, params: {} }]);
  const currentEntry = history[history.length - 1];
  const currentRoute = currentEntry?.routeName;
  const currentParams = currentEntry?.params ?? {};

  const navigateTo = (routeName, params = {}) => {
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
  };

  const goBack = () => {
    setHistory((previousHistory) => {
      if (previousHistory.length <= 1) {
        return previousHistory;
      }

      return previousHistory.slice(0, -1);
    });
  };

  const goToHardwareBackTarget = () => {
    if (currentRoute === ROUTES.HOME || currentRoute === ROUTES.CAREGIVER_HOME) {
      return true;
    }

    if (currentRoute === ROUTES.MED_TRACKER || currentRoute === ROUTES.APPOINTMENT_TRACKER) {
      navigateTo(ROUTES.HOME);
      return true;
    }

    if (currentRoute === ROUTES.HELP_AND_SUPPORT || currentRoute === ROUTES.PROFILE) {
      navigateTo(currentParams.returnTo || ROUTES.HOME);
      return true;
    }

    if (currentRoute === ROUTES.SETTINGS) {
      if (currentParams.returnTo) {
        navigateTo(ROUTES.PROFILE, { returnTo: currentParams.returnTo });
      } else {
        navigateTo(ROUTES.PROFILE);
      }
      return true;
    }

    if (history.length > 1) {
      goBack();
      return true;
    }

    return true;
  };

  const navigation = useMemo(
    () => ({
      navigate: navigateTo,
      goBack,
      canGoBack: history.length > 1,
      currentRoute,
      currentParams,
    }),
    [history, currentRoute, currentParams],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goToHardwareBackTarget);
    return () => subscription.remove();
  }, [currentRoute, currentParams, history.length]);

  const CurrentScreen = SCREEN_REGISTRY[currentRoute] ?? SCREEN_REGISTRY[ROUTES.CAREGIVER_HOME];
  const screenProps = currentRoute === ROUTES.MED_TRACKER ? { navigation, realm } : { navigation };

  return (
    <SafeAreaProvider>
      <CurrentScreen {...screenProps} />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

export default function AppRoot() {
  return (
    <RealmProvider>
      <AppContent />
    </RealmProvider>
  );
}
