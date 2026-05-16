"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  danger?: boolean;
  hover?: boolean;
}

export function Card({ className, children, glow, danger, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-matrix-card border border-matrix-border rounded-xl overflow-hidden",
        "backdrop-blur-sm transition-all duration-300",
        hover && "hover:border-neon-green/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.06)]",
        glow && "border-neon-green/30 shadow-[0_0_15px_rgba(0,255,65,0.1)]",
        danger && "border-neon-red/20 bg-danger-gradient hover:border-neon-red/30",
        className
      )}
      style={{
        background: danger
          ? "linear-gradient(135deg, rgba(255,49,49,0.04) 0%, rgba(255,49,49,0.01) 100%)"
          : "linear-gradient(135deg, rgba(0,255,65,0.04) 0%, rgba(0,255,65,0.01) 100%)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "green" | "red" | "gold" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  green: { text: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20" },
  red: { text: "text-neon-red", bg: "bg-neon-red/10", border: "border-neon-red/20" },
  gold: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  blue: { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  purple: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
};

export function StatCard({ title, value, subtitle, icon, trend, color = "green", className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className={cn("p-5 cursor-default", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {icon && (
          <div className={cn("p-2 rounded-lg text-lg", c.bg, c.border, "border")}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className={cn("text-3xl font-bold font-mono", c.text)}>{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium pb-1",
              trend.value >= 0 ? "text-neon-green" : "text-neon-red"
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}
