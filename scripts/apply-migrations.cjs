/**
 * Applies SQL files from /migrations to the database using DATABASE_URL from .env.local
 * Usage: npm run db:migrate
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.local found. Set DATABASE_URL there.");
    process.exit(1);
  }
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const ORDER = [
  "ensure_supabase_migrations_meta.sql",
  "create_news_table.sql",
  "add_users_role.sql",
  "create_forum_bans.sql",
  "create_forum_tables.sql",
  "news_admin_fields.sql",
  "news_image_url_local.sql",
  "roles_permissions.sql",
  "roles_granular_permissions.sql",
  "user_preferred_locale.sql",
  "create_meduza_import_table.sql",
];

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query("SET statement_timeout = '300s'");
  await client.query("SET lock_timeout = '120s'");
  const dir = path.join(__dirname, "..", "migrations");

  for (const name of ORDER) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) {
      console.warn("Skip (missing):", name);
      continue;
    }
    const sql = fs.readFileSync(file, "utf8");
    console.log("Applying:", name);
    await client.query(sql);
    console.log("OK:", name);
  }

  await client.end();
  console.log("Migrations finished.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
