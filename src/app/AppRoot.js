import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { RealmProvider, useRealm } from '../localdb/realm/RealmContext';
import { ROUTES } from './navigation/routes';
import { SCREEN_REGISTRY } from './navigation/screenRegistry';

// Keep the native splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

function applyStyleOverrides(element, overrides) {
  if (!element) {
    return () => {};
  }

  const previousValues = {};
  Object.keys(overrides).forEach((key) => {
    previousValues[key] = element.style[key];
    element.style[key] = overrides[key];
  });

  return () => {
    Object.keys(previousValues).forEach((key) => {
      element.style[key] = previousValues[key];
    });
  };
}

function useWebViewportLock() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const viewportStyles = {
      width: '100%',
      height: '100%',
      margin: '0',
      overflow: 'hidden',
    };
    const rootStyles = {
      width: '100%',
      height: '100dvh',
      overflow: 'hidden',
    };

    const cleanupHtml = applyStyleOverrides(document.documentElement, viewportStyles);
    const cleanupBody = applyStyleOverrides(document.body, viewportStyles);
    const cleanupRoot = applyStyleOverrides(document.getElementById('root'), rootStyles);

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      input:focus, textarea:focus, select:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      cleanupRoot();
      cleanupBody();
      cleanupHtml();
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);
}

function AppContent() {
  const realm = useRealm();
  const [history, setHistory] = useState([{ routeName: ROUTES.HOME, params: {} }]);
  const currentEntry = history[history.length - 1];
  const currentRoute = currentEntry.routeName;

  const navigation = useMemo(
    () => ({
      currentRoute,
      currentParams: currentEntry.params,
      navigate: (routeName, params = {}) => {
        setHistory((prev) => [...prev, { routeName, params }]);
      },
      goBack: () => {
        setHistory((prev) => {
          if (prev.length <= 1) {
            return prev;
          }
          return prev.slice(0, -1);
        });
      },
    }),
    [currentRoute, currentEntry.params]
  );

  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [history, navigation]);

  const CurrentScreen = SCREEN_REGISTRY[currentRoute] ?? SCREEN_REGISTRY[ROUTES.HOME];
  const screenProps =
    currentRoute === ROUTES.MED_TRACKER ||
    currentRoute === ROUTES.MED_TRACKER_HISTORY ||
    currentRoute === ROUTES.APPOINTMENT_TRACKER ||
    currentRoute === ROUTES.APPOINTMENT_TRACKER_HISTORY
      ? { navigation, realm }
      : { navigation };

  return (
    <>
      <CurrentScreen {...screenProps} />
      <StatusBar style="dark" />
    </>
  );
}

export default function AppRoot() {
  useWebViewportLock();
  const { width: windowWidth } = useWindowDimensions();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        // Load local Helvetica custom font dynamically (cross-platform compliant)
        await Font.loadAsync({
          'Helvetica': require('../assets/font/Helvetica.ttf'),
        });
      } catch (e) {
        console.warn('Font loading failed:', e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    loadResources();
  }, []);

  const isWebDesktop = Platform.OS === 'web' && windowWidth > 1025;

  const content = (
    <SafeAreaProvider style={styles.appShell}>
      <AppContent />
    </SafeAreaProvider>
  );

  if (!fontsLoaded) {
    return null; // Hold splash screen until font resources are ready
  }

  if (isWebDesktop) {
    return (
      <RealmProvider>
        <View style={styles.webDesktopBackground}>
          <View style={styles.phoneFrame}>
            {content}
          </View>
        </View>
      </RealmProvider>
    );
  }

  return (
    <RealmProvider>
      {content}
    </RealmProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  webDesktopBackground: {
    flex: 1,
    backgroundColor: '#0F172A', // Sleek dark slate
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  phoneFrame: {
    width: 420,
    height: 860,
    maxHeight: '95%', // Prevent overflow on short screens
    borderRadius: 36,
    borderWidth: 10,
    borderColor: '#1E293B', // Border bezel matching phone body
    overflow: 'hidden',
    backgroundColor: '#ECEFF4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
});
