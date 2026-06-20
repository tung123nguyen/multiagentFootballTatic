"use client";

import {
  Eraser,
  FolderOpen,
  Play,
  RotateCcw,
  Save,
  Square,
  StepForward,
  Undo2,
  Volleyball,
} from "lucide-react";
import { useBoard } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { upsertLocal } from "@/lib/storage";
import { playTactic, stepTactic, stopTactic } from "@/lib/playback";
import { cn } from "@/lib/utils";
import { Tip } from "./ui/Tooltip";

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tip label={label} side="bottom">
      <button
        onClick={onClick}
        aria-label={label}
        className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-glass-2 hover:text-foreground"
      >
        {children}
      </button>
    </Tip>
  );
}

export default function TopBar() {
  const undoArrow = useBoard((s) => s.undoArrow);
  const clearArrows = useBoard((s) => s.clearArrows);
  const resetBoard = useBoard((s) => s.resetBoard);
  const snapshot = useBoard((s) => s.snapshot);
  const arrows = useBoard((s) => s.arrows);
  const isPlaying = useBoard((s) => s.isPlaying);

  const name = useUI((s) => s.name);
  const setName = useUI((s) => s.setName);
  const toggleLibrary = useUI((s) => s.toggleLibrary);
  const libraryOpen = useUI((s) => s.libraryOpen);
  const flash = useUI((s) => s.flash);

  function quickSave() {
    const t = snapshot(name.trim() || "Tactic");
    upsertLocal(t);
    flash("Saved on this device");
  }

  const hasLines = arrows.some((a) => a.kind !== "line");

  function handlePlay() {
    if (isPlaying) {
      stopTactic();
      return;
    }
    if (!hasLines) {
      flash("Draw a Run/Pass first");
      return;
    }
    playTactic();
  }

  function handleStep() {
    if (isPlaying) return;
    if (!hasLines) {
      flash("Draw a Run/Pass first");
      return;
    }
    stepTactic();
  }

  return (
    <div className="glass pointer-events-auto flex h-14 items-center gap-2 rounded-2xl px-2.5 pr-2">
      {/* Brand */}
      <div className="flex items-center gap-2.5 pl-1">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-[0_4px_14px_-2px_rgba(16,185,129,0.6)]">
          <Volleyball size={19} />
        </span>
        <span className="hidden text-[15px] font-bold tracking-tight sm:block">
          Tactic<span className="text-primary">Board</span>
        </span>
      </div>

      <div className="mx-1 hidden h-7 w-px bg-line sm:block" />

      {/* Editable tactic name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        spellCheck={false}
        aria-label="Tactic name"
        className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-faint hover:bg-glass focus:bg-glass"
        placeholder="Untitled tactic"
      />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <IconBtn label="Undo last line" onClick={undoArrow}>
          <Undo2 size={18} />
        </IconBtn>
        <IconBtn label="Clear all lines" onClick={clearArrows}>
          <Eraser size={18} />
        </IconBtn>
        <IconBtn label="Reset board" onClick={resetBoard}>
          <RotateCcw size={18} />
        </IconBtn>
      </div>

      <div className="mx-1 h-7 w-px bg-line" />

      <Tip label="Play one step" side="bottom">
        <button
          onClick={handleStep}
          disabled={isPlaying}
          aria-label="Step"
          className="grid h-9 w-9 place-items-center rounded-xl border border-line-2 bg-glass-2 text-foreground transition-colors hover:border-primary/60 disabled:opacity-40"
        >
          <StepForward size={16} />
        </button>
      </Tip>

      <Tip label={isPlaying ? "Stop" : "Play all (by step)"} side="bottom">
        <button
          onClick={handlePlay}
          aria-label={isPlaying ? "Stop" : "Play"}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-all active:scale-[0.97]",
            isPlaying
              ? "border-away bg-away text-white"
              : "border-line-2 bg-glass-2 text-foreground hover:border-primary/60"
          )}
        >
          {isPlaying ? (
            <Square size={14} className="fill-current" />
          ) : (
            <Play size={14} className="fill-current" />
          )}
          <span className="hidden sm:inline">{isPlaying ? "Stop" : "Play"}</span>
        </button>
      </Tip>

      <Tip label="Library" side="bottom">
        <button
          onClick={toggleLibrary}
          aria-label="Library"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl transition-colors",
            libraryOpen
              ? "bg-glass-2 text-foreground"
              : "text-muted hover:bg-glass-2 hover:text-foreground"
          )}
        >
          <FolderOpen size={18} />
        </button>
      </Tip>

      <button
        onClick={quickSave}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-[0_6px_20px_-4px_rgba(16,185,129,0.55)] transition-all hover:bg-primary-strong active:scale-[0.97]"
      >
        <Save size={16} />
        <span className="hidden sm:inline">Save</span>
      </button>
    </div>
  );
}
