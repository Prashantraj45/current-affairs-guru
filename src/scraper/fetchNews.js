import http from 'http';
import https from 'https';
import puppeteer from 'puppeteer';
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
      data.items.slice(0, 10).forEach((item) => {
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

function fetchUrl(url, timeoutMs = 12000) {
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

// ─── HTML Helpers ─────────────────────────────────────────────────────────────

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

// ─── Section Extractor (H2/H3 based) ─────────────────────────────────────────

const SKIP_HEADINGS = /^(home|menu|search|login|register|subscribe|share|tags|related|comments|advertisement|achievers|mains\s*&|interview|drishti specials|current affairs$|news analysis$|editorial$|prelims facts|rapid fire|daily updates|be mains ready|pib|summary|today|date|join|follow|download|pdf|video|about|contact|privacy|terms)/i;

function extractDailySections(html, source, maxSections = 15) {
  const clean = stripNoise(html);
  const items = [];
  const sectionRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23]|$)/gi;
  let match;

  while ((match = sectionRe.exec(clean)) !== null && items.length < maxSections) {
    const rawTitle = stripTags(match[1]);
    if (rawTitle.length < 15 || rawTitle.length > 250) continue;
    if (SKIP_HEADINGS.test(rawTitle)) continue;

    const sectionBody = match[2] || '';
    const textParts = [];
    const pRe = /<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi;
    let pMatch;
    let charCount = 0;

    while ((pMatch = pRe.exec(sectionBody)) !== null && charCount < 600) {
      const text = stripTags(pMatch[1]);
      if (text.length > 20) {
        textParts.push(text);
        charCount += text.length;
      }
    }

    const summary = textParts.slice(0, 5).join(' | ').substring(0, 500);
    if (!summary || summary.trim() === rawTitle.trim()) continue;

    items.push({ title: rawTitle, summary, url: '', source, pubDate: new Date().toISOString() });
  }

  return items;
}

// ─── Date URL Builders ────────────────────────────────────────────────────────

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

function getDateParts(isoDate) {
  let d;
  if (isoDate) {
    d = new Date(isoDate + 'T00:00:00Z');
  } else {
    d = new Date(Date.now() - 86400000);
  }
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const dayNum = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  return { dd, mm, yyyy, dayNum, month };
}

// ─── Plain HTTP CA Sources ────────────────────────────────────────────────────

const CA_SOURCES = [
  {
    name: 'Drishti IAS - News Analysis',
    getUrl: ({ dd, mm, yyyy }) => `https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-analysis/${dd}-${mm}-${yyyy}`,
  },
  {
    name: 'Drishti IAS - Editorials',
    getUrl: ({ dd, mm, yyyy }) => `https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-editorials/${yyyy}-${mm}-${dd}`,
  },
  {
    name: 'Insights IAS',
    getUrl: ({ dd, mm, yyyy, dayNum, month }) => `https://www.insightsonindia.com/${yyyy}/${mm}/${dd}/upsc-current-affairs-${dayNum}-${month}-${yyyy}/`,
  },
  {
    name: 'Vision IAS - Daily Summary',
    getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}`,
  },
  {
    name: 'Vision IAS - The Hindu',
    getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}/the-hindu`,
  },
  {
    name: 'Vision IAS - Indian Express',
    getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}/the-indian-express`,
  },
  {
    name: 'Vision IAS - Economic Times',
    getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}/the-economic-times`,
  },
  {
    name: 'Vision IAS - Business Standard',
    getUrl: ({ dd, mm, yyyy }) => `https://visionias.in/current-affairs/upsc-daily-news-summary/${yyyy}-${mm}-${dd}/business-standard`,
  },
  {
    name: 'Vajiram & Ravi - Mains',
    getUrl: ({ dd, mm, yyyy }) => `https://vajiramandravi.com/current-affairs/upsc-mains-current-affairs/${yyyy}/${mm}/${dd}/`,
  },
  {
    name: 'Vajiram & Ravi - Prelims',
    getUrl: ({ dd, mm, yyyy }) => `https://vajiramandravi.com/current-affairs/upsc-prelims-current-affairs/${yyyy}/${mm}/${dd}/`,
  },
];

