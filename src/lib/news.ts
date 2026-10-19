import { cached } from "./cache";
import type { NewsItem } from "./types";

function decode(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const title = decode(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
    const link = decode(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
    const source = decode(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "").trim();
    if (title) items.push({ title, link, source: source || undefined });
  }
  return items;
}

export async function fetchTeamNews(teamName: string): Promise<NewsItem[]> {
  return cached(`news:${teamName}`, 3 * 60 * 60 * 1000, async () => {
    const q = encodeURIComponent(
      `${teamName} Premier League injury OR suspension OR lineup OR "personal reasons"`,
    );
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "PL-Lineup-Predictor/1.0" },
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseRss(xml).slice(0, 8);
    } catch {
      return [];
    }
  });
}
