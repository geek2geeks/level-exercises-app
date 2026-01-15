import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    photoURL: text('photo_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    // AI Identity Fields
    userEmbedding: text('user_embedding'), // JSON string of vector
    onboardingStatus: text('onboarding_status').default('PENDING'),
});

export const authSessions = sqliteTable('auth_sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    token: text('token').notNull(),
    refreshToken: text('refresh_token'),
    deviceId: text('device_id').notNull(),
    lastActive: integer('last_active', { mode: 'timestamp' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
    id: text('id').primaryKey(),
    tableName: text('table_name').notNull(),
    recordId: text('record_id').notNull(),
    operation: text('operation').notNull(), // 'INSERT', 'UPDATE', 'DELETE'
    data: text('data').notNull(), // JSON string payload
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    status: text('status').default('PENDING'), // 'PENDING', 'SYNCING', 'FAILED'
    retryCount: integer('retry_count').default(0),
    lastError: text('last_error'),
});
