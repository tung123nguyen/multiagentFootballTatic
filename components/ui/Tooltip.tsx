"use client";

import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

const pos: Record<Side, string> = {
  right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
};

export function Tip({
  label,
  side = "bottom",
  children,
  className,
}: {
  label: string;
  side?: Side;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "glass-2 pointer-events-none absolute z-[60] whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-float transition-opacity duration-150 group-hover/tip:opacity-100",
          pos[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
