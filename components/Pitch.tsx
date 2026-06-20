import { memo } from "react";

/** SVG view box used across the whole board (portrait pitch ≈ 68 x 105 m). */
export const VIEW_W = 1000;
export const VIEW_H = 1540;

const PAD = 38;
const L = PAD;
const R = VIEW_W - PAD;
const T = PAD;
const B = VIEW_H - PAD;
const fieldW = R - L;
const fieldH = B - T;
const cx = VIEW_W / 2;
const cy = VIEW_H / 2;

const CIRCLE_R = 124;

const penHalf = 276;
const penL = cx - penHalf;
const penD = 231;

const gaHalf = 126;
const gaL = cx - gaHalf;
const gaD = 77;

const spotTop = T + 154;
const spotBot = B - 154;

const goalHalf = 66;
const goalDepth = 22;

const LINE = "rgba(255,255,255,0.82)";
const LINE_W = 2.6;

function PitchBase() {
  return (
    <g>
      <defs>
        <clipPath id="arcTop">
          <rect x={0} y={T + penD} width={VIEW_W} height={VIEW_H} />
        </clipPath>
        <clipPath id="arcBot">
          <rect x={0} y={0} width={VIEW_W} height={B - penD} />
        </clipPath>
      </defs>

      {/* Flat grass + subtle mowing stripes */}
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="var(--color-pitch-1)" />
      {Array.from({ length: 10 }).map((_, i) =>
        i % 2 === 1 ? (
          <rect
            key={i}
            x={0}
            y={T + (fieldH / 10) * i}
            width={VIEW_W}
            height={fieldH / 10}
            fill="var(--color-pitch-2)"
          />
        ) : null
      )}

      <g
        fill="none"
        stroke={LINE}
        strokeWidth={LINE_W}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
      >
        <rect x={L} y={T} width={fieldW} height={fieldH} rx={3} />

        <line x1={L} y1={cy} x2={R} y2={cy} />
        <circle cx={cx} cy={cy} r={CIRCLE_R} />
        <circle cx={cx} cy={cy} r={4.5} fill={LINE} stroke="none" />

        <rect x={penL} y={T} width={penHalf * 2} height={penD} />
        <rect x={gaL} y={T} width={gaHalf * 2} height={gaD} />
        <circle cx={cx} cy={spotTop} r={4.5} fill={LINE} stroke="none" />
        <circle cx={cx} cy={spotTop} r={CIRCLE_R} clipPath="url(#arcTop)" />

        <rect x={penL} y={B - penD} width={penHalf * 2} height={penD} />
        <rect x={gaL} y={B - gaD} width={gaHalf * 2} height={gaD} />
        <circle cx={cx} cy={spotBot} r={4.5} fill={LINE} stroke="none" />
        <circle cx={cx} cy={spotBot} r={CIRCLE_R} clipPath="url(#arcBot)" />

        <rect x={cx - goalHalf} y={T - goalDepth} width={goalHalf * 2} height={goalDepth} rx={3} />
        <rect x={cx - goalHalf} y={B} width={goalHalf * 2} height={goalDepth} rx={3} />

        <path d={`M ${L} ${T + 20} A 20 20 0 0 0 ${L + 20} ${T}`} />
        <path d={`M ${R - 20} ${T} A 20 20 0 0 0 ${R} ${T + 20}`} />
        <path d={`M ${L + 20} ${B} A 20 20 0 0 0 ${L} ${B - 20}`} />
        <path d={`M ${R} ${B - 20} A 20 20 0 0 0 ${R - 20} ${B}`} />
      </g>
    </g>
  );
}

export const Pitch = memo(PitchBase);
