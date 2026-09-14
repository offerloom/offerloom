CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`link_url` text,
	`image_url` text NOT NULL,
	`platforms_json` text NOT NULL,
	`caption` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` text,
	`published_at` text,
	`publish_results_json` text,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_social_posts_status_scheduled` ON `social_posts` (`status`,`scheduled_at`);
