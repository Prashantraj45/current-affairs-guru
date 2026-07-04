import http from 'http';
import https from 'https';
import puppeteer from 'puppeteer';
import Parser from 'rss-parser';
import fs from 'fs';

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
        // Vision IAS new DOM structure: they use an <a> tag directly as the card, usually with a date in the URL
        ...document.querySelectorAll('a[href*="/202"][class*="block"]')
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
        const titleEl = card.querySelector('h1,h2,h3,h4') || (card.tagName.toLowerCase() === 'a' ? card : card.querySelector('a[href*="current-affairs"]'));
        let title = titleEl?.innerText?.trim() || '';
        // Often titles have random prefixes or they are too short
        if (!title || title.length < 10) continue;

        // Extract summary from paragraph or description element
        const summaryEl = card.querySelector('p, [class*="description"], [class*="summary"], [class*="excerpt"]');
        const summary = summaryEl?.innerText?.trim()?.substring(0, 400) || '';

        // Extract URL
        const url = card.tagName.toLowerCase() === 'a' ? card.href : (card.querySelector('a[href]')?.href || '');

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
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
    
    if (!fs.existsSync(executablePath)) {
      const fallbacks = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ];
      for (const p of fallbacks) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

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

// ─── PIB (Press Information Bureau) ──────────────────────────────────────────
// Strategy:
//   1. Hindi RSS gives PRIDs for the most recent ~20 national releases (PRIDs are language-agnostic)
//   2. Each PRID is fetched via PressReleaseIframePage.aspx?lang=1 which returns English text
//   3. Ministry name in MinistryName div comes in Hindi → translate via static map
//   4. Releases with no substantial English content are dropped

const PIB_RSS = 'https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&reg=48';
const PIB_IFRAME = (prid) =>
  `https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=${prid}&reg=48&lang=1`;

