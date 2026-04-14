/**
 * Парсинг Meduza (RSS + опционально sitemap и догрузка страниц) и сохранение только в
 * локальную PostgreSQL. Используется ТОЛЬКО переменная LOCAL_DATABASE_URL из .env.local
 * (не DATABASE_URL), чтобы случайно не писать в удалённый Supabase.
 *
 * Подключение к БД (по приоритету):
 *   1) LOCAL_DATABASE_URL в .env.local
 *   2) Если DB_HOST — localhost/127.0.0.1, собирается URL из DB_USER, DB_PASSWORD, DB_PORT, DB_NAME
 *
 * Пример только через Docker:
 *   docker run -d --name truthinfo-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=truthinfo -p 5432:5432 postgres:16-alpine
 *   LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/truthinfo
 *
 * Запуск:
 *   npm run meduza:import-local
 *   node scripts/meduza-import-local-db.cjs --sitemap --fetch-pages --limit 100
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { collectMeduzaArticles } = require("./meduzaSource.cjs");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Нет .env.local. Создайте файл и задайте LOCAL_DATABASE_URL.");
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

function resolveLocalDatabaseUrl() {
  const explicit = process.env.LOCAL_DATABASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();
  const host = (process.env.DB_HOST || "").trim().toLowerCase();
  if (!/^(localhost|127\.0\.0\.1|::1)$/.test(host)) return null;
  const user = process.env.DB_USER || "postgres";
  const pass = process.env.DB_PASSWORD || "";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME || "postgres";
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(pass);
  return `postgresql://${u}:${p}@${host}:${port}/${name}`;
}

function sslOptionForUrl(connectionString) {
  try {
    const u = new URL(connectionString);
    const h = u.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
  } catch {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: false };
}

function parsePubDate(s) {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseArgs(argv) {
  const o = {
    sitemap: true,
    fetchPages: false,
    limit: 0,
    delayMs: 600,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") o.help = true;
    else if (a === "--no-sitemap") o.sitemap = false;
    else if (a === "--sitemap") o.sitemap = true;
    else if (a === "--fetch-pages") o.fetchPages = true;
    else if (a === "--limit" && argv[i + 1]) {
      o.limit = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a === "--delay-ms" && argv[i + 1]) {
      o.delayMs = Math.max(0, parseInt(argv[++i], 10) || 0);
    }
  }
  return o;
}

const UPSERT = `
INSERT INTO meduza_import (
  url, guid, section, feeds, title, pub_date,
  description_html, body_html, image_url, json_ld, kind, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
)
ON CONFLICT (url) DO UPDATE SET
  guid = COALESCE(EXCLUDED.guid, meduza_import.guid),
  section = COALESCE(EXCLUDED.section, meduza_import.section),
  feeds = COALESCE(EXCLUDED.feeds, meduza_import.feeds),
  title = COALESCE(EXCLUDED.title, meduza_import.title),
  pub_date = COALESCE(EXCLUDED.pub_date, meduza_import.pub_date),
  description_html = COALESCE(EXCLUDED.description_html, meduza_import.description_html),
  body_html = COALESCE(EXCLUDED.body_html, meduza_import.body_html),
  image_url = COALESCE(EXCLUDED.image_url, meduza_import.image_url),
  json_ld = COALESCE(EXCLUDED.json_ld, meduza_import.json_ld),
  kind = EXCLUDED.kind,
  updated_at = NOW();
`;

async function ensureTable(client) {
  const sqlPath = path.join(
    __dirname,
    "..",
    "migrations",
    "create_meduza_import_table.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  await client.query(sql);
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`Usage: node scripts/meduza-import-local-db.cjs [options]

Требуется LOCAL_DATABASE_URL в .env.local (только локальный Postgres).

Options:
  --sitemap / --no-sitemap   Пробовать sitemap (по умолчанию: --sitemap)
  --fetch-pages              Догружать страницы без body (JSON-LD)
  --limit N                  Лимит страниц для --fetch-pages
  --delay-ms N
`);
    process.exit(0);
  }

  loadEnvLocal();
  const localUrl = resolveLocalDatabaseUrl();
  if (!localUrl) {
    console.error(
      "Укажите LOCAL_DATABASE_URL или задайте DB_HOST=localhost и DB_NAME, DB_USER, DB_PASSWORD, DB_PORT в .env.local.\n" +
        "Удалённый DATABASE_URL этим скриптом не читается."
    );
    process.exit(1);
  }
  if (/supabase\.co|pooler\.supabase/i.test(localUrl) && !process.env.MEDUZA_ALLOW_REMOTE) {
    console.error(
      "Похоже, в LOCAL_DATABASE_URL указан хост Supabase. Для записи в удалённую БД выставьте MEDUZA_ALLOW_REMOTE=1 (не рекомендуется)."
    );
    process.exit(1);
  }

  try {
    const u = new URL(localUrl);
    const port = u.port || "5432";
    console.log(`Local DB: ${u.protocol}//${u.hostname}:${port}${u.pathname}`);
  } catch {
    console.log("Local DB: подключение по LOCAL_DATABASE_URL / DB_*");
  }

  console.log("Collecting Meduza items…");
  const list = await collectMeduzaArticles({
    sitemap: opts.sitemap,
    fetchPages: opts.fetchPages,
    fetchLimit: opts.limit,
    delayMs: opts.delayMs,
  });

  const client = new Client({
    connectionString: localUrl,
    ssl: sslOptionForUrl(localUrl),
  });
  await client.connect();
  await client.query("SET statement_timeout = '600s'");
  try {
    await ensureTable(client);
    let n = 0;
    for (const it of list) {
      const pub = parsePubDate(it.pubDate);
      await client.query(UPSERT, [
        it.url,
        it.guid || null,
        it.section || null,
        it.feed || null,
        it.title || null,
        pub,
        it.descriptionHtml || null,
        it.bodyHtml || null,
        it.imageUrl || null,
        it.jsonLd || null,
        it.kind || "rss",
      ]);
      n++;
      if (n % 50 === 0) console.log(`Upserted ${n}/${list.length}…`);
    }
    console.log(`Done. Upserted ${list.length} rows into meduza_import (local DB).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
