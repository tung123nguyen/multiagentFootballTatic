"use client";

import { create } from "zustand";
import type { Arrow, ArrowKind, Ball, PlayerToken, Tactic, Team, Tool } from "./types";
import { buildTeam } from "./formations";
import { clamp, uid } from "./utils";

export const ARROW_COLORS = [
  "#fbbf24", // amber
  "#ffffff", // white
  "#60a5fa", // blue
  "#f43f5e", // rose
  "#34d399", // emerald
  "#c084fc", // purple
];

export const ARROW_WIDTHS: { label: string; value: number }[] = [
  { label: "S", value: 4 },
  { label: "M", value: 6 },
  { label: "L", value: 9 },
];

export type DisplayMode = "number" | "label";

interface BoardState {
  // Live board
  players: PlayerToken[];
  arrows: Arrow[];
  ball: Ball | null;

  // Config
  tool: Tool;
  color: string;
  penWidth: number;
  showAway: boolean;
  formationHome: string;
  formationAway: string;
  display: DisplayMode;
  selectedId: string | null;
  selectedArrowId: string | null;
  isPlaying: boolean;
  playStep: number;
  /** Player positions frozen at playback start, so lines stay static while playing. */
  playFrozen: PlayerToken[] | null;

  // Actions — setup
  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setPenWidth: (w: number) => void;
  setDisplay: (d: DisplayMode) => void;
  applyFormation: (team: Team, key: string) => void;
  toggleAway: () => void;
  select: (id: string | null) => void;
  selectArrow: (id: string | null) => void;
  setPlaying: (v: boolean) => void;
  setPlayStep: (n: number) => void;
  setPlayFrozen: (players: PlayerToken[] | null) => void;
  restorePositions: (players: PlayerToken[], ball: Ball | null) => void;

  // Actions — tokens
  movePlayer: (id: string, x: number, y: number) => void;
  renamePlayer: (id: string, label: string) => void;
  setPlayerNumber: (id: string, number: number) => void;
  moveBall: (x: number, y: number) => void;
  toggleBall: () => void;

  // Actions — arrows
  addArrow: (arrow: Arrow) => void;
  removeArrow: (id: string) => void;
  undoArrow: () => void;
  clearArrows: () => void;
  setArrowPoint: (id: string, index: number, x: number, y: number) => void;
  translateArrow: (id: string, dx: number, dy: number) => void;
  updateArrowStyle: (
    id: string,
    patch: { color?: string; kind?: ArrowKind; width?: number; step?: number }
  ) => void;

  // Snapshot / restore
  resetBoard: () => void;
  loadTactic: (t: Tactic) => void;
  snapshot: (name: string, id?: string) => Tactic;
  hydrate: (partial: Partial<BoardState>) => void;
}

function initialPlayers(showAway: boolean, home: string, away: string) {
  const p = buildTeam("home", home);
  return showAway ? [...p, ...buildTeam("away", away)] : p;
}

