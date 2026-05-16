import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RankTitle, TodoPriority, SyllabusStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(coins: number): string {
  if (coins >= 1000) return `${(coins / 1000).toFixed(1)}k`;
  return coins.toString();
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

export function getXPForNextLevel(level: number): number {
  return level * level * 100;
}

export function getCurrentLevelXP(xp: number): number {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  return (level - 1) * (level - 1) * 100;
}

export function getLevelProgress(xp: number): number {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXP = (level - 1) * (level - 1) * 100;
  const nextLevelXP = level * level * 100;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

export function getRankColor(rank: RankTitle): string {
  const colors: Record<RankTitle, string> = {
    novice: "#9CA3AF",
    explorer: "#60A5FA",
    specialist: "#A78BFA",
    master: "#F59E0B",
    grandmaster: "#00FF41",
  };
  return colors[rank];
}

export function getRankIcon(rank: RankTitle): string {
  const icons: Record<RankTitle, string> = {
    novice: "⚡",
    explorer: "🌱",
    specialist: "💎",
    master: "🔥",
    grandmaster: "👑",
  };
  return icons[rank];
}

export function getPriorityColor(priority: TodoPriority): string {
  const colors: Record<TodoPriority, string> = {
    critical: "#FF3131",
    high: "#F59E0B",
    medium: "#60A5FA",
    low: "#9CA3AF",
  };
  return colors[priority];
}

export function getPriorityLabel(priority: TodoPriority): string {
  const labels: Record<TodoPriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority];
}

export function getSyllabusStatusColor(status: SyllabusStatus): string {
  const colors: Record<SyllabusStatus, string> = {
    on_track: "#00FF41",
    lagging: "#FF3131",
    completed: "#00CC33",
    not_started: "#9CA3AF",
  };
  return colors[status];
}

export function getSyllabusStatusLabel(status: SyllabusStatus): string {
  const labels: Record<SyllabusStatus, string> = {
    on_track: "On Track",
    lagging: "Lagging",
    completed: "Completed",
    not_started: "Not Started",
  };
  return labels[status];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getDifficultyLabel(difficulty: number): string {
  const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
  return labels[difficulty] || "Unknown";
}

export function getDifficultyColor(difficulty: number): string {
  const colors = ["", "#9CA3AF", "#00FF41", "#F59E0B", "#FF6B35", "#FF3131"];
  return colors[difficulty] || "#9CA3AF";
}

export function calculateTodoPriorityScore(params: {
  type: string;
  syllabusLag: number;
  daysUntilDue: number;
  dreamPriority: number;
  streakDays: number;
}): number {
  let score = 0;

  // Syllabus lag creates urgency
  if (params.type === "syllabus_task") {
    score += params.syllabusLag * 0.5; // up to 50 points
    if (params.syllabusLag > 30) score += 30; // critical boost
  }

  // Homework deadline urgency
  if (params.type === "homework_task") {
    if (params.daysUntilDue <= 0) score += 100;
    else if (params.daysUntilDue <= 1) score += 60;
    else if (params.daysUntilDue <= 3) score += 30;
    else score += 10;
  }

  // Dream task priority (1 = highest)
  if (params.type === "dream_task") {
    score += (6 - params.dreamPriority) * 10; // priority 1 = 50pts
  }

  return Math.min(score, 100);
}

export function getAvatarUrl(userId: string, name: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=00FF41&textColor=050A05&radius=50`;
}

export const RANK_XP_THRESHOLDS: Record<string, number> = {
  novice: 0,
  explorer: 500,
  specialist: 2000,
  master: 5000,
  grandmaster: 10000,
};
