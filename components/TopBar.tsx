"use client";

import {
  Eraser,
  FolderOpen,
  RotateCcw,
  Save,
  Undo2,
  Volleyball,
} from "lucide-react";
import { useBoard } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { upsertLocal } from "@/lib/storage";
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
