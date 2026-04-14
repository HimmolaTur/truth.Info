/**
 * Сбор материалов с meduza.io — вывод в JSONL.
 * См. scripts/meduzaSource.cjs (ядро) и scripts/meduza-import-local-db.cjs (запись в локальную БД).
 */
const fs = require("fs");
const path = require("path");
const { collectMeduzaArticles } = require("./meduzaSource.cjs");

const DEFAULT_OUT = path.join(__dirname, "..", "data", "meduza-articles.jsonl");

function parseArgs(argv) {
  const o = {
    out: DEFAULT_OUT,
    sitemap: false,
    fetchPages: false,
    limit: 0,
    delayMs: 600,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") o.help = true;
    else if (a === "--sitemap") o.sitemap = true;
    else if (a === "--fetch-pages") o.fetchPages = true;
    else if (a === "--out" && argv[i + 1]) {
      o.out = path.resolve(argv[++i]);
    } else if (a === "--limit" && argv[i + 1]) {
      o.limit = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a === "--delay-ms" && argv[i + 1]) {
      o.delayMs = Math.max(0, parseInt(argv[++i], 10) || 0);
    }
  }
  return o;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`Usage: node scripts/fetch-meduza-articles.cjs [options]

Options:
  --out <file>     JSONL output (default: data/meduza-articles.jsonl)
  --sitemap        Добавить URL из sitemap (если отвечает 200)
  --fetch-pages    Для записей без bodyHtml — JSON-LD со страницы
  --limit N        Макс. страниц для --fetch-pages (0 = все кандидаты)
  --delay-ms N     Пауза между запросами страниц (default 600)
`);
    process.exit(0);
  }

  const list = await collectMeduzaArticles({
    sitemap: opts.sitemap,
    fetchPages: opts.fetchPages,
    fetchLimit: opts.limit,
    delayMs: opts.delayMs,
  });

  const outDir = path.dirname(opts.out);
  fs.mkdirSync(outDir, { recursive: true });
  const lines = list.map((o) => JSON.stringify(o));
  fs.writeFileSync(opts.out, lines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${list.length} records → ${opts.out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
