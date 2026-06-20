export type Team = "home" | "away";

/** A single player token. Coordinates are relative percentages (0-100). */
export interface PlayerToken {
  id: string;
  team: Team;
  number: number;
  label: string; // position label, e.g. "ST", "CB"
  x: number; // 0 (left) .. 100 (right)
  y: number; // 0 (top/opponent goal) .. 100 (bottom/own goal)
}

/** Drawing tools available on the board. */
export type Tool = "move" | "arrow" | "dash" | "line" | "erase";

export type ArrowKind = "arrow" | "dash" | "line";

/** A free-hand drawn arrow / line made of relative (0-100) points. */
export interface Arrow {
  id: string;
  kind: ArrowKind;
  color: string;
  width?: number;
  points: { x: number; y: number }[];
  /** Player id this arrow's start point is attached to (run/pass lines). */
  anchorId?: string;
}

export interface Ball {
  x: number;
  y: number;
}

/** A complete saved tactic snapshot. */
export interface Tactic {
  id: string;
  name: string;
  formationHome: string;
  formationAway: string;
  showAway: boolean;
  players: PlayerToken[];
  arrows: Arrow[];
  ball: Ball | null;
  notes?: string;
  updatedAt: number;
}

export const TACTIC_SCHEMA = 1;
