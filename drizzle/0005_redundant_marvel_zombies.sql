CREATE TABLE `collected_deals` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`approved_payload` text,
	`product_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL
);
