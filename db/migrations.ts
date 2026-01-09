import type { SQLiteDatabase } from 'expo-sqlite';
import {
  SCHEMA_VERSION,
  CREATE_ACCOUNTS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_TRANSACTIONS_DATE_INDEX,
  CREATE_TRANSACTIONS_FROM_INDEX,
  CREATE_TRANSACTIONS_TO_INDEX,
  CREATE_SCHEMA_VERSION_TABLE,
} from './schema';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(db);

  if (currentVersion < 1) {
    await migrateToV1(db);
  }

  await setSchemaVersion(db, SCHEMA_VERSION);
}

async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    await db.execAsync(CREATE_SCHEMA_VERSION_TABLE);
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version LIMIT 1'
    );
    return result?.version ?? 0;
  } catch {
    return 0;
  }
}

async function setSchemaVersion(db: SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync('DELETE FROM schema_version');
  await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', version);
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_ACCOUNTS_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_DATE_INDEX);
  await db.execAsync(CREATE_TRANSACTIONS_FROM_INDEX);
  await db.execAsync(CREATE_TRANSACTIONS_TO_INDEX);
}
