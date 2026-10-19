import Image from "next/image";
import Link from "next/link";
import { badgeUrl, teamKo } from "@/lib/teams";
import type { FixtureSummary } from "@/lib/types";
import { pct } from "@/lib/winProb";

function kickoffLabel(iso: string | null): string {
  if (!iso) return "일정 미정";
  return new Date(iso).toLocaleString("ko-KR", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchCard({ fixture }: { fixture: FixtureSummary }) {
  const { home, away, odds } = fixture;
  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="block rounded-2xl border border-emerald-900/40 bg-emerald-950/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:bg-emerald-900/50"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-emerald-200/80">
        <span>{fixture.gameweek ? `GW ${fixture.gameweek}` : "남은 경기"}</span>
        <span>{kickoffLabel(fixture.kickoff)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide name={home.name} short={home.short} code={home.code} align="right" />
        <span className="text-sm font-semibold text-emerald-100">vs</span>
        <TeamSide name={away.name} short={away.short} code={away.code} align="left" />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="flex h-full w-full">
          <div className="bg-emerald-400" style={{ width: `${odds.home * 100}%` }} />
          <div className="bg-zinc-400" style={{ width: `${odds.draw * 100}%` }} />
          <div className="bg-sky-400" style={{ width: `${odds.away * 100}%` }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-emerald-100/80">
        <span>홈 {pct(odds.home)}</span>
        <span>무 {pct(odds.draw)}</span>
        <span>원정 {pct(odds.away)}</span>
      </div>
    </Link>
  );
}

function TeamSide({
  name,
  short,
  code,
  align,
}: {
  name: string;
  short: string;
  code: number;
  align: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
      {align === "left" ? (
        <Image src={badgeUrl(code)} alt="" width={28} height={28} unoptimized />
      ) : null}
      <div className={align === "right" ? "text-right" : ""}>
        <div className="text-sm font-semibold text-white">{teamKo(name)}</div>
        <div className="text-[11px] text-emerald-200/70">{short}</div>
      </div>
      {align === "right" ? (
        <Image src={badgeUrl(code)} alt="" width={28} height={28} unoptimized />
      ) : null}
    </div>
  );
}
