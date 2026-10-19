import type { FplTeam, PredictedLineup, WinProb } from "./types";

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return r;
}

function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

export function poisson1x2(lambdaHome: number, lambdaAway: number, max = 8): WinProb {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let i = 0; i <= max; i += 1) {
    for (let j = 0; j <= max; j += 1) {
      const p = poisson(i, lambdaHome) * poisson(j, lambdaAway);
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;
    }
  }
  const s = home + draw + away || 1;
  return {
    home: home / s,
    draw: draw / s,
    away: away / s,
    lambdaHome,
    lambdaAway,
    explanation: [],
  };
}

function lineupFactor(lineup?: PredictedLineup): number {
  if (!lineup || lineup.typicalStrength <= 0) return 1;
  const ratio = lineup.strength / lineup.typicalStrength;
  return Math.max(0.78, Math.min(1.08, 0.55 + 0.45 * ratio));
}

export function estimateMatch(
  home: FplTeam,
  away: FplTeam,
  homeLineup?: PredictedLineup,
  awayLineup?: PredictedLineup,
): WinProb {
  const scale = 1150;
  const homeAttack = home.strength_attack_home / scale;
  const homeDef = home.strength_defence_home / scale;
  const awayAttack = away.strength_attack_away / scale;
  const awayDef = away.strength_defence_away / scale;

  const hf = lineupFactor(homeLineup);
  const af = lineupFactor(awayLineup);

  const lambdaHome = Math.max(0.4, 1.38 * homeAttack * (2 - awayDef) * hf);
  const lambdaAway = Math.max(0.3, 1.08 * awayAttack * (2 - homeDef) * af);

  const odds = poisson1x2(lambdaHome, lambdaAway);
  const explanation: string[] = [];

  const missingHome = homeLineup?.absences.filter((a) => a.status === "out") ?? [];
  const missingAway = awayLineup?.absences.filter((a) => a.status === "out") ?? [];

  if (missingHome.length) {
    const drop = Math.round((1 - hf) * 100);
    explanation.push(
      `${home.short_name} 핵심 결장(${missingHome.map((m) => m.playerName).slice(0, 3).join(", ")})으로 홈 승률 약 ${drop}%p 보정`,
    );
  }
  if (missingAway.length) {
    explanation.push(
      `${away.short_name} 결장: ${missingAway.map((m) => m.playerName).slice(0, 3).join(", ")}`,
    );
  }
  if (homeLineup?.congested) explanation.push(`${home.short_name} 일정 과밀 — 로테이션 반영`);
  if (awayLineup?.congested) explanation.push(`${away.short_name} 일정 과밀 — 로테이션 반영`);
  if (!explanation.length) {
    explanation.push("시즌 공격/수비 지표와 예상 선발 전력으로 푸아송 1X2를 계산했습니다.");
  }

  return { ...odds, explanation };
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