export const useBoard = create<BoardState>((set, get) => ({
  players: initialPlayers(false, "4-3-3", "4-4-2"),
  arrows: [],
  ball: { x: 50, y: 50 },

  tool: "move",
  color: ARROW_COLORS[0],
  penWidth: 6,
  showAway: false,
  formationHome: "4-3-3",
  formationAway: "4-4-2",
  display: "number",
  selectedId: null,
  selectedArrowId: null,
  isPlaying: false,
  playStep: 0,
  playFrozen: null,

  setTool: (t) => set({ tool: t, selectedId: null, selectedArrowId: null }),
  setColor: (c) => set({ color: c }),
  setPenWidth: (w) => set({ penWidth: w }),
  setDisplay: (d) => set({ display: d }),

  applyFormation: (team, key) =>
    set((s) => {
      const others = s.players.filter((p) => p.team !== team);
      const rebuilt = buildTeam(team, key);
      // Drop the away team entirely if it is hidden.
      if (team === "away" && !s.showAway) {
        return { formationAway: key };
      }
      return {
        players: team === "home" ? [...rebuilt, ...others] : [...others, ...rebuilt],
        formationHome: team === "home" ? key : s.formationHome,
        formationAway: team === "away" ? key : s.formationAway,
      };
    }),

  toggleAway: () =>
    set((s) => {
      const next = !s.showAway;
      const home = s.players.filter((p) => p.team === "home");
      return {
        showAway: next,
        players: next ? [...home, ...buildTeam("away", s.formationAway)] : home,
      };
    }),

  select: (id) => set({ selectedId: id, selectedArrowId: null }),
  selectArrow: (id) => set({ selectedArrowId: id, selectedId: null }),
  setPlaying: (v) => set({ isPlaying: v }),
  setPlayStep: (n) => set({ playStep: n }),
  setPlayFrozen: (players) => set({ playFrozen: players }),
  restorePositions: (players, ball) => set({ players, ball }),

  movePlayer: (id, x, y) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === id ? { ...p, x: clamp(x, 1.5, 98.5), y: clamp(y, 1.5, 98.5) } : p
      ),
    })),

  renamePlayer: (id, label) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, label } : p)),
    })),

  setPlayerNumber: (id, number) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, number } : p)),
    })),

  moveBall: (x, y) =>
    set({ ball: { x: clamp(x, 1.5, 98.5), y: clamp(y, 1.5, 98.5) } }),

  toggleBall: () => set((s) => ({ ball: s.ball ? null : { x: 50, y: 50 } })),

  addArrow: (arrow) =>
    set((s) => ({ arrows: [...s.arrows, arrow], selectedArrowId: arrow.id })),
  removeArrow: (id) =>
    set((s) => ({
      arrows: s.arrows.filter((a) => a.id !== id),
      selectedArrowId: s.selectedArrowId === id ? null : s.selectedArrowId,
    })),
  undoArrow: () =>
    set((s) => ({ arrows: s.arrows.slice(0, -1), selectedArrowId: null })),
  clearArrows: () => set({ arrows: [], selectedArrowId: null }),

  setArrowPoint: (id, index, x, y) =>
    set((s) => ({
      arrows: s.arrows.map((a) =>
        a.id === id
          ? {
              ...a,
              points: a.points.map((p, i) =>
                i === index
                  ? { x: clamp(x, 0, 100), y: clamp(y, 0, 100) }
                  : p
              ),
            }
          : a
      ),
    })),

  translateArrow: (id, dx, dy) =>
    set((s) => ({
      arrows: s.arrows.map((a) => {
        if (a.id !== id) return a;
        const xs = a.points.map((p) => p.x);
        const ys = a.points.map((p) => p.y);
        // Clamp the delta so the whole shape stays on the pitch.
        const cdx = clamp(dx, -Math.min(...xs), 100 - Math.max(...xs));
        const cdy = clamp(dy, -Math.min(...ys), 100 - Math.max(...ys));
        return {
          ...a,
          points: a.points.map((p) => ({ x: p.x + cdx, y: p.y + cdy })),
        };
      }),
    })),

  updateArrowStyle: (id, patch) =>
    set((s) => ({
      arrows: s.arrows.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  resetBoard: () =>
    set((s) => ({
      players: initialPlayers(s.showAway, s.formationHome, s.formationAway),
      arrows: [],
      ball: { x: 50, y: 50 },
      selectedId: null,
      selectedArrowId: null,
    })),

  loadTactic: (t) =>
    set({
      players: t.players,
      arrows: t.arrows,
      ball: t.ball,
      showAway: t.showAway,
      formationHome: t.formationHome,
      formationAway: t.formationAway,
      selectedId: null,
      selectedArrowId: null,
    }),

  snapshot: (name, id) => {
    const s = get();
    return {
      id: id ?? uid("t-"),
      name,
      formationHome: s.formationHome,
      formationAway: s.formationAway,
      showAway: s.showAway,
      players: s.players,
      arrows: s.arrows,
      ball: s.ball,
      updatedAt: Date.now(),
    };
  },

  hydrate: (partial) => set(partial as Partial<BoardState>),
}));
