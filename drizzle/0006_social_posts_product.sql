ALTER TABLE `social_posts` ADD `product_id` text;
--> statement-breakpoint
CREATE INDEX `idx_social_posts_product_created` ON `social_posts` (`product_id`,`created_at`);
