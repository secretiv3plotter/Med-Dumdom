import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebaseClient } from './firebaseClient';
import { firebaseConfig } from './firebaseConfig';

const FirebaseAuthContext = createContext(null);

export function FirebaseProvider({ children }) {
  const [firebase, setFirebase] = useState(null);
  // undefined = still initializing, null = no user, object = signed in
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const { app, auth, db } = initializeFirebaseClient(firebaseConfig);
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user ?? null);
      });
      setFirebase({ app, auth, db });
    } catch (err) {
      console.error('Firebase initialization failed:', err);
      setCurrentUser(null);
    }

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseAuthContext.Provider value={{ firebase, currentUser }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseAuthContext);
}
