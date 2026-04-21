/**
 * Удаляет строки news, у которых календарная дата created_at (Europe/Moscow) не совпадает с «сегодня».
 * Запуск: npm run db:prune-news-not-today
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.local");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    await c.query("SET statement_timeout = '120s'");
    const today = await c.query(
      `SELECT to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')::date, 'YYYY-MM-DD') AS d`
    );
    const moscowToday = today.rows[0].d;
    console.log("Moscow calendar «today»:", moscowToday);

    const before = await c.query(`SELECT COUNT(*)::int AS n FROM news`);
    const del = await c.query(
      `DELETE FROM news
       WHERE (created_at AT TIME ZONE 'Europe/Moscow')::date <> $1::date
       RETURNING id`,
      [moscowToday]
    );
    const after = await c.query(`SELECT COUNT(*)::int AS n FROM news`);
    console.log(
      "Deleted:",
      del.rowCount,
      "| Was:",
      before.rows[0].n,
      "| Left:",
      after.rows[0].n
    );
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
