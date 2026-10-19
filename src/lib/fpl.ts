import { cached } from "./cache";
import type { FplBootstrap, FplFixture } from "./types";

const BASE = "https://fantasy.premierleague.com/api";

async function fplGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PL-Lineup-Predictor/1.0",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`FPL ${path} 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getBootstrap(): Promise<FplBootstrap> {
  return cached("fpl:bootstrap", 60 * 60 * 1000, () =>
    fplGet<FplBootstrap>("/bootstrap-static/"),
  );
}

export function getFutureFixtures(): Promise<FplFixture[]> {
  return cached("fpl:future", 30 * 60 * 1000, () =>
    fplGet<FplFixture[]>("/fixtures/?future=1"),
  );
}

export function getAllFixtures(): Promise<FplFixture[]> {
  return cached("fpl:all-fixtures", 60 * 60 * 1000, () =>
    fplGet<FplFixture[]>("/fixtures/"),
  );
}
