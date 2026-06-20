"use client";

import { Minus, Plus, Trash2, X } from "lucide-react";
import { ARROW_COLORS, ARROW_WIDTHS, useBoard } from "@/lib/store";
import type { ArrowKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tip } from "./ui/Tooltip";

const KINDS: [ArrowKind, string][] = [
  ["arrow", "Run"],
  ["dash", "Pass"],
  ["line", "Free"],
];

function Divider() {
  return <div className="mx-1 h-7 w-px bg-line" />;
}

export default function SelectionCard() {
  const tool = useBoard((s) => s.tool);
  const arrows = useBoard((s) => s.arrows);
  const selectedArrowId = useBoard((s) => s.selectedArrowId);
  const updateArrowStyle = useBoard((s) => s.updateArrowStyle);
  const removeArrow = useBoard((s) => s.removeArrow);
  const selectArrow = useBoard((s) => s.selectArrow);

  const sel =
    tool === "move" ? arrows.find((a) => a.id === selectedArrowId) ?? null : null;
  if (!sel) return null;

  return (
    <div className="panel animate-pop pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
      {/* Kind */}
      <div className="flex items-center gap-0.5 rounded-xl bg-glass p-0.5">
        {KINDS.map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => updateArrowStyle(sel.id, { kind: k })}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
              sel.kind === k
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            {lbl}
          </button>
        ))}
      </div>

      <Divider />

      {/* Colors */}
      <div className="flex items-center gap-0.5">
        {ARROW_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => updateArrowStyle(sel.id, { color: c })}
            aria-label={`Color ${c}`}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg transition-transform hover:scale-110",
              sel.color === c && "ring-2 ring-white/90"
            )}
          >
            <span
              className="h-4 w-4 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
              style={{ background: c }}
            />
          </button>
        ))}
      </div>

      <Divider />

      {/* Width */}
      <div className="flex items-center gap-0.5">
        {ARROW_WIDTHS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateArrowStyle(sel.id, { width: value })}
            aria-label={`Width ${label}`}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg transition-colors",
              (sel.width ?? 6) === value
                ? "bg-glass-2 text-foreground"
                : "text-muted hover:text-foreground"
            )}
          >
            <span
              className="rounded-full bg-current"
              style={{ width: 3 + value, height: 3 + value }}
            />
          </button>
        ))}
      </div>

      {sel.kind !== "line" && (
        <>
          <Divider />
          {/* Playback phase — lines with the same step run together */}
          <Tip label="Play order (same number = together)" side="bottom">
            <div className="flex items-center gap-0.5">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                Step
              </span>
              <button
                onClick={() =>
                  updateArrowStyle(sel.id, { step: Math.max(1, (sel.step ?? 1) - 1) })
                }
                aria-label="Decrease step"
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-glass-2 hover:text-foreground"
              >
                <Minus size={14} />
              </button>
              <span className="w-5 text-center text-sm font-bold tabular-nums">
                {sel.step ?? 1}
              </span>
              <button
                onClick={() => updateArrowStyle(sel.id, { step: (sel.step ?? 1) + 1 })}
                aria-label="Increase step"
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-glass-2 hover:text-foreground"
              >
                <Plus size={14} />
              </button>
            </div>
          </Tip>
        </>
      )}

      <Divider />

      <Tip label="Delete (Del)" side="bottom">
        <button
          onClick={() => removeArrow(sel.id)}
          className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-away/15 hover:text-away"
        >
          <Trash2 size={16} />
        </button>
      </Tip>
      <Tip label="Deselect" side="bottom">
        <button
          onClick={() => selectArrow(null)}
          className="grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-glass-2 hover:text-foreground"
        >
          <X size={16} />
        </button>
      </Tip>
    </div>
  );
}
