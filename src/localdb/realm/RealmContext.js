import { createRealmContext } from '@realm/react';
import { realmConfig } from './realmSchemas';

export const {
  RealmProvider,
  useRealm,
  useObject,
  useQuery,
} = createRealmContext(realmConfig);
