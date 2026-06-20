"use client";

import { create } from "zustand";

interface UIState {
  /** Current tactic name (shared by the top bar and the library panel). */
  name: string;
  setName: (n: string) => void;

  libraryOpen: boolean;
  setLibraryOpen: (v: boolean) => void;
  toggleLibrary: () => void;

  /** Transient toast message. */
  toast: string | null;
  flash: (msg: string) => void;
}

let toastTimer: number | undefined;

export const useUI = create<UIState>((set) => ({
  name: "New tactic",
  setName: (n) => set({ name: n }),

  libraryOpen: false,
  setLibraryOpen: (v) => set({ libraryOpen: v }),
  toggleLibrary: () => set((s) => ({ libraryOpen: !s.libraryOpen })),

  toast: null,
  flash: (msg) => {
    set({ toast: msg });
    if (typeof window !== "undefined") {
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => set({ toast: null }), 2400);
    }
  },
}));
