/**
 * Снимает пометку «главная тема» со всех новостей и случайно помечает часть из них.
 * Usage: npm run db:random-featured
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

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: countRows } = await client.query(
    "SELECT COUNT(*)::int AS c FROM news"
  );
  const total = countRows[0].c;
  if (total === 0) {
    console.log("В таблице news нет записей.");
    await client.end();
    return;
  }

  const cap = Math.min(8, total);
  const howMany = Math.max(1, Math.ceil(Math.random() * cap));

  await client.query("UPDATE news SET is_featured = false");
  await client.query(
    `UPDATE news SET is_featured = true WHERE id IN (
      SELECT id FROM news ORDER BY RANDOM() LIMIT $1
    )`,
    [howMany]
  );

  const { rows: featured } = await client.query(
    "SELECT id, title FROM news WHERE is_featured = true ORDER BY id"
  );

  console.log(
    `Помечено как главные темы: ${howMany} из ${total} (случайный выбор, не больше 8).`
  );
  featured.forEach((r) => console.log(`  #${r.id} ${String(r.title).slice(0, 60)}…`));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
