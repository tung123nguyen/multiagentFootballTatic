"use client";

import { useEffect } from "react";
import TacticsBoard from "./TacticsBoard";
import TopBar from "./TopBar";
import ToolDock from "./ToolDock";
import ColorDock from "./ColorDock";
import SettingsCard from "./SettingsCard";
import SelectionCard from "./SelectionCard";
import LibraryPanel from "./LibraryPanel";
import { useBoard } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { loadBoard, saveBoard } from "@/lib/storage";

function Toast() {
  const toast = useUI((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center md:bottom-28">
      <div className="glass-2 animate-pop rounded-full px-4 py-2 text-[13px] font-medium text-foreground">
        {toast}
      </div>
    </div>
  );
}

export default function App() {
  const loadTactic = useBoard((s) => s.loadTactic);

  // Restore the last board on first mount.
  useEffect(() => {
    const b = loadBoard();
    if (b && Array.isArray(b.players) && b.players.length) loadTactic(b);
  }, [loadTactic]);

  // Debounced autosave whenever the board changes.
  useEffect(() => {
    let timer: number;
    const unsub = useBoard.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveBoard(useBoard.getState().snapshot("__autosave__"));
      }, 500);
    });
    return () => {
      window.clearTimeout(timer);
      unsub();
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute -top-40 right-[-10%] h-[55vh] w-[55vh] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-accent/12 blur-[120px]" />
      </div>

      {/* Canvas (hero) */}
      <div className="absolute inset-0 flex items-center justify-center px-3 pb-20 pt-20 md:px-24 md:pb-8 md:pt-24">
        <div className="board relative aspect-[1000/1540] h-full max-h-full max-w-full touch-none select-none overflow-hidden rounded-[20px] shadow-float ring-1 ring-line/80">
          <TacticsBoard />
        </div>
      </div>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 md:p-4">
        <div className="pointer-events-none w-full max-w-3xl">
          <TopBar />
        </div>
      </div>

      {/* Left tool dock */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 md:left-5">
        <ToolDock />
      </div>

      {/* Settings (top-right) */}
      <div className="pointer-events-none absolute right-3 top-[84px] md:right-5 md:top-24">
        <SettingsCard />
      </div>

      {/* Selection toolbar (top-center) */}
      <div className="pointer-events-none absolute inset-x-0 top-[84px] flex justify-center px-3 md:top-24">
        <SelectionCard />
      </div>

      {/* Color dock (bottom-center) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3 md:bottom-6">
        <ColorDock />
      </div>

      <Toast />
      <LibraryPanel />
    </div>
  );
}
