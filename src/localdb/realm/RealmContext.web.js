import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebRealm } from '../web/WebEncryptedRepository';

const RealmContext = createContext(null);

const DEFAULT_DEMO_PASSWORD = "med-dumdom-default-secure-dx-key";

// Single persistent WebRealm instance across the app session
const globalWebRealm = new WebRealm();

export function RealmProvider({ children }) {
  const [realmInstance, setRealmInstance] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initDb() {
      // Auto-unlock with a default developer password on initial mount
      // so the app remains fully functional and persistent on tab refreshes.
      try {
        if (!globalWebRealm.isUnlocked) {
          await globalWebRealm.unlock(DEFAULT_DEMO_PASSWORD);
        }
      } catch (err) {
        console.error("Auto-unlock of secure database failed, fallback to empty DB:", err);
      } finally {
        setRealmInstance(globalWebRealm);
        setIsReady(true);
      }
    }
    
    initDb();
  }, []);

  if (!isReady) {
    return null; // Render loading shell during key derivation on mount
  }

  return (
    <RealmContext.Provider value={realmInstance}>
      {children}
    </RealmContext.Provider>
  );
}

export function useRealm() {
  const realm = useContext(RealmContext);
  return realm;
}

export function useQuery(schemaName) {
  const realm = useRealm();
  const [data, setData] = useState(() => realm ? realm.objects(schemaName) : []);

  useEffect(() => {
    if (!realm) return;
    
    const handleUpdate = () => {
      setData(realm.objects(schemaName));
    };
    
    realm.addListener('change', handleUpdate);
    return () => realm.removeListener('change', handleUpdate);
  }, [realm, schemaName]);

  return data;
}

export function useObject(schemaName, primaryKey) {
  const realm = useRealm();
  const [obj, setObj] = useState(() => realm ? realm.objectForPrimaryKey(schemaName, primaryKey) : null);

  useEffect(() => {
    if (!realm) return;
    
    const handleUpdate = () => {
      setObj(realm.objectForPrimaryKey(schemaName, primaryKey));
    };
    
    realm.addListener('change', handleUpdate);
    return () => realm.removeListener('change', handleUpdate);
  }, [realm, schemaName, primaryKey]);

  return obj;
}
