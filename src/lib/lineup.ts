import { matchPlayerName } from "./apiFootball";
import type {
  FplFixture,
  FplPlayer,
  LineupSlot,
  PlayerIssue,
  PredictedLineup,
} from "./types";

const FORMATION_433 = [
  { row: 1, col: 2, type: 1 as const },
  { row: 2, col: 1, type: 2 as const },
  { row: 2, col: 2, type: 2 as const },
  { row: 2, col: 3, type: 2 as const },
  { row: 2, col: 4, type: 2 as const },
  { row: 3, col: 1, type: 3 as const },
  { row: 3, col: 2, type: 3 as const },
  { row: 3, col: 3, type: 3 as const },
  { row: 4, col: 1, type: 4 as const },
  { row: 4, col: 2, type: 4 as const },
  { row: 4, col: 3, type: 4 as const },
];

function formNum(p: FplPlayer): number {
  const n = Number.parseFloat(p.form);
  return Number.isFinite(n) ? n : 0;
}

export function playerScore(p: FplPlayer): number {
  return p.starts * 12 + p.minutes / 18 + formNum(p) * 8;
}

function chance(p: FplPlayer): number {
  return p.chance_of_playing_next_round ?? p.chance_of_playing_this_round ?? 100;
}

export function fplIssues(squad: FplPlayer[]): PlayerIssue[] {
  const issues: PlayerIssue[] = [];
  for (const p of squad) {
    const ch = chance(p);
    if (p.status === "i" || p.status === "s" || p.status === "u" || ch <= 25) {
      const label =
        p.status === "s" ? "징계" : p.status === "i" ? "부상" : "결장";
      issues.push({
        playerId: p.id,
        playerName: p.web_name,
        status: "out",
        reason: p.news?.trim() || `${label}로 선발 제외 예상`,
        source: "fpl",
        confidence: 0.9,
      });
    } else if (p.status === "d" || ch < 75) {
      issues.push({
        playerId: p.id,
        playerName: p.web_name,
        status: "doubt",
        reason: p.news?.trim() || `출전 가능성 ${ch}% — 불확실`,
        source: "fpl",
        confidence: 0.7,
      });
    }
  }
  return issues;
}

function mergeIssues(groups: PlayerIssue[][]): PlayerIssue[] {
  const byName = new Map<string, PlayerIssue>();
  const rank = { out: 3, doubt: 2, rotate: 1, available: 0 };
  for (const group of groups) {
    for (const issue of group) {
      const key = issue.playerName.toLowerCase();
      const prev = byName.get(key);
      if (!prev || rank[issue.status] > rank[prev.status]) {
        byName.set(key, issue);
      }
    }
  }
  return [...byName.values()];
}

function isOut(p: FplPlayer, issues: PlayerIssue[]): boolean {
  return issues.some(
    (i) =>
      i.status === "out" &&
      (i.playerId === p.id || i.playerName.toLowerCase() === p.web_name.toLowerCase()),
  );
}

function isRotate(p: FplPlayer, issues: PlayerIssue[]): boolean {
  return issues.some(
    (i) =>
      i.status === "rotate" &&
      (i.playerId === p.id || i.playerName.toLowerCase() === p.web_name.toLowerCase()),
  );
}

function parseGrid(grid?: string | null): { row: number; col: number } | null {
  if (!grid) return null;
  const [r, c] = grid.split(":").map((n) => Number.parseInt(n, 10));
  if (!r || !c) return null;
  return { row: r, col: c };
}

function isCongested(teamId: number, fixture: FplFixture, allFuture: FplFixture[]): boolean {
  const t = fixture.kickoff_time ? new Date(fixture.kickoff_time).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  const fourDays = 4 * 24 * 60 * 60 * 1000;
  return allFuture.some((f) => {
    if (f.id === fixture.id) return false;
    if (f.team_h !== teamId && f.team_a !== teamId) return false;
    if (!f.kickoff_time) return false;
    const other = new Date(f.kickoff_time).getTime();
    return Math.abs(other - t) <= fourDays;
  });
}

