"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { RankBadge } from "@/components/ui/Badge";
import { XPBar } from "@/components/ui/ProgressBar";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  profile: Profile;
  navItems: NavItem[];
  role: "student" | "teacher" | "admin";
}

export function Sidebar({ profile, navItems, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleColors = {
    student: "#00FF41",
    teacher: "#60A5FA",
    admin: "#F59E0B",
  };
  const roleColor = roleColors[role];

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-matrix-border bg-matrix-surface relative">
      {/* Scan line animation */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,1) 2px, rgba(0,255,65,1) 4px)",
        }}
      />

      {/* Logo */}
      <div className="px-5 py-6 border-b border-matrix-border">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-[#050A05]"
            style={{ background: roleColor }}
          >
            SB
          </div>
          <div>
            <div className="font-bold text-sm">
              <span style={{ color: roleColor }}>Skill</span>
              <span className="text-white">Bridge</span>
            </div>
            <div
              className="text-xs capitalize font-semibold"
              style={{ color: `${roleColor}99` }}
            >
              {role} portal
            </div>
          </div>
        </Link>
      </div>

      {/* Profile mini */}
      <div className="px-4 py-4 border-b border-matrix-border">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#050A05] flex-shrink-0"
            style={{ background: roleColor }}
          >
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
            <RankBadge rank={profile.rank} size="sm" />
          </div>
        </div>

        {role === "student" && (
          <XPBar xp={profile.xp} level={profile.level} />
        )}

        {role !== "student" && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="text-xs px-2 py-0.5 rounded-full border capitalize font-semibold"
              style={{ color: roleColor, borderColor: `${roleColor}33`, background: `${roleColor}11` }}
            >
              {profile.department || role}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isRootPath = item.href === "/admin" || item.href === "/student" || item.href === "/teacher";
          const isActive = isRootPath 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:text-white"
              )}
              style={
                isActive
                  ? {
                      background: `${roleColor}15`,
                      borderLeft: `2px solid ${roleColor}`,
                      color: roleColor,
                    }
                  : {}
              }
            >
              <span
                className="text-lg w-6 text-center flex-shrink-0 transition-all duration-200"
                style={isActive ? {} : { filter: "grayscale(0.5)" }}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: roleColor }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Coins (students only) */}
      {role === "student" && (
        <div className="px-4 py-3 mx-3 mb-2 rounded-xl border border-yellow-400/20 bg-yellow-400/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <div>
                <p className="text-xs text-muted-foreground">Coins</p>
                <p className="text-lg font-bold text-yellow-400 font-mono">
                  {profile.coins.toLocaleString()}
                </p>
              </div>
            </div>
            <Link
              href="/student/coins"
              className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors"
            >
              Redeem →
            </Link>
          </div>
        </div>
      )}

      {/* Streak */}
      {role === "student" && profile.streak_days > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg border border-orange-400/20 bg-orange-400/5 flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-sm font-bold text-orange-400">{profile.streak_days} days</p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-matrix-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-neon-red hover:bg-neon-red/5 transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
