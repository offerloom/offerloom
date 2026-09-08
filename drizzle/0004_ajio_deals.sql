INSERT INTO merchants (id, name, status, sync_mode, consecutive_failures, updated_at)
SELECT 'ajio', 'AJIO', 'active', 'manual', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'ajio');
--> statement-breakpoint
INSERT INTO categories (id, name, slug, position, created_at)
SELECT 'fashion', 'Fashion', 'fashion', 2, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fashion');
--> statement-breakpoint
INSERT INTO products (id, category_id, brand, model_number, name, slug, summary, specs_json, status, source, created_at, updated_at, published_at)
VALUES
  ('ajio-altheory-crossbody-442710962', 'fashion', 'Altheory by AZORTE', '442710962_offwhite', 'Altheory by AZORTE Rigid Crossbody Bag', 'altheory-by-azorte-rigid-crossbody-bag', 'Bestselling crossbody bag from AJIO, currently marked 70% off. Check AJIO for the latest size, stock and price.', '["Fashion","Bags","70% off","Bestseller"]', 'published', 'manual', datetime('now'), datetime('now'), datetime('now')),
  ('ajio-outryt-trouser-443118370', 'fashion', 'Outryt by AZORTE', '443118370_jetblack', 'Outryt by AZORTE Rib Flared Trouser', 'outryt-by-azorte-rib-flared-trouser', 'Bestselling flared trouser from AJIO, currently marked 70% off. Check AJIO for the latest size, stock and price.', '["Fashion","Women","70% off","Bestseller"]', 'published', 'manual', datetime('now'), datetime('now'), datetime('now'));
--> statement-breakpoint
INSERT INTO merchant_listings (id, product_id, merchant, merchant_product_id, source_url, affiliate_url, status, created_at, updated_at)
VALUES
  ('ajio-listing-altheory-442710962', 'ajio-altheory-crossbody-442710962', 'ajio', '442710962_offwhite', 'https://www.ajio.com/altheory-by-azorte-rigid-crossbody-bag/p/442710962_offwhite', 'https://ajiotrk.vibconnect.in/click?campaign_id=1&pub_id=1072&url=https%3A%2F%2Fwww.ajio.com%2Faltheory-by-azorte-rigid-crossbody-bag%2Fp%2F442710962_offwhite', 'active', datetime('now'), datetime('now')),
  ('ajio-listing-outryt-443118370', 'ajio-outryt-trouser-443118370', 'ajio', '443118370_jetblack', 'https://www.ajio.com/outryt-by-azorte-rib-flared-trouser/p/443118370_jetblack', 'https://ajiotrk.vibconnect.in/click?campaign_id=1&pub_id=1072&url=https%3A%2F%2Fwww.ajio.com%2Foutryt-by-azorte-rib-flared-trouser%2Fp%2F443118370_jetblack', 'active', datetime('now'), datetime('now'));
--> statement-breakpoint
PRAGMA optimize;
