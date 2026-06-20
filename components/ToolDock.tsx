"use client";

import {
  ArrowUpRight,
  Eraser,
  MousePointer2,
  PencilLine,
  Waypoints,
} from "lucide-react";
import { useBoard } from "@/lib/store";
import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tip } from "./ui/Tooltip";

const TOOLS: { id: Tool; label: string; Icon: typeof MousePointer2 }[] = [
  { id: "move", label: "Select / Move", Icon: MousePointer2 },
  { id: "arrow", label: "Run", Icon: ArrowUpRight },
  { id: "dash", label: "Pass", Icon: Waypoints },
  { id: "line", label: "Free draw", Icon: PencilLine },
  { id: "erase", label: "Erase", Icon: Eraser },
];

export default function ToolDock() {
  const tool = useBoard((s) => s.tool);
  const setTool = useBoard((s) => s.setTool);

  return (
    <div className="glass pointer-events-auto flex flex-col gap-1 rounded-2xl p-1.5">
      {TOOLS.map(({ id, label, Icon }) => {
        const active = tool === id;
        return (
          <Tip key={id} label={label} side="right">
            <button
              onClick={() => setTool(id)}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                "relative grid h-11 w-11 place-items-center rounded-xl transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-2px_rgba(16,185,129,0.6)]"
                  : "text-muted hover:bg-glass-2 hover:text-foreground"
              )}
            >
              <Icon size={20} strokeWidth={2.2} />
            </button>
          </Tip>
        );
      })}
    </div>
  );
}
