"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "neon" | "solid" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "solid",
  size = "md",
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold tracking-wide rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-green/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  const variants = {
    solid:
      "bg-neon-green text-[#050A05] hover:shadow-[0_0_25px_rgba(0,255,65,0.5)] hover:-translate-y-0.5 active:translate-y-0",
    neon: "border border-neon-green text-neon-green hover:bg-neon-green/10 hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]",
    ghost:
      "text-neon-green/70 hover:text-neon-green hover:bg-neon-green/8",
    danger:
      "bg-neon-red/10 border border-neon-red text-neon-red hover:bg-neon-red hover:text-white hover:shadow-[0_0_20px_rgba(255,49,49,0.4)]",
    outline:
      "border border-matrix-border text-foreground/70 hover:border-neon-green/40 hover:text-neon-green",
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
