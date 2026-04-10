import https from 'https';
import http from 'http';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  customFields: { item: [['content:encoded', 'fullContent'], ['description', 'description']] },
});

// ─── RSS Feeds ────────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  { name: 'Indian Express', url: 'https://indianexpress.com/feed/' },
  { name: 'The Hindu - India', url: 'https://www.thehindu.com/news/national/?service=rss' },
  { name: 'The Hindu - World', url: 'https://www.thehindu.com/news/international/?service=rss' },
];

async function fetchRSS() {
  const items = [];
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching RSS: ${feed.name}...`);
      const data = await parser.parseURL(feed.url);
      data.items.slice(0, 8).forEach((item) => {
        items.push({
          title: item.title || 'Untitled',
          summary: item.contentSnippet || item.description || '',
          url: item.link || '',
          source: feed.name,
          pubDate: item.pubDate || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error(`RSS error [${feed.name}]:`, err.message);
    }
  }
  return items;
}

// ─── HTTP Fetch ───────────────────────────────────────────────────────────────

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivilLensBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode === 404) return reject(new Error('404 Not Found'));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(data));
    });
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// ─── HTML Content Extractor ───────────────────────────────────────────────────

/**
 * Strip noise HTML — scripts, styles, nav, footer, sidebar, ads.
 */
function stripNoise(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, '').replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function stripTags(s) {
  return decodeHtml(s.replace(/<[^>]+>/g, ' '));
}

/**
 * Extract news sections from a CA daily analysis page.
 * Splits content by H2/H3 headings → each heading + following text = one news item.
 */
function extractDailySections(html, source, maxSections = 8) {
  const clean = stripNoise(html);
  const items = [];

  // Split by h2 or h3 headings
  const sectionRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23]|$)/gi;
  let match;

  while ((match = sectionRe.exec(clean)) !== null && items.length < maxSections) {
    const rawTitle = stripTags(match[1]);
    if (rawTitle.length < 15 || rawTitle.length > 200) continue;

    // Skip navigation, sidebar, and structural headings (not actual topics)
    if (/^(home|menu|search|login|register|subscribe|share|tags|related|comments|advertisement|achievers|mains\s*&|interview|drishti specials|current affairs$|news analysis$|editorial|prelims facts|rapid fire|daily updates|be mains ready|pib|summary|today|date|join|follow|download|pdf|video)/i.test(rawTitle)) continue;

    const sectionBody = match[2] || '';

    // Collect text from <p> and <li> tags in this section
    const textParts = [];
    const pRe = /<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi;
    let pMatch;
    let charCount = 0;
    while ((pMatch = pRe.exec(sectionBody)) !== null && charCount < 400) {
      const text = stripTags(pMatch[1]);
      if (text.length > 20) {
        textParts.push(text);
        charCount += text.length;
      }
    }

    const summary = textParts.slice(0, 4).join(' | ').substring(0, 350);

    // Require real content — skip if no text beyond the title
    if (!summary || summary.trim() === rawTitle.trim()) continue;

    items.push({
      title: rawTitle,
      summary,
      url: '',
      source,
      pubDate: new Date().toISOString(),
    });
  }

  return items;
}

// ─── Date URL Builders ────────────────────────────────────────────────────────

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

/**
 * Parse a YYYY-MM-DD string as UTC midnight to avoid timezone shifts.
 * If no date provided, returns parts for yesterday UTC.
 */
function getDateParts(isoDate) {
  let d;
  if (isoDate) {
    d = new Date(isoDate + 'T00:00:00Z');
  } else {
    // Default: yesterday UTC
    d = new Date(Date.now() - 86400000);
  }
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const dayNum = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  return { dd, mm, yyyy, dayNum, month };
}

// ─── CA Daily Fetcher ─────────────────────────────────────────────────────────

const CA_SOURCES = [
  { name: 'Drishti IAS',        getUrl: ({ dd, mm, yyyy }) => `https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-analysis/${dd}-${mm}-${yyyy}` },
  { name: 'Drishti Editorials', getUrl: ({ dd, mm, yyyy }) => `https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-editorials/${yyyy}-${mm}-${dd}` },
  { name: 'Insights IAS',       getUrl: ({ dd, mm, yyyy, dayNum, month }) => `https://www.insightsonindia.com/${yyyy}/${mm}/${dd}/upsc-current-affairs-${dayNum}-${month}-${yyyy}/` },
  { name: 'Vision IAS',         getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}` },
  { name: 'Vajiram & Ravi',     getUrl: ({ dd, mm, yyyy }) => `https://vajiramandravi.com/current-affairs/upsc-mains-current-affairs/${yyyy}/${mm}/${dd}/` },
];

async function fetchCASites(maxPerSite = 7, dateParts) {
  const all = [];

  await Promise.allSettled(
    CA_SOURCES.map(async ({ name, getUrl }) => {
      const url = getUrl(dateParts);
      console.log(`Scraping ${name}: ${url}`);
      try {
        const html = await fetchUrl(url);
        const sections = extractDailySections(html, name, maxPerSite);
        console.log(`  ✓ ${sections.length} sections from ${name}`);
        all.push(...sections);
      } catch (err) {
        console.error(`  ✗ ${name}:`, err.message);
      }
    })
  );

  return all;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function deduplicateByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeTitle(item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch from all sources. Interleaves CA sections with RSS so the
 * compressNews selector (which takes top 8) always sees CA content.
 *
 * Order: CA1, CA2, RSS1, CA3, CA4, RSS2, CA5, CA6, RSS3 …
 */
export async function fetchNews(limit = 20, targetDate) {
  const dateParts = getDateParts(targetDate);
  console.log(`[fetchNews] Target date: ${dateParts.yyyy}-${dateParts.mm}-${dateParts.dd}`);
  const [rssResult, caResult] = await Promise.allSettled([fetchRSS(), fetchCASites(7, dateParts)]);

  const rss = rssResult.status === 'fulfilled' ? rssResult.value : [];
  const ca = caResult.status === 'fulfilled' ? caResult.value : [];

  // Interleave 2 CA items per 1 RSS item so CA is always represented
  const interleaved = [];
  const rssQ = [...rss];
  const caQ = [...ca];
  while (rssQ.length || caQ.length) {
    if (caQ.length) interleaved.push(caQ.shift());
    if (caQ.length) interleaved.push(caQ.shift());
    if (rssQ.length) interleaved.push(rssQ.shift());
  }

  const merged = deduplicateByTitle(interleaved);
  console.log(`✓ Sources: RSS ${rss.length}, CA ${ca.length} → merged ${merged.length}`);
  return merged.slice(0, limit);
}

export async function fetchNewsByKeywords(keywords = [], limit = 15, targetDate) {
  const all = await fetchNews(50, targetDate);
  if (!keywords.length) return all.slice(0, limit);
  const filtered = all.filter((item) => {
    const text = (item.title + ' ' + item.summary).toLowerCase();
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  });
  return filtered.slice(0, limit);
}
