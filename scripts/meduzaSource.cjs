/**
 * Общая логика сбора записей с meduza.io (RSS, опционально sitemap и загрузка страниц).
 */
const fetch = require("node-fetch");

const RSS_FEEDS = [
  { url: "https://meduza.io/rss/all", id: "all" },
  { url: "https://meduza.io/rss/news", id: "news" },
  { url: "https://meduza.io/rss/articles", id: "articles" },
  { url: "https://meduza.io/rss/fun", id: "fun" },
];

const SITEMAP_SEEDS = [
  "https://meduza.io/sitemap.xml",
  "https://meduza.io/sitemap_index.xml",
];

const MATERIAL_PATH =
  /^https:\/\/meduza\.io\/(news|feature|articles|shapito|games|podcasts)\//i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "truth-info-meduza-fetch/1.0 (educational; +https://meduza.io)",
      Accept: opts.accept || "*/*",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
  return res.text();
}

function cdataField(block, tagName) {
  const esc = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<${esc}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${esc}>`,
    "i"
  );
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function plainField(block, tagName) {
  const esc = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${esc}[^>]*>\\s*([^<]*?)\\s*</${esc}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function field(block, tagName) {
  return cdataField(block, tagName) ?? plainField(block, tagName);
}

function enclosureUrl(block) {
  const m = block.match(/<enclosure[^>]+url="([^"]+)"/i);
  return m ? m[1] : null;
}

function sectionFromUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    return p[0] || "unknown";
  } catch {
    return "unknown";
  }
}

function parseRssItems(xml, feedId) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const link = field(block, "link") || plainField(block, "link");
    if (!link || !link.startsWith("http")) continue;
    const url = link.split("#")[0];
    items.push({
      source: "meduza.io",
      feed: feedId,
      url,
      section: sectionFromUrl(url),
      guid: field(block, "guid") || plainField(block, "guid"),
      title: field(block, "title") || plainField(block, "title"),
      pubDate: field(block, "pubDate") || plainField(block, "pubDate"),
      descriptionHtml: field(block, "description") || plainField(block, "description"),
      bodyHtml: field(block, "content:encoded") || null,
      imageUrl: enclosureUrl(block),
      kind: "rss",
    });
  }
  return items;
}

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

async function collectSitemapUrls() {
  const urls = new Set();
  const visited = new Set();
  const queue = [...SITEMAP_SEEDS];
  const MAX_SITEMAP_FILES = 400;

  while (queue.length && visited.size < MAX_SITEMAP_FILES) {
    const smUrl = queue.shift();
    if (!smUrl || visited.has(smUrl)) continue;
    visited.add(smUrl);
    let xml;
    try {
      xml = await fetchText(smUrl, { accept: "application/xml,text/xml" });
    } catch (e) {
      console.warn(`sitemap skip: ${smUrl} (${e.message})`);
      continue;
    }
    const locs = extractLocs(xml);
    for (const loc of locs) {
      if (/meduza\.io/i.test(loc) && /\.xml(\?|$)/i.test(loc)) {
        if (!visited.has(loc)) queue.push(loc);
      } else if (MATERIAL_PATH.test(loc)) {
        urls.add(loc.split("#")[0]);
      }
    }
  }
  return urls;
}

function extractLdNewsArticle(html) {
  const m = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m) return null;
  try {
    const j = JSON.parse(m[1].trim());
    if (j["@type"] === "NewsArticle" || j["@type"] === "Article") return j;
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {{ sitemap?: boolean, fetchPages?: boolean, fetchLimit?: number, delayMs?: number }} opts
 */
async function collectMeduzaArticles(opts = {}) {
  const sitemap = !!opts.sitemap;
  const fetchPages = !!opts.fetchPages;
  const fetchLimit = opts.fetchLimit ?? 0;
  const delayMs = opts.delayMs ?? 600;

  const byUrl = new Map();

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchText(feed.url, { accept: "application/rss+xml" });
      const items = parseRssItems(xml, feed.id);
      console.log(`RSS ${feed.id}: ${items.length} items`);
      for (const it of items) {
        if (!byUrl.has(it.url)) byUrl.set(it.url, it);
        else {
          const cur = byUrl.get(it.url);
          if (!cur.bodyHtml && it.bodyHtml) cur.bodyHtml = it.bodyHtml;
          cur.feed = `${cur.feed},${feed.id}`;
        }
      }
    } catch (e) {
      console.warn(`RSS fail ${feed.url}: ${e.message}`);
    }
  }

  if (sitemap) {
    const sm = await collectSitemapUrls();
    console.log(`Sitemap material URLs: ${sm.size}`);
    for (const url of sm) {
      if (byUrl.has(url)) continue;
      byUrl.set(url, {
        source: "meduza.io",
        feed: "sitemap",
        url,
        guid: url,
        title: null,
        pubDate: null,
        descriptionHtml: null,
        bodyHtml: null,
        imageUrl: null,
        kind: "sitemap",
        section: sectionFromUrl(url),
      });
    }
  }

  const list = [...byUrl.values()];

  if (fetchPages) {
    let n = 0;
    for (const it of list) {
      if (it.bodyHtml) continue;
      if (fetchLimit > 0 && n >= fetchLimit) break;
      try {
        const html = await fetchText(it.url, { accept: "text/html" });
        const ld = extractLdNewsArticle(html);
        if (ld) {
          it.title = it.title || ld.headline || null;
          it.pubDate = it.pubDate || ld.datePublished || ld.dateModified || null;
          it.descriptionHtml = it.descriptionHtml || ld.description || null;
          it.imageUrl =
            it.imageUrl || (typeof ld.image === "string" ? ld.image : null);
          it.jsonLd = ld;
        }
        n++;
        if (delayMs) await sleep(delayMs);
      } catch (e) {
        console.warn(`page ${it.url}: ${e.message}`);
      }
    }
    console.log(`Fetched pages (JSON-LD): ${n}`);
  }

  return list;
}

module.exports = {
  RSS_FEEDS,
  collectMeduzaArticles,
  fetchText,
  extractLdNewsArticle,
};
