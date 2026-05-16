"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ className, label, error, icon, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-neon-green/60"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green/40">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full bg-matrix-surface border border-matrix-border rounded-lg py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-neon-green/50 focus:shadow-[0_0_0_2px_rgba(0,255,65,0.1),0_0_15px_rgba(0,255,65,0.05)]",
            icon ? "pl-10 pr-4" : "px-4",
            error && "border-neon-red/50 focus:border-neon-red/60",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-neon-red flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
