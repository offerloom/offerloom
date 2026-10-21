-- Myntra and Croma are collected from the owner's Mac (laptop-stores scheduler).
INSERT INTO merchants (id, name, status, sync_mode, consecutive_failures, updated_at)
SELECT 'myntra', 'Myntra', 'active', 'manual', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'myntra');
--> statement-breakpoint
UPDATE merchants SET status = 'active', updated_at = datetime('now') WHERE id = 'croma' AND status = 'pending';
