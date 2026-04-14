/**
 * Удаляет схему public и очищает supabase_migrations.schema_migrations.
 * Требуется DATABASE_URL в .env.local (роль с правами на DROP SCHEMA public).
 *
 * Далее: npm run supabase:push
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

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "..", "supabase", "fresh_public_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  /* DROP SCHEMA CASCADE ждёт блокировок; 0 = без таймаута в сессии */
  await client.query("SET statement_timeout = 0");
  await client.query("SET lock_timeout = 0");

  console.log("Running supabase/fresh_public_schema.sql …");
  console.log("(Если висит долго — останови npm run dev и другие клиенты к БД.)");
  await client.query(sql);
  await client.end();

  console.log("OK: public schema recreated, migration history cleared.");
  console.log("Next: npm run supabase:push   (нужны supabase login + supabase link)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
