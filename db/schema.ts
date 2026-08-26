import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_categories_slug").on(table.slug)]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id),
  brand: text("brand"),
  modelNumber: text("model_number"),
  imageUrl: text("image_url"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  summary: text("summary").notNull(),
  specsJson: text("specs_json").notNull().default("[]"),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  source: text("source").notNull().default("manual"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  publishedAt: text("published_at"),
}, (table) => [
  uniqueIndex("idx_products_slug").on(table.slug),
  index("idx_products_brand_model").on(table.brand, table.modelNumber),
  index("idx_products_status_updated").on(table.status, table.updatedAt),
]);

export const merchantListings = sqliteTable("merchant_listings", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  merchant: text("merchant").notNull(),
  merchantProductId: text("merchant_product_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  status: text("status", { enum: ["active", "paused"] }).notNull().default("active"),
  lastCheckedAt: text("last_checked_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("idx_listings_merchant_product").on(table.merchant, table.merchantProductId),
  index("idx_listings_product_status").on(table.productId, table.status),
]);

export const merchants = sqliteTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "pending", "paused", "blocked"] }).notNull().default("pending"),
  syncMode: text("sync_mode", { enum: ["manual", "feed", "api"] }).notNull().default("manual"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastSuccessAt: text("last_success_at"),
  lastFailureAt: text("last_failure_at"),
  lastError: text("last_error"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_merchants_status").on(table.status)]);

export const syncRuns = sqliteTable("sync_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  merchantId: text("merchant_id").notNull().references(() => merchants.id),
  status: text("status", { enum: ["running", "succeeded", "failed"] }).notNull(),
  productsSeen: integer("products_seen").notNull().default(0),
  productsUpdated: integer("products_updated").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
}, (table) => [index("idx_sync_runs_merchant_started").on(table.merchantId, table.startedAt)]);

export const outboundClicks = sqliteTable("outbound_clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: text("listing_id").notNull().references(() => merchantListings.id),
  productId: text("product_id").notNull().references(() => products.id),
  merchant: text("merchant").notNull(),
  referrerHost: text("referrer_host"),
  clickedAt: text("clicked_at").notNull(),
}, (table) => [index("idx_clicks_listing_time").on(table.listingId, table.clickedAt)]);

export const socialPosts = sqliteTable("social_posts", {
  id: text("id").primaryKey(),
  headline: text("headline").notNull(),
  body: text("body").notNull().default(""),
  linkUrl: text("link_url"),
  imageUrl: text("image_url").notNull(),
  platformsJson: text("platforms_json").notNull(),
  caption: text("caption").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "published", "failed", "cancelled"] }).notNull().default("draft"),
  scheduledAt: text("scheduled_at"),
  publishedAt: text("published_at"),
  publishResultsJson: text("publish_results_json"),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_social_posts_status_scheduled").on(table.status, table.scheduledAt)]);
