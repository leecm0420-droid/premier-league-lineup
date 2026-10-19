import Image from "next/image";
import Link from "next/link";
import { LineupPanel } from "@/components/LineupPanel";
import { getMatchPreview, listUpcomingFixtures } from "@/lib/preview";
import { badgeUrl, teamKo } from "@/lib/teams";
import { pct } from "@/lib/winProb";

export async function generateStaticParams() {
  const fixtures = await listUpcomingFixtures();
  return fixtures.map((fixture) => ({ id: String(fixture.id) }));
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = Number.parseInt(id, 10);

  let preview;
  try {
    preview = await getMatchPreview(num);
  } catch (e) {
    const message = e instanceof Error ? e.message : "미리보기를 만들지 못했습니다.";
    return (
      <main>
        <Link href="/" className="text-sm text-emerald-300 hover:underline">
          ← 경기 목록
        </Link>
        <p className="mt-6 rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-sm">
          {message}
        </p>
      </main>
    );
  }

  const { fixture, homeLineup, awayLineup, odds, news, usedApiFootball, usedLlm } = preview;
  const kickoff = fixture.kickoff
    ? new Date(fixture.kickoff).toLocaleString("ko-KR", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "일정 미정";

  return (
    <main>
      <Link href="/" className="text-sm text-emerald-300 hover:underline">
        ← 경기 목록
      </Link>
      <div className="mt-6 rounded-3xl border border-emerald-800/50 bg-emerald-950/40 p-6">
        <p className="text-xs text-emerald-200/70">
          {fixture.gameweek ? `Gameweek ${fixture.gameweek}` : "프리미어리그"} · {kickoff}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
          <TeamHeading name={fixture.home.name} code={fixture.home.code} />
          <span className="text-zinc-400">vs</span>
          <TeamHeading name={fixture.away.name} code={fixture.away.code} />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm text-emerald-100">
            <span>홈 승 {pct(odds.home)}</span>
            <span>무승부 {pct(odds.draw)}</span>
            <span>원정 승 {pct(odds.away)}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
            <div className="bg-emerald-400" style={{ width: `${odds.home * 100}%` }} />
            <div className="bg-zinc-400" style={{ width: `${odds.draw * 100}%` }} />
            <div className="bg-sky-400" style={{ width: `${odds.away * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-1 text-sm text-emerald-50/85">
            {odds.explanation.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            데이터: FPL{usedApiFootball ? " + API-FOOTBALL" : ""}
            {usedLlm ? " + 뉴스 LLM" : " (뉴스 LLM은 OPENAI_API_KEY가 있을 때 활성화)"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LineupPanel title={teamKo(fixture.home.name)} lineup={homeLineup} accent="home" />
        <LineupPanel title={teamKo(fixture.away.name)} lineup={awayLineup} accent="away" />
      </div>

      {news.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-950/40 p-6">
          <h2 className="text-lg font-semibold text-white">관련 뉴스</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {news.map((item) => (
              <li key={item.title}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-200 hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function TeamHeading({ name, code }: { name: string; code: number }) {
  return (
    <div className="flex items-center gap-3">
      <Image src={badgeUrl(code)} alt="" width={48} height={48} unoptimized />
      <div className="text-2xl font-semibold text-white">{teamKo(name)}</div>
    </div>
  );
}
