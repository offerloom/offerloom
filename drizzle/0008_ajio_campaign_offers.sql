-- AJIO ACE campaign callouts imported automatically from AJIO Affiliate Support emails.
CREATE TABLE IF NOT EXISTS ajio_campaign_offers (
  short_code TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  campaign TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_through TEXT NOT NULL,
  source_message_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ajio_campaign_offers_valid ON ajio_campaign_offers (valid_through);
