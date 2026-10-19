import type { PredictedLineup } from "@/lib/types";
import { Pitch } from "./Pitch";

const STATUS: Record<string, string> = {
  out: "결장",
  doubt: "불확실",
  rotate: "로테이션",
};

export function LineupPanel({
  title,
  lineup,
  accent,
}: {
  title: string;
  lineup: PredictedLineup;
  accent: "home" | "away";
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-emerald-200/80">예상 포메이션 {lineup.formation}</p>
        </div>
      </div>
      <Pitch lineup={lineup} accent={accent} />
      {lineup.notes.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-amber-100/90">
          {lineup.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-emerald-200">후보</h3>
        <p className="text-sm text-zinc-300">
          {lineup.bench.map((p) => p.web_name).join(" · ") || "후보 데이터 없음"}
        </p>
      </div>
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-rose-200">빠진 선수 / 이슈</h3>
        {lineup.absences.length === 0 ? (
          <p className="text-sm text-zinc-400">보고된 결장이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {lineup.absences.map((a) => (
              <li
                key={`${a.playerName}-${a.reason}`}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white">{a.playerName}</span>
                  <span className="text-xs text-rose-200">
                    {STATUS[a.status] ?? a.status} · {a.source}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{a.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
