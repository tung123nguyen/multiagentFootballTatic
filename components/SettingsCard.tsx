"use client";

import { useState } from "react";
import {
  ChevronDown,
  CircleDot,
  Hash,
  Shirt,
  SlidersHorizontal,
  Tag,
  Users,
} from "lucide-react";
import { useBoard } from "@/lib/store";
import { FORMATION_KEYS } from "@/lib/formations";
import { cn } from "@/lib/utils";
import { Select } from "./ui/Select";

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        on ? "border-primary bg-primary" : "border-line-2 bg-glass-2"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          on && "translate-x-5"
        )}
      />
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3">{children}</div>;
}

export default function SettingsCard() {
  const [open, setOpen] = useState(true);

  const formationHome = useBoard((s) => s.formationHome);
  const formationAway = useBoard((s) => s.formationAway);
  const applyFormation = useBoard((s) => s.applyFormation);
  const showAway = useBoard((s) => s.showAway);
  const toggleAway = useBoard((s) => s.toggleAway);
  const display = useBoard((s) => s.display);
  const setDisplay = useBoard((s) => s.setDisplay);
  const ball = useBoard((s) => s.ball);
  const toggleBall = useBoard((s) => s.toggleBall);

  return (
    <div className="glass pointer-events-auto w-64 rounded-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3.5 py-3 text-left"
      >
        <SlidersHorizontal size={16} className="text-primary" />
        <span className="text-[13px] font-semibold">Board setup</span>
        <ChevronDown
          size={16}
          className={cn(
            "ml-auto text-muted transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3.5 px-3.5 pb-3.5">
          {/* Formation */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <Shirt size={12} /> Home team
              <span className="ml-auto inline-block h-2.5 w-2.5 rounded-full bg-home" />
            </div>
            <Select
              ariaLabel="Home formation"
              value={formationHome}
              options={FORMATION_KEYS}
              onChange={(v) => applyFormation("home", v)}
              accent="var(--color-home)"
            />
          </div>

          <Row>
            <span className="flex items-center gap-2 text-[13px]">
              <Users size={15} className="text-muted" /> Opponent
            </span>
            <Switch on={showAway} onClick={toggleAway} />
          </Row>

          {showAway && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Away team
                <span className="ml-auto inline-block h-2.5 w-2.5 rounded-full bg-away" />
              </div>
              <Select
                ariaLabel="Away formation"
                value={formationAway}
                options={FORMATION_KEYS}
                onChange={(v) => applyFormation("away", v)}
                accent="var(--color-away)"
              />
            </div>
          )}

          <div className="h-px bg-line" />

          {/* Display */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-glass-2 p-1">
            {(
              [
                ["number", "Number", Hash],
                ["label", "Position", Tag],
              ] as const
            ).map(([val, lbl, Icon]) => (
              <button
                key={val}
                onClick={() => setDisplay(val)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium transition-colors",
                  display === val
                    ? "bg-primary text-primary-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                <Icon size={14} /> {lbl}
              </button>
            ))}
          </div>

          <Row>
            <span className="flex items-center gap-2 text-[13px]">
              <CircleDot size={15} className="text-muted" /> Show ball
            </span>
            <Switch on={!!ball} onClick={toggleBall} />
          </Row>
        </div>
      )}
    </div>
  );
}
