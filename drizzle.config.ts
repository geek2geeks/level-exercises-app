import type { Config } from 'drizzle-kit';

export default {
    schema: './app/shared/services/local-db/schema.ts',
    out: './app/shared/services/local-db/migrations',
    dialect: 'sqlite',
    driver: 'expo',
} satisfies Config;
