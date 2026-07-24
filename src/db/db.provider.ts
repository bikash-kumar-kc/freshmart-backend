import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

export const DB_PROVIDER = 'DRIZZLE_DB';

export const dbProvider = {
  provide: DB_PROVIDER,
  useFactory: () => {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    return drizzle(client, { schema });
  },
};
