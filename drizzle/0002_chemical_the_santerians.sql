CREATE TABLE `merchants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`sync_mode` text DEFAULT 'manual' NOT NULL,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_success_at` text,
	`last_failure_at` text,
	`last_error` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_merchants_status` ON `merchants` (`status`);--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`merchant_id` text NOT NULL,
	`status` text NOT NULL,
	`products_seen` integer DEFAULT 0 NOT NULL,
	`products_updated` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` text NOT NULL,
	`finished_at` text,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sync_runs_merchant_started` ON `sync_runs` (`merchant_id`,`started_at`);--> statement-breakpoint
INSERT INTO `merchants` (`id`,`name`,`status`,`sync_mode`,`consecutive_failures`,`updated_at`) VALUES
  ('amazon','Amazon','active','manual',0,datetime('now')),
  ('flipkart','Flipkart','pending','manual',0,datetime('now')),
  ('croma','Croma','pending','manual',0,datetime('now')),
  ('reliance-digital','Reliance Digital','pending','manual',0,datetime('now'));--> statement-breakpoint
PRAGMA optimize;