const PIB_MINISTRY_MAP = {
  'प्रधानमंत्री कार्यालय': "Prime Minister's Office",
  'वित्त मंत्रालय': 'Ministry of Finance',
  'गृह मंत्रालय': 'Ministry of Home Affairs',
  'विदेश मंत्रालय': 'Ministry of External Affairs',
  'रक्षा मंत्रालय': 'Ministry of Defence',
  'शिक्षा मंत्रालय': 'Ministry of Education',
  'स्वास्थ्य एवं परिवार कल्याण मंत्रालय': 'Ministry of Health & Family Welfare',
  'पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय': 'Ministry of Environment, Forest & Climate Change',
  'विज्ञान और प्रौद्योगिकी मंत्रालय': 'Ministry of Science & Technology',
  'वाणिज्य एवं उद्योग मंत्रालय': 'Ministry of Commerce & Industry',
  'कृषि एवं किसान कल्याण मंत्रालय': 'Ministry of Agriculture & Farmers Welfare',
  'ग्रामीण विकास मंत्रालय': 'Ministry of Rural Development',
  'रेल मंत्रालय': 'Ministry of Railways',
  'सड़क परिवहन और राजमार्ग मंत्रालय': 'Ministry of Road Transport & Highways',
  'जल शक्ति मंत्रालय': 'Ministry of Jal Shakti',
  'ऊर्जा मंत्रालय': 'Ministry of Power',
  'इलेक्ट्रॉनिक्स और सूचना प्रौद्योगिकी मंत्रालय': 'Ministry of Electronics & IT',
  'नवीन और नवीकरणीय ऊर्जा मंत्रालय': 'Ministry of New & Renewable Energy',
  'श्रम और रोजगार मंत्रालय': 'Ministry of Labour & Employment',
  'कानून और न्याय मंत्रालय': 'Ministry of Law & Justice',
  'संसदीय कार्य मंत्रालय': 'Ministry of Parliamentary Affairs',
  'पेट्रोलियम और प्राकृतिक गैस मंत्रालय': 'Ministry of Petroleum & Natural Gas',
  'आवास और शहरी कार्य मंत्रालय': 'Ministry of Housing & Urban Affairs',
  'मत्स्य पालन, पशुपालन और डेयरी मंत्रालय': 'Ministry of Fisheries, Animal Husbandry & Dairying',
  'सूचना और प्रसारण मंत्रालय': 'Ministry of Information & Broadcasting',
  'राष्ट्रपति सचिवालय': "President's Secretariat",
  'उपराष्ट्रपति सचिवालय': "Vice President's Secretariat",
  'कैबिनेट': 'Cabinet',
  'कैबिनेट सचिवालय': 'Cabinet Secretariat',
  'अंतरिक्ष विभाग': 'Department of Space',
  'परमाणु ऊर्जा विभाग': 'Department of Atomic Energy',
  'नीति आयोग': 'NITI Aayog',
  'भारत निर्वाचन आयोग': 'Election Commission of India',
  'इस्पात मंत्रालय': 'Ministry of Steel',
  'खान मंत्रालय': 'Ministry of Mines',
  'कौशल विकास और उद्यमिता मंत्रालय': 'Ministry of Skill Development & Entrepreneurship',
  'सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय': 'Ministry of Statistics & Programme Implementation',
  'आयुष मंत्रालय': 'Ministry of Ayush',
  'महिला एवं बाल विकास मंत्रालय': 'Ministry of Women & Child Development',
  'सामाजिक न्याय और अधिकारिता मंत्रालय': 'Ministry of Social Justice & Empowerment',
  'जनजातीय कार्य मंत्रालय': 'Ministry of Tribal Affairs',
  'अल्पसंख्यक कार्य मंत्रालय': 'Ministry of Minority Affairs',
  'युवा कार्यक्रम और खेल मंत्रालय': 'Ministry of Youth Affairs & Sports',
  'पंचायती राज मंत्रालय': 'Ministry of Panchayati Raj',
  'सहकारिता मंत्रालय': 'Ministry of Cooperation',
  'खाद्य प्रसंस्करण उद्योग मंत्रालय': 'Ministry of Food Processing Industries',
  'नागर विमानन मंत्रालय': 'Ministry of Civil Aviation',
  'पत्तन, पोत परिवहन और जलमार्ग मंत्रालय': 'Ministry of Ports, Shipping & Waterways',
  'वस्त्र मंत्रालय': 'Ministry of Textiles',
  'उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय': 'Ministry of Consumer Affairs, Food & Public Distribution',
  'भारी उद्योग मंत्रालय': 'Ministry of Heavy Industries',
  'कोयला मंत्रालय': 'Ministry of Coal',
  'रसायन और उर्वरक मंत्रालय': 'Ministry of Chemicals & Fertilizers',
  'कॉर्पोरेट कार्य मंत्रालय': 'Ministry of Corporate Affairs',
};

function translateMinistry(raw) {
  const t = raw.trim();
  if (PIB_MINISTRY_MAP[t]) return PIB_MINISTRY_MAP[t];
  // Devanagari → unknown ministry, just return PIB
  if (/[ऀ-ॿ]/.test(t)) return 'PIB';
  return t || 'PIB';
}

// PIB is behind Akamai CDN which blocks generic bot UAs.
// This wrapper sends browser-like headers so requests get through.
function fetchPIBUrl(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        Referer: 'https://www.pib.gov.in/',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPIBUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
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

// True if text has substantially more Latin than Devanagari characters.
function isEnglish(text) {
  const deva = (text.match(/[ऀ-ॿ]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return latin > deva * 2 && latin > 20;
}

async function fetchPIBPRIDs() {
  try {
    const xml = await fetchPIBUrl(PIB_RSS, 15000);
    const seen = new Set();
    const prids = [];
    const re = /PRID=(\d+)/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); prids.push(m[1]); }
    }
    return prids;
  } catch (err) {
    console.error('[PIB] RSS failed:', err.message);
    return [];
  }
}

