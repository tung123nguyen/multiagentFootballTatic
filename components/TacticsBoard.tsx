"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from "react";
import { Pitch, VIEW_W, VIEW_H } from "./Pitch";
import { useBoard } from "@/lib/store";
import type { Arrow, ArrowKind } from "@/lib/types";
import { clamp, uid } from "@/lib/utils";
import { CURSOR_DRAW, CURSOR_GRAB, CURSOR_MOVE } from "@/lib/cursors";

const PLAYER_R = 27;

const X = (rx: number) => (rx / 100) * VIEW_W;
const Y = (ry: number) => (ry / 100) * VIEW_H;

type Pt = { x: number; y: number };

/* ----------------------------- Path helpers ------------------------------ */

function buildPath(points: Pt[]): string {
  const P = points.map((p) => [X(p.x), Y(p.y)] as const);
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

function arrowHead(points: Pt[], color: string, width = 6) {
  if (points.length < 2) return null;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  const ex = X(b.x);
  const ey = Y(b.y);
  const ang = Math.atan2(Y(b.y) - Y(a.y), X(b.x) - X(a.x));
  const size = 18 + width * 2;
  const spread = 0.42;
  const x1 = ex + size * Math.cos(ang + Math.PI - spread);
  const y1 = ey + size * Math.sin(ang + Math.PI - spread);
  const x2 = ex + size * Math.cos(ang + Math.PI + spread);
  const y2 = ey + size * Math.sin(ang + Math.PI + spread);
  return (
    <path
      d={`M ${ex} ${ey} L ${x1} ${y1} L ${x2} ${y2} Z`}
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
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
  const d = buildPath(arrow.points);
  const w = arrow.width ?? 6;
  return (
    <g>
      <path
        d={d}
        stroke={arrow.color}
        strokeWidth={w}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={arrow.kind === "dash" ? `${w * 3} ${w * 2.4}` : undefined}
        style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }}
      />
      {arrow.kind !== "line" && arrowHead(arrow.points, arrow.color, w)}
    </g>
  );
}

type ArrowMode = "move" | "erase" | "none";

