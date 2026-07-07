import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * DB is optional: without DATABASE_URL the app runs in demo mode against
 * in-memory seed data (see lib/data/*). See DECISIONS.md #1.
 */
export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL not set — running in demo mode');
  }
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 10 });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { schema };