export function predictLineup(opts: {
  squad: FplPlayer[];
  fixture: FplFixture;
  teamId: number;
  allFuture: FplFixture[];
  extraIssues?: PlayerIssue[];
  lastLineup?: {
    formation: string;
    starters: Array<{ name: string; pos?: string; grid?: string | null }>;
  } | null;
}): PredictedLineup {
  const extra = opts.extraIssues ?? [];
  const issues = mergeIssues([fplIssues(opts.squad), extra]);
  const congested = isCongested(opts.teamId, opts.fixture, opts.allFuture);
  const notes: string[] = [];

  const available = opts.squad
    .filter((p) => !isOut(p, issues))
    .sort((a, b) => playerScore(b) - playerScore(a));

  const used = new Set<number>();
  const startXI: LineupSlot[] = [];
  let formation = "4-3-3";

  const take = (pool: FplPlayer[], reason: string, row: number, col: number) => {
    const pick = pool.find((p) => !used.has(p.id));
    if (!pick) return;
    used.add(pick.id);
    startXI.push({ player: pick, row, col, reason });
  };

  if (opts.lastLineup?.starters.length) {
    formation = opts.lastLineup.formation || formation;
    for (const starter of opts.lastLineup.starters) {
      const mapped = matchPlayerName(starter.name, opts.squad);
      const grid = parseGrid(starter.grid);
      if (mapped && !isOut(mapped, issues) && !used.has(mapped.id)) {
        const rotate = congested && isRotate(mapped, issues);
        if (rotate) {
          notes.push(`${mapped.web_name}은(는) 일정 과밀/뉴스로 로테이션 후보`);
          continue;
        }
        used.add(mapped.id);
        startXI.push({
          player: mapped,
          row: grid?.row ?? 3,
          col: grid?.col ?? 2,
          reason: "최근 공식 선발 유지",
        });
      } else if (mapped && isOut(mapped, issues)) {
        notes.push(`${mapped.web_name} 대신 같은 포지션 대체 투입`);
      }
    }
  }

  for (const slot of FORMATION_433) {
    if (startXI.length >= 11) break;
    if (startXI.filter((s) => s.player.element_type === slot.type).length >= countType(slot.type)) {
      continue;
    }
    const pool = available.filter((p) => p.element_type === slot.type);
    const prefer = congested
      ? [...pool].sort((a, b) => {
          const ra = isRotate(a, issues) ? -20 : 0;
          const rb = isRotate(b, issues) ? -20 : 0;
          return playerScore(b) + rb - (playerScore(a) + ra);
        })
      : pool;
    take(prefer, opts.lastLineup ? "포지션 대체" : "출전·폼 기준 예상", slot.row, slot.col);
  }

  while (startXI.length < 11) {
    const leftover = available.find((p) => !used.has(p.id) && p.element_type !== 1);
    if (!leftover) break;
    used.add(leftover.id);
    startXI.push({
      player: leftover,
      row: leftover.element_type,
      col: 2,
      reason: "남은 전력 보충",
    });
  }

  if (congested) {
    notes.push("수일 내 재경기가 있어 1~2명 로테이션을 반영했습니다.");
    const attackers = startXI
      .filter((s) => s.player.element_type >= 3)
      .sort((a, b) => b.player.minutes - a.player.minutes);
    const replace = attackers[0];
    const sub = available.find(
      (p) =>
        !used.has(p.id) &&
        replace &&
        p.element_type === replace.player.element_type &&
        playerScore(p) > 8,
    );
    if (replace && sub) {
      used.delete(replace.player.id);
      used.add(sub.id);
      const idx = startXI.findIndex((s) => s.player.id === replace.player.id);
      startXI[idx] = {
        ...replace,
        player: sub,
        reason: "일정 과밀 로테이션",
      };
      issues.push({
        playerId: replace.player.id,
        playerName: replace.player.web_name,
        status: "rotate",
        reason: "연속 경기 부하로 휴식 가능성",
        source: "schedule",
        confidence: 0.55,
      });
    }
  }

  const bench = available.filter((p) => !used.has(p.id)).slice(0, 7);
  const typical = [...opts.squad].sort((a, b) => playerScore(b) - playerScore(a)).slice(0, 11);
  const strength = startXI.reduce((s, x) => s + playerScore(x.player), 0);
  const typicalStrength = typical.reduce((s, p) => s + playerScore(p), 0);

  const absences = issues.filter((i) => i.status !== "available");

  return {
    formation,
    startXI: startXI.slice(0, 11),
    bench,
    absences,
    notes,
    congested,
    strength,
    typicalStrength,
  };
}

function countType(t: 1 | 2 | 3 | 4): number {
  return FORMATION_433.filter((s) => s.type === t).length;
}
