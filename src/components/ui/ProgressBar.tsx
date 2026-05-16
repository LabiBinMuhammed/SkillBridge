"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: "green" | "red" | "gold" | "blue";
  size?: "xs" | "sm" | "md";
  animated?: boolean;
  className?: string;
}

const colorStyles = {
  green: {
    track: "bg-neon-green/10",
    fill: "bg-gradient-to-r from-[#00CC33] to-[#00FF41]",
    glow: "shadow-[0_0_8px_rgba(0,255,65,0.6)]",
  },
  red: {
    track: "bg-neon-red/10",
    fill: "bg-gradient-to-r from-[#CC0000] to-[#FF3131]",
    glow: "shadow-[0_0_8px_rgba(255,49,49,0.6)]",
  },
  gold: {
    track: "bg-yellow-400/10",
    fill: "bg-gradient-to-r from-[#B8860B] to-[#FFD700]",
    glow: "shadow-[0_0_8px_rgba(255,215,0,0.6)]",
  },
  blue: {
    track: "bg-blue-400/10",
    fill: "bg-gradient-to-r from-[#1D4ED8] to-[#60A5FA]",
    glow: "shadow-[0_0_8px_rgba(96,165,250,0.6)]",
  },
};

const sizeStyles = {
  xs: "h-1",
  sm: "h-2",
  md: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = "green",
  size = "sm",
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const c = colorStyles[color];

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono font-semibold text-neon-green">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full rounded-full overflow-hidden", c.track, sizeStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full",
            c.fill,
            c.glow,
            animated && "transition-all duration-700 ease-out"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface XPBarProps {
  xp: number;
  level: number;
  className?: string;
}

export function XPBar({ xp, level, className }: XPBarProps) {
  const currentLevelXP = (level - 1) * (level - 1) * 100;
  const nextLevelXP = level * level * 100;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-neon-green/70">LVL {level}</span>
        <span className="font-mono text-neon-green/50">
          {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden border border-neon-green/15"
        style={{ background: "rgba(0,255,65,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #009922, #00FF41, #00CC33)",
            boxShadow: "0 0 10px rgba(0,255,65,0.6)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: "shimmer 2s infinite",
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {(nextLevelXP - xp).toLocaleString()} XP to Level {level + 1}
      </p>
    </div>
  );
}
