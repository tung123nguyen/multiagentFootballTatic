"use client";

import { useEffect, useRef, useState } from "react";
import {
  CloudDownload,
  CloudUpload,
  Download,
  FolderOpen,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useBoard } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import type { Tactic } from "@/lib/types";
import {
  deleteLocal,
  downloadJSON,
  fetchServerTactics,
  loadSavedList,
  saveServerTactic,
  upsertLocal,
} from "@/lib/storage";
import { Button } from "./ui/Button";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function LibraryPanel() {
  const open = useUI((s) => s.libraryOpen);
  const setOpen = useUI((s) => s.setLibraryOpen);
  const name = useUI((s) => s.name);
  const setName = useUI((s) => s.setName);
  const flash = useUI((s) => s.flash);

  const snapshot = useBoard((s) => s.snapshot);
  const loadTactic = useBoard((s) => s.loadTactic);

  const [saved, setSaved] = useState<Tactic[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setSaved(loadSavedList());
  }, [open]);

  function handleSave() {
    const t = snapshot(name.trim() || "Tactic");
    setSaved(upsertLocal(t));
    flash("Saved on this device");
  }
  function handleLoad(t: Tactic) {
    loadTactic(t);
    setName(t.name);
    flash(`Opened “${t.name}”`);
    setOpen(false);
  }
  function handleDelete(id: string) {
    setSaved(deleteLocal(id));
  }
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const t = JSON.parse(String(reader.result)) as Tactic;
        loadTactic(t);
        setName(t.name ?? "Imported");
        flash("Tactic file imported");
        setOpen(false);
      } catch {
        flash("Invalid file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  async function pushServer() {
    try {
      const t = snapshot(name.trim() || "Tactic");
      await saveServerTactic(t);
      setSaved(upsertLocal(t));
      flash("Saved to server");
    } catch {
      flash("Server save failed");
    }
  }
  async function pullServer() {
    try {
      const list = await fetchServerTactics();
      list.forEach((t) => upsertLocal(t));
      setSaved(loadSavedList());
      flash(`Loaded ${list.length} from server`);
    } catch {
      flash("Server load failed");
    }
  }

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />

      {/* panel */}
      <aside className="glass-2 animate-slide-right absolute right-0 top-0 flex h-full w-[340px] max-w-[88vw] flex-col rounded-l-2xl">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3.5">
          <FolderOpen size={18} className="text-primary" />
          <h2 className="text-[15px] font-bold">Library</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="ml-auto grid h-8 w-8 place-items-center rounded-xl text-muted transition-colors hover:bg-glass-2 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-3 p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tactic name"
            className="w-full rounded-xl border border-line bg-glass-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60 placeholder:text-faint"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" size="md" onClick={handleSave}>
              <Save size={16} /> Save
            </Button>
            <Button variant="default" size="md" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" onClick={pushServer}>
              <CloudUpload size={15} /> To server
            </Button>
            <Button variant="ghost" size="sm" onClick={pullServer}>
              <CloudDownload size={15} /> From server
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <div className="mb-2 flex items-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-faint">
          Saved tactics
          <span className="rounded-full bg-glass-2 px-1.5 py-0.5 text-[10px] text-muted">
            {saved.length}
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {saved.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[13px] text-faint">
              No saved tactics yet.
            </p>
          )}
          {saved.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-2 rounded-xl border border-line bg-glass-2 px-3 py-2.5 transition-colors hover:border-line-2"
            >
              <button
                onClick={() => handleLoad(t)}
                className="min-w-0 flex-1 text-left"
                title={t.name}
              >
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="text-[11px] text-faint">
                  {t.formationHome}
                  {t.showAway ? ` vs ${t.formationAway}` : ""} · {formatDate(t.updatedAt)}
                </div>
              </button>
              <button
                onClick={() => downloadJSON(t)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-glass hover:text-accent"
                title="Export"
              >
                <Download size={15} />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-away/15 hover:text-away"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
