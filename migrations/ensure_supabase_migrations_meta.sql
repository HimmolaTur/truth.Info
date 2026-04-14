-- Служебная схема Supabase CLI / некоторых инструментов панели.
-- Ошибка: relation "supabase_migrations.schema_migrations" does not exist
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text NOT NULL PRIMARY KEY,
  statements text[],
  name text
);
