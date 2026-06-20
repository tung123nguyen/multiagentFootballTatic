"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-glass border border-line text-foreground hover:border-line-2 hover:bg-glass-2",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-strong shadow-[0_6px_20px_-4px_rgba(16,185,129,0.5)]",
        ghost: "text-muted hover:text-foreground hover:bg-glass",
        danger:
          "bg-glass border border-line text-foreground hover:border-away/60 hover:text-away",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3.5 text-sm",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
