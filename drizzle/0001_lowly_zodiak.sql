ALTER TABLE `products` ADD `brand` text;--> statement-breakpoint
ALTER TABLE `products` ADD `model_number` text;--> statement-breakpoint
ALTER TABLE `products` ADD `image_url` text;--> statement-breakpoint
CREATE INDEX `idx_products_brand_model` ON `products` (`brand`,`model_number`);--> statement-breakpoint
PRAGMA optimize;
