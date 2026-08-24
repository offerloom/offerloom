CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `merchant_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`merchant` text NOT NULL,
	`merchant_product_id` text NOT NULL,
	`source_url` text NOT NULL,
	`affiliate_url` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_checked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_listings_merchant_product` ON `merchant_listings` (`merchant`,`merchant_product_id`);--> statement-breakpoint
CREATE INDEX `idx_listings_product_status` ON `merchant_listings` (`product_id`,`status`);--> statement-breakpoint
CREATE TABLE `outbound_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` text NOT NULL,
	`product_id` text NOT NULL,
	`merchant` text NOT NULL,
	`referrer_host` text,
	`clicked_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `merchant_listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clicks_listing_time` ON `outbound_clicks` (`listing_id`,`clicked_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text NOT NULL,
	`specs_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_status_updated` ON `products` (`status`,`updated_at`);--> statement-breakpoint
PRAGMA optimize;
