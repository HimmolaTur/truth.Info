/**
 * Привязка проекта: npx supabase link --project-ref …
 *
 * Вариант A (интерактивно): в своём терминале выполни `npx supabase login`, затем `npm run supabase:link`.
 * Вариант B (без браузера): в .env.local добавь SUPABASE_ACCESS_TOKEN=... (Dashboard → Account → Access Tokens),
 *   тогда этот скрипт подставит его из .env.local.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PROJECT_REF = "fsfiegnvwhvllpnvrflz";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
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

loadEnvLocal();

const r = spawnSync(`npx supabase link --project-ref ${PROJECT_REF}`, {
  stdio: "inherit",
  env: process.env,
  cwd: path.join(__dirname, ".."),
  shell: true,
});

if (r.status !== 0 && !process.env.SUPABASE_ACCESS_TOKEN) {
  console.error(`
Не найден доступ к Supabase API.
  • Выполни: npx supabase login
  • или добавь в .env.local строку: SUPABASE_ACCESS_TOKEN=sbp_...
`);
}

process.exit(r.status ?? 1);
