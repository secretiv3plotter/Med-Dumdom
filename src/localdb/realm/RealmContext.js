import { createRealmContext } from '@realm/react';
import { medTrackerRealmConfig } from './medTrackerSchemas';

export const {
  RealmProvider,
  useRealm,
  useObject,
  useQuery,
} = createRealmContext(medTrackerRealmConfig);
