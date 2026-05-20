import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const initializeFirebaseClient = (firebaseConfig) => {
  if (!firebaseConfig || typeof firebaseConfig !== 'object') {
    throw new Error('Firebase config is required to initialize Firebase.');
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
};
