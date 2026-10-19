import {
  hasApiFootball,
  lastLineup,
  mapTeamId,
  matchPlayerName,
  teamInjuries,
} from "./apiFootball";
import { getAllFixtures, getBootstrap, getFutureFixtures } from "./fpl";
import { extractIssuesFromNews, hasLlm } from "./llmContext";
import { predictLineup } from "./lineup";
import { fetchTeamNews } from "./news";
import { teamKo } from "./teams";
import type { FplTeam, FixtureSummary, MatchPreview, PlayerIssue } from "./types";
import { estimateMatch } from "./winProb";

function teamCard(t: FplTeam) {
  return { id: t.id, name: t.name, short: t.short_name, code: t.code };
}

export async function listUpcomingFixtures(): Promise<FixtureSummary[]> {
  const [boot, future] = await Promise.all([getBootstrap(), getFutureFixtures()]);
  const teams = new Map(boot.teams.map((t) => [t.id, t]));
  const upcoming = future
    .filter((f) => !f.finished && f.event)
    .sort((a, b) => (a.kickoff_time || "").localeCompare(b.kickoff_time || ""))
    .slice(0, 40);

  return upcoming.flatMap((f) => {
    const home = teams.get(f.team_h);
    const away = teams.get(f.team_a);
    if (!home || !away) return [];
    return [
      {
        id: f.id,
        kickoff: f.kickoff_time,
        gameweek: f.event,
        home: teamCard(home),
        away: teamCard(away),
        odds: estimateMatch(home, away),
      },
    ];
  });
}

export async function getMatchPreview(id: number): Promise<MatchPreview> {
  const [boot, future, all] = await Promise.all([
    getBootstrap(),
    getFutureFixtures(),
    getAllFixtures(),
  ]);
  const fixture = [...future, ...all].find((f) => f.id === id);
  if (!fixture) {
    throw new Error("경기를 찾을 수 없습니다.");
  }
  const home = boot.teams.find((t) => t.id === fixture.team_h);
  const away = boot.teams.find((t) => t.id === fixture.team_a);
  if (!home || !away) throw new Error("팀 정보를 찾을 수 없습니다.");

  const homeSquad = boot.elements.filter((p) => p.team === home.id);
  const awaySquad = boot.elements.filter((p) => p.team === away.id);

  let usedApiFootball = false;
  let usedLlm = false;

  const afPack = async (team: FplTeam, squad: typeof homeSquad) => {
    if (!hasApiFootball()) {
      return { last: null as Awaited<ReturnType<typeof lastLineup>>, issues: [] as PlayerIssue[] };
    }
    const afId = await mapTeamId(team);
    if (!afId) {
      return { last: null, issues: [] as PlayerIssue[] };
    }
    usedApiFootball = true;
    const [last, injuries] = await Promise.all([lastLineup(afId), teamInjuries(afId)]);
    const issues: PlayerIssue[] = injuries.flatMap((inj) => {
      const player = matchPlayerName(inj.name, squad);
      return [
        {
          playerId: player?.id,
          playerName: player?.web_name ?? inj.name,
          status: "out" as const,
          reason: inj.reason || inj.type || "부상/결장 보고",
          source: "api-football" as const,
          confidence: 0.85,
        },
      ];
    });
    return { last, issues };
  };

  const skipNews = process.env.SKIP_NEWS === "1";
  const [homeNews, awayNews, homeAf, awayAf] = await Promise.all([
    skipNews ? Promise.resolve([]) : fetchTeamNews(home.name),
    skipNews ? Promise.resolve([]) : fetchTeamNews(away.name),
    afPack(home, homeSquad),
    afPack(away, awaySquad),
  ]);

  const [homeLlm, awayLlm] = await Promise.all([
    extractIssuesFromNews(home.name, homeSquad, homeNews),
    extractIssuesFromNews(away.name, awaySquad, awayNews),
  ]);
  usedLlm = hasLlm();

  const homeLineup = predictLineup({
    squad: homeSquad,
    fixture,
    teamId: home.id,
    allFuture: future,
    extraIssues: [...homeAf.issues, ...homeLlm],
    lastLineup: homeAf.last,
  });
  const awayLineup = predictLineup({
    squad: awaySquad,
    fixture,
    teamId: away.id,
    allFuture: future,
    extraIssues: [...awayAf.issues, ...awayLlm],
    lastLineup: awayAf.last,
  });

  const odds = estimateMatch(home, away, homeLineup, awayLineup);

  return {
    fixture: {
      id: fixture.id,
      kickoff: fixture.kickoff_time,
      gameweek: fixture.event,
      home: teamCard(home),
      away: teamCard(away),
      odds,
    },
    homeLineup,
    awayLineup,
    odds,
    news: [...homeNews.slice(0, 4), ...awayNews.slice(0, 4)],
    usedApiFootball,
    usedLlm: Boolean(process.env.OPENAI_API_KEY) && usedLlm,
  };
}

export function displayTeam(name: string, short: string): string {
  const ko = teamKo(name);
  return ko === name ? `${name} (${short})` : `${ko} · ${short}`;
}
