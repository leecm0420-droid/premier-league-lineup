import { cached } from "./cache";
import type { FplPlayer, FplTeam } from "./types";

const BASE = "https://v3.football.api-sports.io";
const LEAGUE = 39;

type AfTeam = { team: { id: number; name: string } };
type AfInjury = {
  player: { id: number; name: string; type?: string; reason?: string };
  team: { id: number; name: string };
};
type AfLineupPlayer = {
  player: { id: number; name: string; number?: number; pos?: string; grid?: string | null };
};
type AfLineup = {
  team: { id: number; name: string };
  formation: string;
  startXI: AfLineupPlayer[];
};

function seasonYear(now = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

function key(): string | undefined {
  return process.env.API_FOOTBALL_KEY || process.env.APISPORTS_KEY;
}

export function hasApiFootball(): boolean {
  return Boolean(key());
}

async function afGet<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const apiKey = key();
  if (!apiKey) return [];
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { response?: T[] };
  return json.response ?? [];
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function namesClose(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function leagueTeams(): Promise<AfTeam[]> {
  return cached(`af:teams:${seasonYear()}`, 24 * 60 * 60 * 1000, () =>
    afGet<AfTeam>("/teams", { league: LEAGUE, season: seasonYear() }),
  );
}

export async function mapTeamId(fplTeam: FplTeam): Promise<number | null> {
  const teams = await leagueTeams();
  const hit = teams.find(
    (t) =>
      namesClose(t.team.name, fplTeam.name) ||
      namesClose(t.team.name, fplTeam.short_name),
  );
  return hit?.team.id ?? null;
}

export async function teamInjuries(afTeamId: number): Promise<
  Array<{ name: string; type?: string; reason?: string }>
> {
  return cached(`af:inj:${afTeamId}`, 4 * 60 * 60 * 1000, async () => {
    const rows = await afGet<AfInjury>("/injuries", {
      league: LEAGUE,
      season: seasonYear(),
      team: afTeamId,
    });
    return rows.map((r) => ({
      name: r.player.name,
      type: r.player.type,
      reason: r.player.reason,
    }));
  });
}

export async function lastLineup(afTeamId: number): Promise<{
  formation: string;
  starters: Array<{ name: string; pos?: string; grid?: string | null }>;
} | null> {
  return cached(`af:lu:${afTeamId}`, 6 * 60 * 60 * 1000, async () => {
    const fixtures = await afGet<{ fixture: { id: number; timestamp: number } }>(
      "/fixtures",
      { team: afTeamId, league: LEAGUE, season: seasonYear(), last: 1, status: "FT" },
    );
    const fixtureId = fixtures[0]?.fixture.id;
    if (!fixtureId) return null;
    const lineups = await afGet<AfLineup>("/fixtures/lineups", { fixture: fixtureId });
    const mine = lineups.find((l) => l.team.id === afTeamId);
    if (!mine) return null;
    return {
      formation: mine.formation || "4-3-3",
      starters: mine.startXI.map((p) => ({
        name: p.player.name,
        pos: p.player.pos,
        grid: p.player.grid,
      })),
    };
  });
}

export function matchPlayerName(name: string, squad: FplPlayer[]): FplPlayer | undefined {
  const last = name.split(" ").slice(-1)[0] ?? name;
  return (
    squad.find((p) => namesClose(p.web_name, name) || namesClose(p.second_name, name)) ??
    squad.find((p) => namesClose(p.web_name, last) || namesClose(p.second_name, last)) ??
    squad.find((p) => namesClose(`${p.first_name} ${p.second_name}`, name))
  );
}
