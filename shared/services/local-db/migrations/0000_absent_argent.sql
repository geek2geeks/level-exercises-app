CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`refresh_token` text,
	`device_id` text NOT NULL,
	`last_active` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'PENDING',
	`retry_count` integer DEFAULT 0,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`photo_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_embedding` text,
	`onboarding_status` text DEFAULT 'PENDING'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);