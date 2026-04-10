import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['content:encoded', 'fullContent'],
      ['description', 'description'],
      ['media:content', 'mediaContent']
    ]
  }
});

const RSS_FEEDS = [
  {
    name: 'Indian Express',
    url: 'https://indianexpress.com/feed/'
  },
  {
    name: 'The Hindu - India',
    url: 'https://www.thehindu.com/news/india/?service=rss'
  },
  {
    name: 'The Hindu - World',
    url: 'https://www.thehindu.com/news/international/?service=rss'
  }
];

export async function fetchNews(limit = 15) {
  const newsBatch = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching from ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);

      const items = feedData.items.slice(0, 8).map((item) => ({
        title: item.title || 'Untitled',
        summary: item.contentSnippet || item.description || 'No summary',
        url: item.link || '',
        source: feed.name,
        pubDate: item.pubDate || new Date().toISOString(),
        content: item.fullContent || item.description || ''
      }));

      newsBatch.push(...items);
    } catch (error) {
      console.error(`Error fetching from ${feed.name}:`, error.message);
    }
  }

  // Remove duplicates by title
  const uniqueBatch = Array.from(
    new Map(newsBatch.map(item => [item.title, item])).values()
  );

  return uniqueBatch.slice(0, limit);
}

export async function fetchNewsByKeywords(keywords = [], limit = 15) {
  const allNews = await fetchNews(50);

  if (keywords.length === 0) {
    return allNews.slice(0, limit);
  }

  const filtered = allNews.filter(item => {
    const text = (item.title + ' ' + item.summary).toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  });

  return filtered.slice(0, limit);
}
