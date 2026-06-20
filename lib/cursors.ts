/** Custom SVG cursors (encoded so they work as inline styles). */

function svgCursor(svg: string, hotX: number, hotY: number, fallback: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotX} ${hotY}, ${fallback}`;
}

const MOVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 4V26M4 15H26M15 4L11 8M15 4L19 8M15 26L11 22M15 26L19 22M4 15L8 11M4 15L8 19M26 15L22 11M26 15L22 19" fill="none" stroke="#0b1220" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 4V26M4 15H26M15 4L11 8M15 4L19 8M15 26L11 22M15 26L19 22M4 15L8 11M4 15L8 19M26 15L22 11M26 15L22 19" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const GRAB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="8.5" fill="rgba(52,211,153,0.18)" stroke="#0b1220" stroke-width="4"/><circle cx="14" cy="14" r="8.5" fill="none" stroke="#ffffff" stroke-width="1.8"/><circle cx="14" cy="14" r="2.6" fill="#ffffff" stroke="#0b1220" stroke-width="1.2"/></svg>`;

const DRAW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path d="M13 3V11M13 15V23M3 13H11M15 13H23" stroke="#0b1220" stroke-width="4" stroke-linecap="round"/><path d="M13 3V11M13 15V23M3 13H11M15 13H23" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/></svg>`;

export const CURSOR_MOVE = svgCursor(MOVE_SVG, 15, 15, "move");
export const CURSOR_GRAB = svgCursor(GRAB_SVG, 14, 14, "grab");
export const CURSOR_DRAW = svgCursor(DRAW_SVG, 13, 13, "crosshair");
