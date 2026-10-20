-- Flipkart deals discovered and price-checked by the cloud browser collector (no affiliate programme).
INSERT INTO merchants (id, name, status, sync_mode, consecutive_failures, updated_at)
SELECT 'flipkart', 'Flipkart', 'active', 'manual', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'flipkart');