/** An arrow that can be selected, moved, reshaped or erased. */
function EditableArrow({
  arrow,
  mode,
  selected,
  anchored,
  toRel,
  onSelect,
  onErase,
  onTranslate,
  onPointMove,
}: {
  arrow: Arrow;
  mode: ArrowMode;
  selected: boolean;
  anchored: boolean;
  toRel: (clientX: number, clientY: number) => Pt;
  onSelect: () => void;
  onErase: () => void;
  onTranslate: (dx: number, dy: number) => void;
  onPointMove: (index: number, x: number, y: number) => void;
}) {
  const d = buildPath(arrow.points);
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
      onErase();
      return;
    }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect();
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
    onTranslate(p.x - st.last.x, p.y - st.last.y);
    st.last = p;
  }

  function onHandleDown(e: RPointerEvent, idx: number) {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onSelect();
    setActive(idx);
    drag.current = { kind: idx, last: toRel(e.clientX, e.clientY) };
  }
  function onHandleMove(e: RPointerEvent, idx: number) {
    const st = drag.current;
    if (!st || st.kind !== idx) return;
    const p = toRel(e.clientX, e.clientY);
    onPointMove(idx, p.x, p.y);
  }

  const interactive = mode !== "none";
  // Anchored lines only expose the end handle (start is locked to a player).
  const handleIdx = anchored
    ? [arrow.points.length - 1]
    : arrow.points.length > 1
      ? [0, arrow.points.length - 1]
      : [0];
  const showHalo = mode === "move" && (selected || hover === "body");

  return (
    <g>
      {/* hover / selection halo */}
      {showHalo && (
        <path
          d={d}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={selected ? 0.9 : 0.4}
          strokeWidth={w + (selected ? 8 : 6)}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        />
      )}

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
      <path
        d={d}
        stroke={arrow.color}
        strokeWidth={w}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={arrow.kind === "dash" ? `${w * 3} ${w * 2.4}` : undefined}
        style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }}
      />
      {arrow.kind !== "line" && arrowHead(arrow.points, arrow.color, w)}

      {/* endpoint handles when selected in move mode */}
      {selected &&
        mode === "move" &&
        handleIdx.map((idx) => {
          const pt = arrow.points[idx];
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
}

/* ------------------------------- The board ------------------------------- */

export default function TacticsBoard() {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<string | null>(null); // player id or "ball"
  const drawStartRef = useRef<{ anchorId: string | null; start: Pt } | null>(null);
  const pendingRef = useRef(false); // waiting for the 2nd click of a two-click line
  const movedRef = useRef(false); // pointer moved enough to count as a drag
  const [dragId, setDragId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pt[] | null>(null);
  const [hoverPlayerId, setHoverPlayerId] = useState<string | null>(null);

  const players = useBoard((s) => s.players);
  const arrows = useBoard((s) => s.arrows);
  const ball = useBoard((s) => s.ball);
  const tool = useBoard((s) => s.tool);
  const color = useBoard((s) => s.color);
  const penWidth = useBoard((s) => s.penWidth);
  const display = useBoard((s) => s.display);
  const selectedId = useBoard((s) => s.selectedId);
  const selectedArrowId = useBoard((s) => s.selectedArrowId);

  const movePlayer = useBoard((s) => s.movePlayer);
  const moveBall = useBoard((s) => s.moveBall);
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

  function toRel(clientX: number, clientY: number): Pt {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  const playerById = new Map(players.map((p) => [p.id, p]));

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

  /* --- token dragging --- */
  function onTokenDown(e: RPointerEvent, id: string) {
    if (tool !== "move") return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = id;
    setDragId(id);
    if (id !== "ball") select(id);
  }
  function onTokenMove(e: RPointerEvent, id: string) {
    if (dragRef.current !== id) return;
    const p = toRel(e.clientX, e.clientY);
    if (id === "ball") moveBall(p.x, p.y);
    else movePlayer(id, p.x, p.y);
  }
  function onTokenUp(e: RPointerEvent) {
    dragRef.current = null;
    setDragId(null);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }

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
    const arrow: Arrow = {
      id: uid("a-"),
      kind: tool as ArrowKind,
      color,
      width: penWidth,
      points: [start, end],
      anchorId: anchorId ?? undefined,
    };
    // Switch to Move first (clears selection), then add so it ends up selected.
    setTool("move");
    addArrow(arrow);
  }

  function onSurfaceDown(e: RPointerEvent) {
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

  const tokenPointer = tool === "move" ? "auto" : "none";
  const tokenCursor = tool === "move" ? CURSOR_GRAB : undefined;

  return (
    <svg
      ref={svgRef}
      className="block h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onSurfaceDown}
      onPointerMove={onSurfaceMove}
      onPointerUp={onSurfaceUp}
      onPointerLeave={() => setHoverPlayerId(null)}
      style={{ cursor: drawing ? CURSOR_DRAW : undefined }}
    >
      <defs>
        <filter id="tokenShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <Pitch />

      {/* committed arrows */}
      <g>
        {arrows.map((a) => {
          const anchor = a.anchorId ? playerById.get(a.anchorId) : undefined;
          const effArrow = anchor
            ? { ...a, points: [{ x: anchor.x, y: anchor.y }, ...a.points.slice(1)] }
            : a;
          return (
            <EditableArrow
              key={a.id}
              arrow={effArrow}
              anchored={!!anchor}
              mode={tool === "move" ? "move" : tool === "erase" ? "erase" : "none"}
              selected={selectedArrowId === a.id}
              toRel={toRel}
              onSelect={() => selectArrow(a.id)}
              onErase={() => removeArrow(a.id)}
              onTranslate={(dx, dy) => translateArrow(a.id, dx, dy)}
              onPointMove={(idx, x, y) => setArrowPoint(a.id, idx, x, y)}
            />
          );
        })}
      </g>

      {/* live draft */}
      {draft && draft.length > 0 && (
        <StaticArrow
          arrow={{ id: "draft", kind: tool as ArrowKind, color, points: draft }}
        />
      )}

      {/* ball */}
      {ball && (
        <g
          style={{
            transform: `translate(${X(ball.x)}px, ${Y(ball.y)}px)`,
            transition: dragId === "ball" ? "none" : "transform .25s ease",
            cursor: tokenCursor,
            pointerEvents: tokenPointer,
          }}
          onPointerDown={(e) => onTokenDown(e, "ball")}
          onPointerMove={(e) => onTokenMove(e, "ball")}
          onPointerUp={onTokenUp}
        >
          <circle r={17} fill="#fff" stroke="#111" strokeWidth={2} filter="url(#tokenShadow)" />
          <path
            d="M0,-9 L8.5,-2.8 L5.3,7.3 L-5.3,7.3 L-8.5,-2.8 Z"
            fill="#111"
            transform="scale(0.8)"
          />
        </g>
      )}

      {/* players */}
      {players.map((p) => {
        const isSel = selectedId === p.id;
        const anchorHint =
          (tool === "arrow" || tool === "dash") && hoverPlayerId === p.id;
        const fill = p.team === "home" ? "var(--color-home)" : "var(--color-away)";
        return (
          <g
            key={p.id}
            style={{
              transform: `translate(${X(p.x)}px, ${Y(p.y)}px)`,
              transition: dragId === p.id ? "none" : "transform .28s ease",
              cursor: tokenCursor,
              pointerEvents: tokenPointer,
            }}
            onPointerDown={(e) => onTokenDown(e, p.id)}
            onPointerMove={(e) => onTokenMove(e, p.id)}
            onPointerUp={onTokenUp}
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
            {isSel && (
              <circle r={PLAYER_R + 6} fill="none" stroke="#fff" strokeWidth={3} opacity={0.9} />
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
              fontSize={display === "number" ? 30 : 20}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {display === "number" ? p.number : p.label}
            </text>
            <text
              y={PLAYER_R + 18}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.92)"
              fontWeight={600}
              fontSize={16}
              style={{
                pointerEvents: "none",
                userSelect: "none",
                paintOrder: "stroke",
                stroke: "rgba(0,0,0,0.55)",
                strokeWidth: 3,
              }}
            >
              {display === "number" ? p.label : p.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
