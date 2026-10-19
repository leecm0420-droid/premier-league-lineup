import { MatchCard } from "@/components/MatchCard";
import { listUpcomingFixtures } from "@/lib/preview";
import type { FixtureSummary } from "@/lib/types";

export default async function Home() {
  let fixtures: FixtureSummary[] = [];
  let error = "";
  try {
    fixtures = await listUpcomingFixtures();
  } catch (e) {
    error = e instanceof Error ? e.message : "경기를 불러오지 못했습니다.";
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">남은 프리미어리그</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/80">
          경기를 고르면 부상·징계·뉴스 이슈를 반영한 예상 선발과 홈/무/원정 승률을 볼 수 있습니다.
          GitHub Pages에 빌드 시점 데이터로 게시됩니다.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-sm text-rose-100">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {fixtures.map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </main>
  );
}
