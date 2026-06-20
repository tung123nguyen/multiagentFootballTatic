"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from "react";
import { Pitch, VIEW_W, VIEW_H } from "./Pitch";
import { useBoard } from "@/lib/store";
import type { Arrow, ArrowKind, PlayerToken } from "@/lib/types";
import { clamp, uid } from "@/lib/utils";
import { CURSOR_DRAW, CURSOR_GRAB, CURSOR_MOVE } from "@/lib/cursors";

const PLAYER_R = 27;

const X = (rx: number) => (rx / 100) * VIEW_W;
const Y = (ry: number) => (ry / 100) * VIEW_H;

type Pt = { x: number; y: number };

/* ----------------------------- Path helpers ------------------------------ */

/** Build a smooth path from points already in view-space [x, y]. */
function buildPathV(P: number[][]): string {
  if (P.length === 0) return "";
  if (P.length === 1) return `M ${P[0][0]} ${P[0][1]}`;
  if (P.length === 2) return `M ${P[0][0]} ${P[0][1]} L ${P[1][0]} ${P[1][1]}`;
  let d = `M ${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const xc = (P[i][0] + P[i + 1][0]) / 2;
    const yc = (P[i][1] + P[i + 1][1]) / 2;
    d += ` Q ${P[i][0]} ${P[i][1]} ${xc} ${yc}`;
  }
  const last = P[P.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function buildPath(points: Pt[]): string {
  return buildPathV(points.map((p) => [X(p.x), Y(p.y)]));
}

type Glow = "none" | "hover" | "select";

const LINE_SHADOW = "drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))";
const GLOW_HOVER = "drop-shadow(0 0 3px rgba(255,255,255,0.55))";
const GLOW_SELECT =
  "drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 0 8px rgba(255,255,255,0.5))";

function arrowHead(points: Pt[], color: string, width: number) {
  if (points.length < 2) return null;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  const ang = Math.atan2(Y(b.y) - Y(a.y), X(b.x) - X(a.x));
  // Pull the tip back a hair so the round line cap hides under the head.
  const ex = X(b.x) + Math.cos(ang) * width * 0.35;
  const ey = Y(b.y) + Math.sin(ang) * width * 0.35;
  const len = 10 + width * 1.7;
  const halfW = 5.5 + width * 0.95;
  const bx = ex - Math.cos(ang) * len;
  const by = ey - Math.sin(ang) * len;
  const nx = Math.cos(ang + Math.PI / 2);
  const ny = Math.sin(ang + Math.PI / 2);
  return (
    <path
      d={`M ${ex} ${ey} L ${bx + nx * halfW} ${by + ny * halfW} L ${
        bx - nx * halfW
      } ${by - ny * halfW} Z`}
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );
}

/** Colored line + arrowhead with a soft shadow / selection glow. */
function LinePath({
  points,
  color,
  width,
  kind,
  glow = "none",
  step,
}: {
  points: Pt[];
  color: string;
  width: number;
  kind: ArrowKind;
  glow?: Glow;
  step?: number;
}) {
  // Trim the stroke back to the base of the arrowhead so the round line cap
  // doesn't poke out past the tip.
  const viewPts = points.map((p) => [X(p.x), Y(p.y)]);
  let linePts = viewPts;
  if (kind !== "line" && viewPts.length >= 2) {
    const n = viewPts.length;
    const [ax, ay] = viewPts[n - 2];
    const [bx, by] = viewPts[n - 1];
    const ang = Math.atan2(by - ay, bx - ax);
    const trim = Math.min(
      Math.hypot(bx - ax, by - ay),
      10 + width * 1.35 // ≈ arrowhead length
    );
    linePts = [
      ...viewPts.slice(0, n - 1),
      [bx - Math.cos(ang) * trim, by - Math.sin(ang) * trim],
    ];
  }
  const d = buildPathV(linePts);
  const dash = kind === "dash" ? `${width * 2.4} ${width * 1.9}` : undefined;
  const filter =
    glow === "select"
      ? `${GLOW_SELECT} ${LINE_SHADOW}`
      : glow === "hover"
        ? `${GLOW_HOVER} ${LINE_SHADOW}`
        : LINE_SHADOW;
  // Step badge at the line midpoint, offset to one side.
  let badge: { x: number; y: number } | null = null;
  if (step != null && viewPts.length >= 2) {
    const [x0, y0] = viewPts[0];
    const [x1, y1] = viewPts[viewPts.length - 1];
    const ang = Math.atan2(y1 - y0, x1 - x0);
    badge = {
      x: (x0 + x1) / 2 + Math.cos(ang + Math.PI / 2) * 22,
      y: (y0 + y1) / 2 + Math.sin(ang + Math.PI / 2) * 22,
    };
  }

  return (
    <g style={{ pointerEvents: "none" }}>
      <g style={{ filter }}>
        <path
          d={d}
          stroke={color}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dash}
        />
        {kind !== "line" && arrowHead(points, color, width)}
      </g>
      {badge && (
        <g>
          <circle
            cx={badge.x}
            cy={badge.y}
            r={14}
            fill="#0b1220"
            stroke={color}
            strokeWidth={2.5}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
          />
          <text
            x={badge.x}
            y={badge.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontWeight={700}
            fontSize={16}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {step}
          </text>
        </g>
      )}
    </g>
  );
}

function pathLength(points: Pt[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

/* ------------------------------ Arrow visual ----------------------------- */

/** A non-interactive arrow (used for the live drawing preview). */
function StaticArrow({ arrow }: { arrow: Arrow }) {
  return (
    <LinePath
      points={arrow.points}
      color={arrow.color}
      width={arrow.width ?? 6}
      kind={arrow.kind}
    />
  );
}

type ArrowMode = "move" | "erase" | "none";

/** An arrow that can be selected, moved, reshaped or erased. */
const EditableArrow = memo(function EditableArrow({
  arrow,
  anchorX,
  anchorY,
  mode,
  selected,
  step,
  toRel,
  onSelect,
  onErase,
  onTranslate,
  onPointMove,
}: {
  arrow: Arrow;
  anchorX?: number;
  anchorY?: number;
  mode: ArrowMode;
  selected: boolean;
  step?: number;
  toRel: (clientX: number, clientY: number) => Pt;
  onSelect: (id: string) => void;
  onErase: (id: string) => void;
  onTranslate: (id: string, dx: number, dy: number) => void;
  onPointMove: (id: string, index: number, x: number, y: number) => void;
}) {
  const anchored = anchorX != null && anchorY != null;
  // The live start point follows the anchored player; the rest is stored.
  const points = anchored
    ? [{ x: anchorX, y: anchorY }, ...arrow.points.slice(1)]
    : arrow.points;
  const d = buildPath(points);
  const w = arrow.width ?? 6;
  const drag = useRef<{ kind: "body" | number; last: Pt } | null>(null);
  const [hover, setHover] = useState<"body" | number | null>(null);
  const [active, setActive] = useState<"body" | number | null>(null);

  function release(e: RPointerEvent) {
    drag.current = null;
    setActive(null);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }

  function onBodyDown(e: RPointerEvent) {
    e.stopPropagation();
    if (mode === "erase") {
      onErase(arrow.id);
      return;
    }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect(arrow.id);
    setActive("body");
    // Anchored lines keep their start on a player, so the whole line can't be
    // dragged freely — only the end handle moves it.
    if (!anchored) {
      drag.current = { kind: "body", last: toRel(e.clientX, e.clientY) };
    }
  }
  function onBodyMove(e: RPointerEvent) {
    const st = drag.current;
    if (!st || st.kind !== "body") return;
    const p = toRel(e.clientX, e.clientY);
    onTranslate(arrow.id, p.x - st.last.x, p.y - st.last.y);
    st.last = p;
  }

  function onHandleDown(e: RPointerEvent, idx: number) {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect(arrow.id);
    setActive(idx);
    drag.current = { kind: idx, last: toRel(e.clientX, e.clientY) };
  }
  function onHandleMove(e: RPointerEvent, idx: number) {
    const st = drag.current;
    if (!st || st.kind !== idx) return;
    const p = toRel(e.clientX, e.clientY);
    onPointMove(arrow.id, idx, p.x, p.y);
  }

  const interactive = mode !== "none";
  // Anchored lines only expose the end handle (start is locked to a player).
  const handleIdx = anchored
    ? [points.length - 1]
    : points.length > 1
      ? [0, points.length - 1]
      : [0];
  const glow: Glow =
    mode === "move"
      ? selected
        ? "select"
        : hover === "body"
          ? "hover"
          : "none"
      : "none";

  return (
    <g>
      {/* invisible wide hit area for selecting / moving / erasing */}
      {interactive && (
        <path
          d={d}
          stroke="transparent"
          strokeWidth={Math.max(34, w + 26)}
          fill="none"
          strokeLinecap="round"
          style={{
            cursor: mode === "erase" ? "pointer" : CURSOR_MOVE,
            pointerEvents: "stroke",
          }}
          onPointerEnter={() => setHover("body")}
          onPointerLeave={() => setHover((h) => (h === "body" ? null : h))}
          onPointerDown={onBodyDown}
          onPointerMove={onBodyMove}
          onPointerUp={release}
        />
      )}

      {/* the visible line */}
      <LinePath
        points={points}
        color={arrow.color}
        width={w}
        kind={arrow.kind}
        glow={glow}
        step={step}
      />

      {/* endpoint handles when selected in move mode */}
      {selected &&
        mode === "move" &&
        handleIdx.map((idx) => {
          const pt = points[idx];
          const hcx = X(pt.x);
          const hcy = Y(pt.y);
          const hot = hover === idx || active === idx;
          const isActive = active === idx;
          return (
            <g key={idx}>
              {hot && (
                <circle
                  cx={hcx}
                  cy={hcy}
                  r={19}
                  fill="#34d399"
                  opacity={0.3}
                  style={{ pointerEvents: "none" }}
                />
              )}
              <circle
                cx={hcx}
                cy={hcy}
                r={hot ? 12 : 9}
                fill={isActive ? "#34d399" : "#ffffff"}
                stroke={isActive ? "#ffffff" : "#0b1220"}
                strokeWidth={2.5}
                style={{
                  pointerEvents: "none",
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))",
                }}
              />
              {/* large transparent hit target */}
              <circle
                cx={hcx}
                cy={hcy}
                r={22}
                fill="transparent"
                style={{ cursor: CURSOR_GRAB, pointerEvents: "all" }}
                onPointerEnter={() => setHover(idx)}
                onPointerLeave={() => setHover((h) => (h === idx ? null : h))}
                onPointerDown={(e) => onHandleDown(e, idx)}
                onPointerMove={(e) => onHandleMove(e, idx)}
                onPointerUp={release}
              />
            </g>
          );
        })}
    </g>
  );
});

/* ------------------------------- The board ------------------------------- */

export default function TacticsBoard() {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<string | null>(null); // player id or "ball"
  const drawStartRef = useRef<{ anchorId: string | null; start: Pt } | null>(null);
  const pendingRef = useRef(false); // waiting for the 2nd click of a two-click line
  const movedRef = useRef(false); // pointer moved enough to count as a drag
  const moveRafRef = useRef<number | null>(null); // throttles drag updates to 1/frame
  const pendingMoveRef = useRef<Pt | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pt[] | null>(null);
  const [hoverPlayerId, setHoverPlayerId] = useState<string | null>(null);
  const [hoverTokenId, setHoverTokenId] = useState<string | null>(null);

  const players = useBoard((s) => s.players);
  const arrows = useBoard((s) => s.arrows);
  const ball = useBoard((s) => s.ball);
  const tool = useBoard((s) => s.tool);
  const color = useBoard((s) => s.color);
  const penWidth = useBoard((s) => s.penWidth);
  const display = useBoard((s) => s.display);
  const selectedId = useBoard((s) => s.selectedId);
  const selectedArrowId = useBoard((s) => s.selectedArrowId);
  const isPlaying = useBoard((s) => s.isPlaying);
  const playFrozen = useBoard((s) => s.playFrozen);
  const playStep = useBoard((s) => s.playStep);

  const addArrow = useBoard((s) => s.addArrow);
  const removeArrow = useBoard((s) => s.removeArrow);
  const select = useBoard((s) => s.select);
  const setTool = useBoard((s) => s.setTool);
  const selectArrow = useBoard((s) => s.selectArrow);
  const translateArrow = useBoard((s) => s.translateArrow);
  const setArrowPoint = useBoard((s) => s.setArrowPoint);

  const drawing = tool === "arrow" || tool === "dash" || tool === "line";

  // Delete the selected line with the keyboard (ignore while typing in inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Escape cancels a line that is being drawn (drag or pending 2nd click).
      if (e.key === "Escape") {
        if (drawStartRef.current || pendingRef.current) {
          drawStartRef.current = null;
          pendingRef.current = false;
          movedRef.current = false;
          setDraft(null);
          setHoverPlayerId(null);
          e.preventDefault();
        }
        return;
      }
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const id = useBoard.getState().selectedArrowId;
      if (id) {
        e.preventDefault();
        removeArrow(id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeArrow]);

  const toRel = useCallback((clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }, []);

  // Stable callbacks so memoized arrows don't re-render every frame on a drag.
  const onSelectArrow = useCallback((id: string) => selectArrow(id), [selectArrow]);
  const onEraseArrow = useCallback((id: string) => removeArrow(id), [removeArrow]);
  const onTranslateArrowCb = useCallback(
    (id: string, dx: number, dy: number) => translateArrow(id, dx, dy),
    [translateArrow]
  );
  const onPointMoveCb = useCallback(
    (id: string, idx: number, x: number, y: number) => setArrowPoint(id, idx, x, y),
    [setArrowPoint]
  );

  const playerById = new Map(players.map((p) => [p.id, p]));
  // During playback, anchor lines to the frozen start positions so they stay static.
  const anchorById = playFrozen
    ? new Map(playFrozen.map((p) => [p.id, p]))
    : playerById;

  // Phases (distinct step values, ascending). A line whose phase already ran is hidden.
  const phaseSteps = [
    ...new Set(arrows.filter((a) => a.kind !== "line").map((a) => a.step ?? 1)),
  ].sort((x, y) => x - y);
  const isPlayed = (a: Arrow) => {
    if (a.kind === "line") return false;
    const idx = phaseSteps.indexOf(a.step ?? 1);
    return idx >= 0 && idx < playStep;
  };

  /** The player closest to a relative point (used to anchor run/pass lines). */
  function nearestPlayer(p: Pt) {
    let best: (typeof players)[number] | null = null;
    let bestD = Infinity;
    for (const pl of players) {
      const d = Math.hypot(pl.x - p.x, pl.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = pl;
      }
    }
    return best;
  }

  /* --- token dragging (window-level so it survives DOM reorder / cursor leaving) --- */
  function onTokenDown(e: RPointerEvent, id: string) {
    if (tool !== "move") return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = id;
    pendingMoveRef.current = null;
    setDragId(id);
    if (id !== "ball") select(id);
  }

  useEffect(() => {
    if (!dragId) return;
    const flush = () => {
      const mp = pendingMoveRef.current;
      const cur = dragRef.current;
      if (!mp || !cur) return;
      const st = useBoard.getState();
      if (cur === "ball") st.moveBall(mp.x, mp.y);
      else st.movePlayer(cur, mp.x, mp.y);
    };
    const onMove = (e: PointerEvent) => {
      // Coalesce high-frequency pointer events into one store update per frame.
      pendingMoveRef.current = toRel(e.clientX, e.clientY);
      if (moveRafRef.current != null) return;
      moveRafRef.current = requestAnimationFrame(() => {
        moveRafRef.current = null;
        flush();
      });
    };
    const onUp = () => {
      if (moveRafRef.current != null) {
        cancelAnimationFrame(moveRafRef.current);
        moveRafRef.current = null;
      }
      flush(); // commit final position
      pendingMoveRef.current = null;
      dragRef.current = null;
      setDragId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragId, toRel]);

  /* --- drawing on the pitch --- */
  const MOVE_THRESHOLD = 1.6; // relative units to tell a drag from a click

  const resetDraw = useCallback(() => {
    drawStartRef.current = null;
    pendingRef.current = false;
    movedRef.current = false;
    setDraft(null);
    setHoverPlayerId(null);
  }, []);

  function commitArrow(start: Pt, end: Pt, anchorId: string | null) {
    if (pathLength([start, end]) <= 1.5) return;
    // New run/pass starts in its own phase (max existing phase + 1).
    const existing = useBoard.getState().arrows;
    const maxStep = existing.reduce(
      (m, a) => (a.kind !== "line" ? Math.max(m, a.step ?? 0) : m),
      0
    );
    const arrow: Arrow = {
      id: uid("a-"),
      kind: tool as ArrowKind,
      color,
      width: penWidth,
      points: [start, end],
      anchorId: anchorId ?? undefined,
      step: maxStep + 1,
    };
    // Switch to Move first (clears selection), then add so it ends up selected.
    setTool("move");
    addArrow(arrow);
  }

  function onSurfaceDown(e: RPointerEvent) {
    if (useBoard.getState().isPlaying) return;
    const p = toRel(e.clientX, e.clientY);

    // Free draw: classic press-drag-release freehand.
    if (tool === "line") {
      setDraft([p]);
      svgRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Run / Pass: click-then-click, or press-drag-release.
    if (tool === "arrow" || tool === "dash") {
      // Second click of a two-click line → finish it here.
      if (pendingRef.current && drawStartRef.current) {
        commitArrow(drawStartRef.current.start, p, drawStartRef.current.anchorId);
        resetDraw();
        return;
      }
      // First press → anchor the start to the nearest player.
      const np = nearestPlayer(p);
      const start = np ? { x: np.x, y: np.y } : p;
      drawStartRef.current = { anchorId: np ? np.id : null, start };
      movedRef.current = false;
      pendingRef.current = false;
      setHoverPlayerId(np ? np.id : null);
      setDraft([start, start]);
      svgRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Move / Erase: clicking empty space clears the selection.
    select(null);
  }

  function onSurfaceMove(e: RPointerEvent) {
    const p = toRel(e.clientX, e.clientY);

    // Free draw freehand.
    if (tool === "line") {
      if (!draft) return;
      setDraft((prev) => {
        if (!prev) return prev;
        const last = prev[prev.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) < 0.7) return prev;
        return [...prev, p];
      });
      return;
    }

    // Run / Pass: rubber-band the end while pressing or while pending.
    if ((tool === "arrow" || tool === "dash") && drawStartRef.current) {
      const start = drawStartRef.current.start;
      if (Math.hypot(p.x - start.x, p.y - start.y) > MOVE_THRESHOLD) {
        movedRef.current = true;
      }
      setDraft([start, p]);
      return;
    }

    // Idle: highlight the player a run/pass line would attach to.
    if (tool === "arrow" || tool === "dash") {
      const np = nearestPlayer(p);
      setHoverPlayerId(np ? np.id : null);
    } else if (hoverPlayerId !== null) {
      setHoverPlayerId(null);
    }
  }

  function onSurfaceUp(e: RPointerEvent) {
    // Free draw freehand → commit on release.
    if (tool === "line") {
      if (draft && pathLength(draft) > 1.5) {
        setTool("move");
        addArrow({
          id: uid("a-"),
          kind: "line",
          color,
          width: penWidth,
          points: draft,
        });
      }
      setDraft(null);
      return;
    }

    // Run / Pass.
    if ((tool === "arrow" || tool === "dash") && drawStartRef.current) {
      if (movedRef.current) {
        // Dragged → commit straight away.
        const end = toRel(e.clientX, e.clientY);
        commitArrow(drawStartRef.current.start, end, drawStartRef.current.anchorId);
        resetDraw();
      } else {
        // Just a click → wait for a second click; keep the preview & highlight.
        pendingRef.current = true;
        try {
          svgRef.current?.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      }
    }
  }

  // Cancel any in-progress / pending line when the active tool changes.
  useEffect(() => {
    resetDraw();
  }, [tool, resetDraw]);

  const tokenPointer = tool === "move" && !isPlaying ? "auto" : "none";
  const tokenCursor = tool === "move" && !isPlaying ? CURSOR_GRAB : undefined;

  // Which elements get raised to the top layer (selected / being dragged).
  const draggingPlayer = dragId && dragId !== "ball" ? dragId : null;
  const topPlayerId = draggingPlayer ?? selectedId;
  const ballTop = dragId === "ball";

  function renderArrow(a: Arrow) {
    const anchor = a.anchorId ? anchorById.get(a.anchorId) : undefined;
    return (
      <EditableArrow
        key={a.id}
        arrow={a}
        anchorX={anchor?.x}
        anchorY={anchor?.y}
        mode={
          isPlaying
            ? "none"
            : tool === "move"
              ? "move"
              : tool === "erase"
                ? "erase"
                : "none"
        }
        selected={selectedArrowId === a.id}
        step={a.kind === "line" ? undefined : a.step}
        toRel={toRel}
        onSelect={onSelectArrow}
        onErase={onEraseArrow}
        onTranslate={onTranslateArrowCb}
        onPointMove={onPointMoveCb}
      />
    );
  }

  function renderBall() {
    if (!ball) return null;
    const isHover = tool === "move" && hoverTokenId === "ball";
    return (
      <g
        key="ball"
        style={{
          transform: `translate(${X(ball.x)}px, ${Y(ball.y)}px)`,
          transition: dragId === "ball" ? "none" : "transform .25s ease",
          willChange: dragId === "ball" ? "transform" : undefined,
          cursor: tokenCursor,
          pointerEvents: tokenPointer,
        }}
        onPointerDown={(e) => onTokenDown(e, "ball")}
        onPointerEnter={() => tool === "move" && setHoverTokenId("ball")}
        onPointerLeave={() => setHoverTokenId((h) => (h === "ball" ? null : h))}
      >
        {isHover && (
          <circle r={22} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.55} />
        )}
        <circle r={17} fill="#fff" stroke="#111" strokeWidth={2} filter="url(#tokenShadow)" />
        <path d="M0,-9 L8.5,-2.8 L5.3,7.3 L-5.3,7.3 L-8.5,-2.8 Z" fill="#111" transform="scale(0.8)" />
      </g>
    );
  }

  function renderPlayer(p: PlayerToken) {
    const isSel = selectedId === p.id;
    const isHover = tool === "move" && hoverTokenId === p.id;
    const anchorHint =
      (tool === "arrow" || tool === "dash") && hoverPlayerId === p.id;
    const fill = p.team === "home" ? "var(--color-home)" : "var(--color-away)";
    const primary = display === "number" ? String(p.number) : p.label;
    const primarySize = primary.length >= 3 ? 16 : primary.length === 2 ? 22 : 27;
    return (
      <g
        key={p.id}
        style={{
          transform: `translate(${X(p.x)}px, ${Y(p.y)}px)`,
          transition: dragId === p.id ? "none" : "transform .28s ease",
          willChange: dragId === p.id ? "transform" : undefined,
          cursor: tokenCursor,
          pointerEvents: tokenPointer,
        }}
        onPointerDown={(e) => onTokenDown(e, p.id)}
        onPointerEnter={() => tool === "move" && setHoverTokenId(p.id)}
        onPointerLeave={() => setHoverTokenId((h) => (h === p.id ? null : h))}
      >
        {anchorHint && (
          <>
            <circle r={PLAYER_R + 8} fill="#ffd54a" opacity={0.16} />
            <circle
              r={PLAYER_R + 8}
              fill="none"
              stroke="#ffd54a"
              strokeWidth={4}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,213,74,0.9))" }}
            />
            <circle
              r={PLAYER_R + 8}
              fill="none"
              stroke="#ffd54a"
              strokeWidth={4}
              className="animate-anchorping"
            />
          </>
        )}
        {isHover && !isSel && (
          <circle r={PLAYER_R + 5} fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.5} />
        )}
        {isSel && (
          <circle r={PLAYER_R + 6} fill="none" stroke="#fff" strokeWidth={3} opacity={0.95} />
        )}
        <circle
          r={PLAYER_R}
          fill={fill}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={3}
          filter="url(#tokenShadow)"
        />
        <text
          y={1}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontWeight={700}
          fontSize={primarySize}
          style={{
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "0",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {primary}
        </text>
      </g>
    );
  }

  const topPlayer = topPlayerId
    ? players.find((p) => p.id === topPlayerId) ?? null
    : null;
  const topArrow = selectedArrowId
    ? arrows.find((a) => a.id === selectedArrowId) ?? null
    : null;

  return (
    <svg
      ref={svgRef}
      className="block h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onSurfaceDown}
      onPointerMove={onSurfaceMove}
      onPointerUp={onSurfaceUp}
      onPointerLeave={() => {
        setHoverPlayerId(null);
        setHoverTokenId(null);
      }}
      style={{ cursor: drawing ? CURSOR_DRAW : undefined }}
    >
      <defs>
        <filter id="tokenShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <Pitch />

      {/* base arrows (skip the selected one and phases already played) */}
      <g>
        {arrows
          .filter((a) => a.id !== selectedArrowId && !isPlayed(a))
          .map(renderArrow)}
      </g>

      {/* base ball / players */}
      {ball && !ballTop && renderBall()}
      {players.filter((p) => p.id !== topPlayerId).map(renderPlayer)}

      {/* TOP LAYER — the clicked / dragged component sits above everything */}
      {topArrow && !isPlayed(topArrow) && renderArrow(topArrow)}
      {topPlayer && renderPlayer(topPlayer)}
      {ball && ballTop && renderBall()}

      {/* live drawing preview, always on top */}
      {draft && draft.length > 0 && (
        <StaticArrow
          arrow={{ id: "draft", kind: tool as ArrowKind, color, width: penWidth, points: draft }}
        />
      )}
    </svg>
  );
}
