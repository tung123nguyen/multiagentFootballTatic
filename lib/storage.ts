"use client";

import type { Tactic } from "./types";

const LS_LIST = "tacticboard.tactics.v1";
const LS_BOARD = "tacticboard.board.v1";

/* ----------------------------- Local storage ----------------------------- */

export function loadSavedList(): Tactic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_LIST);
    if (!raw) return [];
    const list = JSON.parse(raw) as Tactic[];
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function persistList(list: Tactic[]) {
  try {
    localStorage.setItem(LS_LIST, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

export function upsertLocal(tactic: Tactic): Tactic[] {
  const list = loadSavedList();
  const idx = list.findIndex((t) => t.id === tactic.id);
  if (idx >= 0) list[idx] = tactic;
  else list.push(tactic);
  persistList(list);
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteLocal(id: string): Tactic[] {
  const list = loadSavedList().filter((t) => t.id !== id);
  persistList(list);
  return list;
}

/* ------------------------- Autosave of live board ------------------------- */

export function saveBoard(tactic: Tactic) {
  try {
    localStorage.setItem(LS_BOARD, JSON.stringify(tactic));
  } catch {
    /* ignore */
  }
}

export function loadBoard(): Tactic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_BOARD);
    return raw ? (JSON.parse(raw) as Tactic) : null;
  } catch {
    return null;
  }
}

/* ------------------------------ Import / export --------------------------- */

export function downloadJSON(tactic: Tactic) {
  const blob = new Blob([JSON.stringify(tactic, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(tactic.name)}.tactic.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "tactic"
  );
}

/* ----------------------------- Server (full-stack) ------------------------ */

export async function fetchServerTactics(): Promise<Tactic[]> {
  const res = await fetch("/api/tactics", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load from server");
  return res.json();
}

export async function saveServerTactic(tactic: Tactic): Promise<Tactic> {
  const res = await fetch("/api/tactics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tactic),
  });
  if (!res.ok) throw new Error("Failed to save to server");
  return res.json();
}

export async function deleteServerTactic(id: string): Promise<void> {
  const res = await fetch(`/api/tactics?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete on server");
}
