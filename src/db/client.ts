import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'digimon.db';

/** Handle nativo do SQLite — usado pelo plugin do Drizzle Studio em dev. */
export const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// SQLite não aplica foreign keys por padrão; ligamos para respeitar os
// ON DELETE cascade/set null definidos no schema.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
