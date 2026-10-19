export type FplStatus = "a" | "d" | "i" | "s" | "u" | "n" | string;

export type PlayerAvailability = "available" | "doubt" | "out" | "rotate";

export type ElementType = 1 | 2 | 3 | 4;

export type FplTeam = {
  id: number;
  name: string;
  short_name: string;
  code: number;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
};

export type FplPlayer = {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: ElementType;
  status: FplStatus;
  news: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  minutes: number;
  starts: number;
  form: string;
  selected_by_percent: string;
  now_cost: number;
};

export type FplFixture = {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean | null;
  finished: boolean;
  team_h_difficulty: number;
  team_a_difficulty: number;
};

export type FplBootstrap = {
  teams: FplTeam[];
  elements: FplPlayer[];
  events: Array<{
    id: number;
    name: string;
    is_current: boolean;
    is_next: boolean;
    finished: boolean;
    deadline_time: string;
  }>;
};

export type NewsItem = {
  title: string;
  link: string;
  source?: string;
};

export type PlayerIssue = {
  playerId?: number;
  playerName: string;
  status: PlayerAvailability;
  reason: string;
  source: "fpl" | "api-football" | "news" | "schedule";
  confidence: number;
};

export type LineupSlot = {
  player: FplPlayer;
  row: number;
  col: number;
  reason: string;
};

export type PredictedLineup = {
  formation: string;
  startXI: LineupSlot[];
  bench: FplPlayer[];
  absences: PlayerIssue[];
  notes: string[];
  congested: boolean;
  strength: number;
  typicalStrength: number;
};

export type WinProb = {
  home: number;
  draw: number;
  away: number;
  lambdaHome: number;
  lambdaAway: number;
  explanation: string[];
};

export type FixtureSummary = {
  id: number;
  kickoff: string | null;
  gameweek: number | null;
  home: { id: number; name: string; short: string; code: number };
  away: { id: number; name: string; short: string; code: number };
  odds: WinProb;
};

export type MatchPreview = {
  fixture: FixtureSummary;
  homeLineup: PredictedLineup;
  awayLineup: PredictedLineup;
  odds: WinProb;
  news: NewsItem[];
  usedApiFootball: boolean;
  usedLlm: boolean;
};
