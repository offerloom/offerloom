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

export const outboundClicks = sqliteTable("outbound_clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: text("listing_id").notNull().references(() => merchantListings.id),
  productId: text("product_id").notNull().references(() => products.id),
  merchant: text("merchant").notNull(),
  referrerHost: text("referrer_host"),
  clickedAt: text("clicked_at").notNull(),
}, (table) => [index("idx_clicks_listing_time").on(table.listingId, table.clickedAt)]);