async function fetchPIBRelease(prid) {
  try {
    const html = await fetchPIBUrl(PIB_IFRAME(prid), 15000);
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');

    // Title is in <h2 id="Titleh2"> on PIB IframePage
    const h2m = clean.match(/id="Titleh2"[^>]*>([\s\S]*?)<\/h2>/i);
    const title = h2m ? stripTags(h2m[1]).trim() : '';
    if (!title || title.length < 10 || !isEnglish(title)) return null;

    // Ministry — MinistryName div (Hindi text, translate via map)
    const minm = clean.match(/id="MinistryName"[^>]*>([\s\S]*?)<\/div>/i);
    const ministry = minm ? translateMinistry(stripTags(minm[1])) : 'PIB';

    // Body text — first 4 substantial English paragraphs
    const textParts = [];
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    let charCount = 0;
    while ((match = pRe.exec(clean)) !== null && charCount < 500) {
      const text = stripTags(match[1]).trim();
      const isNoise = /pic\.twitter\.com|twitter\.com|t\.co\/|instagram\.com|facebook\.com|youtu\.be|youtube\.com/i.test(text);
      if (text.length > 30 && isEnglish(text) && !isNoise) {
        textParts.push(text);
        charCount += text.length;
      }
    }

    const summary = textParts.slice(0, 4).join(' | ').substring(0, 500);

    return {
      title,
      summary,
      url: PIB_IFRAME(prid),
      source: `PIB - ${ministry}`,
      ministry,
      pubDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchPIB(maxItems = 20) {
  console.log('[PIB] Fetching RSS for PRIDs...');
  const prids = await fetchPIBPRIDs();

  if (!prids.length) {
    console.log('[PIB] No PRIDs from RSS');
    return [];
  }
  console.log(`[PIB] ${prids.length} PRIDs — fetching English releases in batches of 5...`);

  const BATCH = 5;
  const items = [];

  for (let i = 0; i < prids.length && items.length < maxItems; i += BATCH) {
    const batch = prids.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map((prid) => fetchPIBRelease(prid)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) items.push(r.value);
    }
  }

  console.log(`[PIB] ✓ ${items.length} English releases fetched`);
  return items;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

// Sort significant words so "India-US trade" and "US-India trade" share the same key.
// Words ≤3 chars are noise (the, of, in, a) and excluded.
function normalizeTitle(t) {
  return t.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 3)
    .sort()
    .slice(0, 8)
    .join(' ');
}

function deduplicateByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeTitle(item.title);
    if (!key) return true; // keep untitled items — can't dedup them
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch from all sources — RSS, plain-HTTP CA sites, Puppeteer Vision IAS subjects, and PIB.
 * Returns up to `limit` deduplicated items.
 *
 * Interleave priority: CA (editorial) → PIB (official govt) → Subject (subject-wise) → RSS (raw news)
 */
export async function fetchNews(limit = 80, targetDate) {
  const dateParts = getDateParts(targetDate);
  console.log(`[fetchNews] Target date: ${dateParts.yyyy}-${dateParts.mm}-${dateParts.dd}`);

  const [rssResult, caResult, subjectResult, pibResult] = await Promise.allSettled([
    fetchRSS(),
    fetchCASites(15, dateParts),
    fetchVisionSubjects(),
    fetchPIB(20),
  ]);

  const rss      = rssResult.status     === 'fulfilled' ? rssResult.value      : [];
  const ca       = caResult.status      === 'fulfilled' ? caResult.value       : [];
  const subjects = subjectResult.status === 'fulfilled' ? subjectResult.value  : [];
  const pib      = pibResult.status     === 'fulfilled' ? pibResult.value      : [];

  // Interleave: 3 CA → 2 PIB → 2 Subject → 1 RSS per round
  const interleaved = [];
  const caQ   = [...ca];
  const pibQ  = [...pib];
  const subQ  = [...subjects];
  const rssQ  = [...rss];

  while (caQ.length || pibQ.length || subQ.length || rssQ.length) {
    for (let i = 0; i < 3 && caQ.length;  i++) interleaved.push(caQ.shift());
    for (let i = 0; i < 2 && pibQ.length; i++) interleaved.push(pibQ.shift());
    for (let i = 0; i < 2 && subQ.length; i++) interleaved.push(subQ.shift());
    if (rssQ.length) interleaved.push(rssQ.shift());
  }

  const merged = deduplicateByTitle(interleaved);
  console.log(
    `✓ Sources: CA ${ca.length}, PIB ${pib.length}, Subjects ${subjects.length}, RSS ${rss.length} → merged ${merged.length}`
  );
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
