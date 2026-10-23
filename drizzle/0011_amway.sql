-- Amway India: the owner is an ABO; products come from hand-filled deals-sheet.csv rows (no scraping).
INSERT INTO merchants (id, name, status, sync_mode, consecutive_failures, updated_at)
SELECT 'amway', 'Amway', 'active', 'manual', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'amway');
