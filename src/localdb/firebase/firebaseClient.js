const FIREBASE_INSTALL_MESSAGE =
  'Firebase SDK is not installed. Run `npm install firebase`, then provide your Firebase config before starting sync.';

const loadFirebaseModule = async (moduleName) => {
  try {
    return await import(moduleName);
  } catch (error) {
    const nextError = new Error(FIREBASE_INSTALL_MESSAGE);
    nextError.cause = error;
    throw nextError;
  }
};

export const initializeFirebaseClient = async (firebaseConfig) => {
  if (!firebaseConfig || typeof firebaseConfig !== 'object') {
    throw new Error('Firebase config is required to initialize Firebase.');
  }

  const [{ initializeApp, getApps, getApp }, { getFirestore }, { getAuth }] = await Promise.all([
    loadFirebaseModule('firebase/app'),
    loadFirebaseModule('firebase/firestore'),
    loadFirebaseModule('firebase/auth'),
  ]);

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
};

export { FIREBASE_INSTALL_MESSAGE };
