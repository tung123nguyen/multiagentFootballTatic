"use client";

import { ARROW_COLORS, ARROW_WIDTHS, useBoard } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ColorDock() {
  const tool = useBoard((s) => s.tool);
  const color = useBoard((s) => s.color);
  const setColor = useBoard((s) => s.setColor);
  const penWidth = useBoard((s) => s.penWidth);
  const setPenWidth = useBoard((s) => s.setPenWidth);

  const drawing = tool === "arrow" || tool === "dash" || tool === "line";
  if (!drawing) return null;

  return (
    <div className="panel animate-pop pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
      {ARROW_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => setColor(c)}
          aria-label={`Color ${c}`}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-xl transition-transform hover:scale-105",
            color === c && "ring-2 ring-white/90"
          )}
        >
          <span
            className="h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            style={{ background: c }}
          />
        </button>
      ))}

      <div className="mx-1 h-7 w-px bg-line" />

      {ARROW_WIDTHS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setPenWidth(value)}
          aria-label={`Width ${label}`}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-xl transition-colors",
            penWidth === value
              ? "bg-glass-2 text-foreground"
              : "text-muted hover:bg-glass hover:text-foreground"
          )}
        >
          <span
            className="rounded-full bg-current"
            style={{ width: 4 + value, height: 4 + value }}
          />
        </button>
      ))}
    </div>
  );
}
