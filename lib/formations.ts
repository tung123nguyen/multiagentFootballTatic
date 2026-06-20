import type { PlayerToken, Team } from "./types";
import { uid } from "./utils";

/** A formation slot in HOME orientation (own goal at the bottom, attacking up). */
interface Slot {
  label: string;
  x: number; // 0..100
  y: number; // 0..100  (92 ≈ own goal, 18 ≈ opponent box)
}

/**
 * Formation presets. Each is an 11-slot list in HOME orientation.
 * Index 0 is always the goalkeeper (number 1); the rest get numbers 2..11.
 */
export const FORMATIONS: Record<string, Slot[]> = {
  "4-3-3": [
    { label: "GK", x: 50, y: 92 },
    { label: "RB", x: 82, y: 74 },
    { label: "CB", x: 62, y: 78 },
    { label: "CB", x: 38, y: 78 },
    { label: "LB", x: 18, y: 74 },
    { label: "CM", x: 68, y: 54 },
    { label: "CM", x: 50, y: 58 },
    { label: "CM", x: 32, y: 54 },
    { label: "RW", x: 80, y: 28 },
    { label: "ST", x: 50, y: 20 },
    { label: "LW", x: 20, y: 28 },
  ],
  "4-4-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "RB", x: 82, y: 74 },
    { label: "CB", x: 62, y: 78 },
    { label: "CB", x: 38, y: 78 },
    { label: "LB", x: 18, y: 74 },
    { label: "RM", x: 82, y: 50 },
    { label: "CM", x: 60, y: 53 },
    { label: "CM", x: 40, y: 53 },
    { label: "LM", x: 18, y: 50 },
    { label: "ST", x: 60, y: 22 },
    { label: "ST", x: 40, y: 22 },
  ],
  "4-2-3-1": [
    { label: "GK", x: 50, y: 92 },
    { label: "RB", x: 82, y: 74 },
    { label: "CB", x: 62, y: 78 },
    { label: "CB", x: 38, y: 78 },
    { label: "LB", x: 18, y: 74 },
    { label: "DM", x: 62, y: 60 },
    { label: "DM", x: 38, y: 60 },
    { label: "RW", x: 80, y: 38 },
    { label: "AM", x: 50, y: 40 },
    { label: "LW", x: 20, y: 38 },
    { label: "ST", x: 50, y: 20 },
  ],
  "3-5-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "CB", x: 70, y: 79 },
    { label: "CB", x: 50, y: 81 },
    { label: "CB", x: 30, y: 79 },
    { label: "RWB", x: 88, y: 55 },
    { label: "CM", x: 65, y: 55 },
    { label: "CM", x: 50, y: 52 },
    { label: "CM", x: 35, y: 55 },
    { label: "LWB", x: 12, y: 55 },
    { label: "ST", x: 60, y: 22 },
    { label: "ST", x: 40, y: 22 },
  ],
  "5-3-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "RWB", x: 88, y: 72 },
    { label: "CB", x: 68, y: 80 },
    { label: "CB", x: 50, y: 82 },
    { label: "CB", x: 32, y: 80 },
    { label: "LWB", x: 12, y: 72 },
    { label: "CM", x: 68, y: 54 },
    { label: "CM", x: 50, y: 57 },
    { label: "CM", x: 32, y: 54 },
    { label: "ST", x: 60, y: 24 },
    { label: "ST", x: 40, y: 24 },
  ],
  "4-1-2-1-2": [
    { label: "GK", x: 50, y: 92 },
    { label: "RB", x: 82, y: 74 },
    { label: "CB", x: 62, y: 78 },
    { label: "CB", x: 38, y: 78 },
    { label: "LB", x: 18, y: 74 },
    { label: "DM", x: 50, y: 62 },
    { label: "CM", x: 70, y: 50 },
    { label: "CM", x: 30, y: 50 },
    { label: "AM", x: 50, y: 38 },
    { label: "ST", x: 60, y: 20 },
    { label: "ST", x: 40, y: 20 },
  ],
};

export const FORMATION_KEYS = Object.keys(FORMATIONS);

/** Build 11 player tokens for a team from a formation key. */
export function buildTeam(team: Team, formationKey: string): PlayerToken[] {
  const slots = FORMATIONS[formationKey] ?? FORMATIONS["4-3-3"];
  return slots.map((slot, i) => {
    // Away team is mirrored to the opposite half (attacking down).
    const x = team === "away" ? 100 - slot.x : slot.x;
    const y = team === "away" ? 100 - slot.y : slot.y;
    return {
      id: uid(team + "-"),
      team,
      number: i === 0 ? 1 : i + 1,
      label: slot.label,
      x,
      y,
    };
  });
}
