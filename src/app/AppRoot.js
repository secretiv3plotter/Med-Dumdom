import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Image, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TextScaleProvider, useTextScale } from '../shared/theme/textScale';
import { colors } from '../shared/theme';
import { RealmProvider, useRealm } from '../localdb/realm/RealmContext';
import RealmSettingsPreferenceRepository from '../localdb/realm/RealmSettingsPreferenceRepository';
import { FirebaseProvider, useFirebase } from '../localdb/firebase/FirebaseAuthContext';
import FirebaseSyncService from '../sync/FirebaseSyncService';
import RealmMedTrackerRepository from '../localdb/realm/RealmMedTrackerRepository';
import RealmApptTrackerRepository from '../localdb/realm/RealmApptTrackerRepository';
import RealmMedUnitRepository from '../localdb/realm/RealmMedUnitRepository';
import RealmUserRepository from '../localdb/realm/RealmUserRepository';
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

const AUTH_ROUTES = new Set([ROUTES.LOG_IN, ROUTES.SIGN_UP]);

function AppContent() {
  const realm = useRealm();
  const { firebase, currentUser } = useFirebase();
  const { textScale, darkModeEnabled, hapticEnabled } = useTextScale();
  const [history, setHistory] = useState([{ routeName: ROUTES.LOG_IN, params: {} }]);
  const currentEntry = history[history.length - 1];
  const currentRoute = currentEntry.routeName;

  // Redirect based on Firebase auth state only when it is resolved (not undefined)
  useEffect(() => {
    if (currentUser === undefined) return;
    if (currentUser === null && !AUTH_ROUTES.has(currentRoute)) {
      setHistory([{ routeName: ROUTES.LOG_IN, params: {} }]);
    }
    if (currentUser !== null && AUTH_ROUTES.has(currentRoute)) {
      setHistory([{ routeName: ROUTES.LOADING, params: {} }]);
    }
  }, [currentUser]); // intentionally only re-runs when auth state changes, not on every route change

  useEffect(() => {
    if (!realm || !currentUser || !firebase?.db) return;
    let debounceTimer = null;
    const handleChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const syncService = new FirebaseSyncService({
            firestoreDb: firebase.db,
            medRepository: new RealmMedTrackerRepository(realm),
            apptRepository: new RealmApptTrackerRepository(realm),
            medUnitRepository: new RealmMedUnitRepository(realm),
            userRepository: new RealmUserRepository(realm),
            settingsRepository: new RealmSettingsPreferenceRepository(realm),
          });
          await syncService.syncAll(currentUser.uid);
        } catch (err) {
          console.error('Auto-sync failed:', err);
        }
      }, 3000);
    };
    realm.addListener('change', handleChange);
    return () => {
      realm.removeListener('change', handleChange);
      clearTimeout(debounceTimer);
    };
  }, [currentUser, firebase, realm]);

  const navigation = useMemo(
    () => ({
      currentRoute,
      currentParams: currentEntry.params,
      navigate: (routeName, params = {}) => {
        setHistory((prev) => [...prev, { routeName, params }]);
      },
      reset: (routeName, params = {}) => {
        setHistory([{ routeName, params }]);
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

  const handleGlobalTouch = () => {
    if (!hapticEnabled) return;
    import('expo-haptics').then((Haptics) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    });
  };

  // Web: attach a global document click listener since onTouchStart doesn't fire in browsers
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const listener = (e) => {
      if (!hapticEnabled) return;
      // Only fire if the click landed on something interactive
      const isClickable = e.target?.closest(
        'button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [tabindex]'
      );
      if (!isClickable) return;
      import('expo-haptics').then((Haptics) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      });
    };
    document.addEventListener('click', listener, true);
    return () => document.removeEventListener('click', listener, true);
  }, [hapticEnabled]);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const iconTop = useRef(new Animated.Value(0)).current;
  const prevRouteRef = useRef(currentRoute);
  const [showOverlayIcon, setShowOverlayIcon] = useState(false);

  // LogInScreen: splash icon is in iconWrapper, top: 0, height: '10%' → center ≈ 5% of height
  // SignUpScreen: splash icon is inside formCard titleBlock, formCard is centered → icon ≈ 35% from top
  const LOGIN_ICON_TOP = windowHeight * 0.04;
  const SIGNUP_ICON_TOP = windowHeight * 0.32;

  useEffect(() => {
    const prevRoute = prevRouteRef.current;
    prevRouteRef.current = currentRoute;
    const isAuthSlide =
      (prevRoute === ROUTES.LOG_IN && currentRoute === ROUTES.SIGN_UP) ||
      (prevRoute === ROUTES.SIGN_UP && currentRoute === ROUTES.LOG_IN);
    if (!isAuthSlide) return;

    const toSignUp = currentRoute === ROUTES.SIGN_UP;
    const direction = toSignUp ? 1 : -1;
    translateX.setValue(direction * windowWidth);
    iconTop.setValue(toSignUp ? LOGIN_ICON_TOP : SIGNUP_ICON_TOP);
    setShowOverlayIcon(true);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(iconTop, {
        toValue: toSignUp ? SIGNUP_ICON_TOP : LOGIN_ICON_TOP,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => setShowOverlayIcon(false));
  }, [currentRoute]);

  if (currentUser === undefined) {
    return null;
  }

  const CurrentScreen = SCREEN_REGISTRY[currentRoute] ?? SCREEN_REGISTRY[ROUTES.HOME];
  const screenProps = { navigation, realm };
  const screenKey =
    currentRoute === ROUTES.ACCESSIBILITY_SETTINGS
      ? currentRoute
      : `${currentRoute}-${textScale}`;

  return (
    <>
      <Animated.View key={screenKey} style={{ flex: 1, transform: [{ translateX }] }} onTouchStart={handleGlobalTouch}>
        <CurrentScreen {...screenProps} />
      </Animated.View>
      {showOverlayIcon && (
        <Animated.Image
          source={require('../assets/splash-icon.png')}
          style={[styles.overlayIcon, { top: iconTop, left: windowWidth * 0.25 }]}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}
      <StatusBar style={darkModeEnabled ? 'light' : 'dark'} />
    </>
  );
}

function AppShell() {
  const realm = useRealm();
  const settingsRepository = useMemo(
    () => (realm ? new RealmSettingsPreferenceRepository(realm) : undefined),
    [realm],
  );

  return (
    <TextScaleProvider settingsService={settingsRepository}>
      <SafeAreaProvider style={[styles.appShell, { backgroundColor: colors.pageBg }]}>
        <AppContent />
      </SafeAreaProvider>
    </TextScaleProvider>
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

  if (!fontsLoaded) {
    return null; // Hold splash screen until font resources are ready
  }

  if (isWebDesktop) {
    return (
      <FirebaseProvider>
        <RealmProvider>
          <View style={[styles.webDesktopBackground, { backgroundColor: colors.pageBg }]}>
            <View
              style={[
                styles.phoneFrame,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <AppShell />
            </View>
          </View>
        </RealmProvider>
      </FirebaseProvider>
    );
  }

  return (
    <FirebaseProvider>
      <RealmProvider>
        <AppShell />
      </RealmProvider>
    </FirebaseProvider>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlayIcon: {
    position: 'absolute',
    width: '50%',
    height: 60,
    zIndex: 999,
  },
  phoneFrame: {
    width: 420,
    height: 860,
    maxHeight: '95%', // Prevent overflow on short screens
    borderRadius: 36,
    borderWidth: 10,
    borderColor: '#1E293B', // Border bezel matching phone body
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
});
