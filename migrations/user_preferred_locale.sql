-- Preferred UI language (ru | en | uk | de), persisted for logged-in users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(8) DEFAULT NULL;
