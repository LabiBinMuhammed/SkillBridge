"use client";

import { cn } from "@/lib/utils";
import type { BadgeRarity, RankTitle } from "@/types";
import { getRankColor, getRankIcon } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "red" | "gold" | "blue" | "purple" | "gray";
  size?: "sm" | "md";
  className?: string;
}

const badgeVariants = {
  green: "bg-neon-green/10 text-neon-green border-neon-green/30",
  red: "bg-neon-red/10 text-neon-red border-neon-red/30",
  gold: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  blue: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  purple: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  gray: "bg-gray-400/10 text-gray-400 border-gray-400/30",
};

export function Badge({ children, variant = "green", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface RankBadgeProps {
  rank: RankTitle;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function RankBadge({ rank, showIcon = true, size = "sm" }: RankBadgeProps) {
  const color = getRankColor(rank);
  const icon = getRankIcon(rank);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm"
      )}
      style={{
        color,
        borderColor: `${color}44`,
        backgroundColor: `${color}11`,
      }}
    >
      {showIcon && <span>{icon}</span>}
      {rank}
    </span>
  );
}

interface RarityBadgeProps {
  rarity: BadgeRarity;
  className?: string;
}

const rarityConfig: Record<BadgeRarity, { label: string; color: string }> = {
  common: { label: "Common", color: "#9CA3AF" },
  uncommon: { label: "Uncommon", color: "#60A5FA" },
  rare: { label: "Rare", color: "#A78BFA" },
  epic: { label: "Epic", color: "#F59E0B" },
  legendary: { label: "Legendary", color: "#00FF41" },
};

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const config = rarityConfig[rarity];
  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-widest", className)}
      style={{
        color: config.color,
        borderColor: `${config.color}44`,
        backgroundColor: `${config.color}11`,
      }}
    >
      {config.label}
    </span>
  );
}
