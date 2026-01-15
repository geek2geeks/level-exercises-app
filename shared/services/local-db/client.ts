import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'level_fitness.db';

// Ensure database is opened sync (new Expo SDK 50+ API)
const expoDb = openDatabaseSync(DB_NAME);

export const db = drizzle(expoDb, { schema });

// Helper to reset DB (dev only)
export const resetDatabase = async () => {
    // In dev, you might drop tables or delete file
    // implementation depends on needs
};
