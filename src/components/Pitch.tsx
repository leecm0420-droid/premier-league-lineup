import type { PredictedLineup } from "@/lib/types";

function pos(row: number, col: number, maxRow: number, maxCol: number) {
  const top = ((row - 0.5) / maxRow) * 100;
  const colCount = Math.max(maxCol, 1);
  const left = ((col - 0.5) / colCount) * 100;
  return { top: `${top}%`, left: `${left}%` };
}

export function Pitch({ lineup, accent }: { lineup: PredictedLineup; accent: "home" | "away" }) {
  const rows = lineup.startXI.map((s) => s.row);
  const colsByRow = new Map<number, number>();
  for (const slot of lineup.startXI) {
    colsByRow.set(slot.row, Math.max(colsByRow.get(slot.row) ?? 0, slot.col));
  }
  const maxRow = Math.max(4, ...rows);
  const chip = accent === "home" ? "bg-white text-emerald-950" : "bg-sky-200 text-sky-950";

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-emerald-700/50 bg-[radial-gradient(circle_at_center,#1f7a3a_0%,#0d4a24_70%)]">
      <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-3 h-[18%] w-[40%] -translate-x-1/2 border border-white/30" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[18%] w-[40%] -translate-x-1/2 border border-white/30" />
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 border-t border-white/30" />
      {lineup.startXI.map((slot) => {
        const maxCol = colsByRow.get(slot.row) ?? 4;
        return (
          <div
            key={slot.player.id}
            className="absolute w-20 -translate-x-1/2 -translate-y-1/2 text-center"
            style={pos(slot.row, slot.col, maxRow, maxCol)}
          >
            <div className={`mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow ${chip}`}>
              {slot.player.web_name.slice(0, 3)}
            </div>
            <div className="truncate text-[11px] font-medium text-white drop-shadow">
              {slot.player.web_name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
