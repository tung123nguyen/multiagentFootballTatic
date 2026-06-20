"use client";

import { useBoard } from "./store";
import type { Arrow, Ball, PlayerToken } from "./types";

let cancelled = false;
let snapshot: { players: PlayerToken[]; ball: Ball | null } | null = null;

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function phases(): number[] {
  const lines = useBoard
    .getState()
    .arrows.filter((a) => a.kind !== "line" && a.points.length >= 2);
  return [...new Set(lines.map((a) => a.step ?? 1))].sort((x, y) => x - y);
}

function ensureSnapshot() {
  if (snapshot) return;
  const st = useBoard.getState();
  const players = st.players.map((p) => ({ ...p }));
  snapshot = { players, ball: st.ball ? { ...st.ball } : null };
  // Freeze line anchors at these positions so lines stay static during play.
  st.setPlayFrozen(players);
}

/**
 * Re-freeze anchors at the CURRENT positions. Called after each phase so the
 * next phases' lines (and passes) start from where players are now — e.g. a
 * pass in step 5 begins from where its player ran to in step 4.
 */
function refreshFrozen() {
  const st = useBoard.getState();
  st.setPlayFrozen(st.players.map((p) => ({ ...p })));
}

/** Animate one run (move its player) or pass (move the ball) to the line end. */
function animateLine(a: Arrow): Promise<void> {
  return new Promise((resolve) => {
    const s0 = useBoard.getState();
    let from = a.points[0];
    if (a.anchorId) {
      const pl = s0.players.find((p) => p.id === a.anchorId);
      if (pl) from = { x: pl.x, y: pl.y };
    }
    const to = a.points[a.points.length - 1];
    // A running player who currently has the ball dribbles it along.
    const carriesBall =
      a.kind === "arrow" &&
      !!s0.ball &&
      Math.hypot(s0.ball.x - from.x, s0.ball.y - from.y) < 7;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur = Math.min(1600, Math.max(450, dist * 24));
    const t0 = performance.now();

    const tick = (now: number) => {
      if (cancelled) return resolve();
      const t = Math.min(1, (now - t0) / dur);
      const e = easeInOut(t);
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e;
      const s = useBoard.getState();
      if (a.kind === "dash") {
        s.moveBall(x, y);
      } else if (a.anchorId) {
        s.movePlayer(a.anchorId, x, y);
        if (carriesBall) s.moveBall(x, y); // ball follows the dribbling player
      }
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

/** Animate every line in one phase simultaneously. */
async function runPhase(phase: number) {
  const group = useBoard
    .getState()
    .arrows.filter(
      (a) => a.kind !== "line" && a.points.length >= 2 && (a.step ?? 1) === phase
    );
  await Promise.all(group.map(animateLine));
}

/** Restore players/ball to where they were before playback began. */
export function resetTactic() {
  if (snapshot) useBoard.getState().restorePositions(snapshot.players, snapshot.ball);
  snapshot = null;
  useBoard.getState().setPlayStep(0);
  useBoard.getState().setPlayFrozen(null);
}

/** Play one phase forward and stop. Another step at the end rewinds. */
export async function stepTactic() {
  const st = useBoard.getState();
  if (st.isPlaying) return;
  const ph = phases();
  if (!ph.length) return;
  if (st.playStep >= ph.length) {
    resetTactic(); // already at the end → rewind to start
    return;
  }
  ensureSnapshot();
  cancelled = false;
  st.selectArrow(null);
  st.select(null);
  st.setPlaying(true);
  try {
    await runPhase(ph[st.playStep]);
    refreshFrozen();
  } finally {
    useBoard.getState().setPlayStep(st.playStep + 1);
    useBoard.getState().setPlaying(false);
  }
}

/** Play the whole sequence from the start; restores to start when finished. */
export async function playTactic() {
  const st = useBoard.getState();
  if (st.isPlaying) return;
  const ph = phases();
  if (!ph.length) return;

  resetTactic(); // rewind to the initial state, then capture it fresh
  ensureSnapshot();

  cancelled = false;
  useBoard.getState().selectArrow(null);
  useBoard.getState().select(null);
  useBoard.getState().setPlaying(true);
  try {
    for (let i = 0; i < ph.length; i++) {
      if (cancelled) break;
      await runPhase(ph[i]);
      refreshFrozen();
      useBoard.getState().setPlayStep(i + 1);
      if (cancelled) break;
      await wait(180);
    }
    if (!cancelled) await wait(200);
  } finally {
    // Stay at the final state when done; pressing Play again rewinds first.
    useBoard.getState().setPlaying(false);
  }
}

export function stopTactic() {
  cancelled = true;
}
