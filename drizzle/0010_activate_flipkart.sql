-- 0002 seeded Flipkart as 'pending'; 0009 only inserted when missing. Activate it for the cloud collector.
UPDATE merchants SET status = 'active', updated_at = datetime('now') WHERE id = 'flipkart' AND status = 'pending';
