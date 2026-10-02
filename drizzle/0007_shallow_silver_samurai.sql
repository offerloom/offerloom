ALTER TABLE `social_posts` ADD `retry_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `social_posts` ADD `retry_after` text;--> statement-breakpoint
CREATE INDEX `idx_social_posts_retry` ON `social_posts` (`status`,`retry_after`);