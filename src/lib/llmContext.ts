import { cached } from "./cache";
import type { FplPlayer, NewsItem, PlayerIssue } from "./types";

export function hasLlm(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function extractIssuesFromNews(
  teamName: string,
  squad: FplPlayer[],
  news: NewsItem[],
): Promise<PlayerIssue[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || news.length === 0) return [];

  const names = squad.map((p) => p.web_name).join(", ");
  const headlines = news.map((n, i) => `${i + 1}. ${n.title}`).join("\n");

  return cached(`llm:${teamName}:${news[0]?.title ?? ""}`, 6 * 60 * 60 * 1000, async () => {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You extract football availability issues. Reply JSON only: {\"issues\":[{\"playerName\",\"status\",\"reason\",\"confidence\"}]}. status is out|doubt|rotate|available. Use only names from the squad list. reason in Korean, 1 sentence. confidence 0-1. Ignore unrelated headlines.",
            },
            {
              role: "user",
              content: `Team: ${teamName}\nSquad: ${names}\nHeadlines:\n${headlines}`,
            },
          ],
        }),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text) as {
        issues?: Array<{
          playerName?: string;
          status?: PlayerIssue["status"];
          reason?: string;
          confidence?: number;
        }>;
      };
      const issues: PlayerIssue[] = [];
      for (const raw of parsed.issues ?? []) {
        if (!raw.playerName || !raw.status || raw.status === "available") continue;
        const player = squad.find(
          (p) =>
            p.web_name.toLowerCase() === raw.playerName!.toLowerCase() ||
            `${p.first_name} ${p.second_name}`.toLowerCase() ===
              raw.playerName!.toLowerCase(),
        );
        issues.push({
          playerId: player?.id,
          playerName: player?.web_name ?? raw.playerName,
          status: raw.status,
          reason: raw.reason || "뉴스에서 언급됨",
          source: "news",
          confidence: raw.confidence ?? 0.5,
        });
      }
      return issues;
    } catch {
      return [];
    }
  });
}