async function fetchCASites(maxPerSite = 15, dateParts) {
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

// ─── Puppeteer: Vision IAS Subject Pages ─────────────────────────────────────

// Subject IDs 1–15 on Vision IAS cover the full UPSC syllabus range
const VISION_SUBJECT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const VISION_SUBJECT_URL = (id) =>
  `https://visionias.in/current-affairs/search?subject=${id}&sort=recent&query=&type=articles&initiative=&time=any`;

async function scrapeVisionSubjectPage(page, subjectId) {
  const url = VISION_SUBJECT_URL(subjectId);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    // Wait for article cards to render
    await page.waitForSelector('article, .article-card, .ca-card, [class*="article"], [class*="card"]', { timeout: 8000 }).catch(() => {});

    const items = await page.evaluate((subjectId) => {
      const results = [];

      // Try multiple selector patterns Vision IAS might use
      const cards = [
        ...document.querySelectorAll('article'),
        ...document.querySelectorAll('[class*="article-card"]'),
        ...document.querySelectorAll('[class*="ca-card"]'),
        ...document.querySelectorAll('[class*="ArticleCard"]'),
        ...document.querySelectorAll('[class*="news-card"]'),
      ];

      // Deduplicate DOM nodes
      const seen = new Set();
      const unique = cards.filter((el) => {
        if (seen.has(el)) return false;
        seen.add(el);
        return true;
      });

      for (const card of unique.slice(0, 8)) {
        // Extract title — try heading tags first
        const titleEl = card.querySelector('h1,h2,h3,h4,a[href*="current-affairs"]');
        const title = titleEl?.innerText?.trim() || '';
        if (!title || title.length < 10) continue;

        // Extract summary from paragraph or description element
        const summaryEl = card.querySelector('p, [class*="description"], [class*="summary"], [class*="excerpt"]');
        const summary = summaryEl?.innerText?.trim()?.substring(0, 400) || '';

        const linkEl = card.querySelector('a[href]');
        const url = linkEl?.href || '';

        results.push({
          title,
          summary,
          url,
          source: `Vision IAS - Subject ${subjectId}`,
          pubDate: new Date().toISOString(),
        });
      }

      return results;
    }, subjectId);

    console.log(`  ✓ Vision IAS subject ${subjectId}: ${items.length} articles`);
    return items;
  } catch (err) {
    console.error(`  ✗ Vision IAS subject ${subjectId}:`, err.message);
    return [];
  }
}

async function fetchVisionSubjects() {
  const all = [];
  let browser;

  try {
    // executablePath: resolve against the same cache dir puppeteer.config.cjs uses,
    // so Render finds Chrome inside the project directory at runtime.
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
    console.log(`[Puppeteer] Using Chrome at: ${executablePath}`);
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    // Run subjects in batches of 5 concurrently
    const BATCH_SIZE = 5;
    for (let i = 0; i < VISION_SUBJECT_IDS.length; i += BATCH_SIZE) {
      const batch = VISION_SUBJECT_IDS.slice(i, i + BATCH_SIZE);
      console.log(`[Puppeteer] Vision IAS subjects batch: ${batch.join(', ')}`);

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          try {
            return await scrapeVisionSubjectPage(page, id);
          } finally {
            await page.close().catch(() => {});
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') all.push(...result.value);
      }
    }
  } catch (err) {
    console.error('[Puppeteer] Browser error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  console.log(`[Puppeteer] Vision IAS subjects total: ${all.length} articles`);
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
 * Fetch from all sources — RSS, plain-HTTP CA sites, and Puppeteer Vision IAS subjects.
 * Returns up to `limit` deduplicated items.
 *
 * Interleave order: CA → Subject → RSS so AI always gets editorial-heavy content first.
 */
export async function fetchNews(limit = 80, targetDate) {
  const dateParts = getDateParts(targetDate);
  console.log(`[fetchNews] Target date: ${dateParts.yyyy}-${dateParts.mm}-${dateParts.dd}`);

  const [rssResult, caResult, subjectResult] = await Promise.allSettled([
    fetchRSS(),
    fetchCASites(15, dateParts),
    fetchVisionSubjects(),
  ]);

  const rss = rssResult.status === 'fulfilled' ? rssResult.value : [];
  const ca = caResult.status === 'fulfilled' ? caResult.value : [];
  const subjects = subjectResult.status === 'fulfilled' ? subjectResult.value : [];

  // Interleave: 3 CA → 2 Subject → 1 RSS per round
  const interleaved = [];
  const caQ = [...ca];
  const subQ = [...subjects];
  const rssQ = [...rss];

  while (caQ.length || subQ.length || rssQ.length) {
    for (let i = 0; i < 3 && caQ.length; i++) interleaved.push(caQ.shift());
    for (let i = 0; i < 2 && subQ.length; i++) interleaved.push(subQ.shift());
    if (rssQ.length) interleaved.push(rssQ.shift());
  }

  const merged = deduplicateByTitle(interleaved);
  console.log(`✓ Sources: RSS ${rss.length}, CA ${ca.length}, Subjects ${subjects.length} → merged ${merged.length}`);
  return merged.slice(0, limit);
}

export async function fetchNewsByKeywords(keywords = [], limit = 40, targetDate) {
  const all = await fetchNews(80, targetDate);
  if (!keywords.length) return all.slice(0, limit);
  const filtered = all.filter((item) => {
    const text = (item.title + ' ' + item.summary).toLowerCase();
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  });
  return filtered.slice(0, limit);
}
