import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { Profile } from "@/types";

const studentNavItems = [
  { href: "/student", label: "Dashboard", icon: "🏠" },
  { href: "/student/dreams", label: "My Dreams", icon: "🎯" },
  { href: "/student/todo", label: "Daily Tasks", icon: "⚡" },
  { href: "/student/academic", label: "Academic Status", icon: "📊" },
  { href: "/student/coins", label: "Coins & Rewards", icon: "🪙" },
  { href: "/student/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/student/badges", label: "My Badges", icon: "🏅" },
  { href: "/student/profile", label: "Profile", icon: "👤" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect(`/${profile.role}`);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        profile={profile as Profile}
        navItems={studentNavItems}
        role="student"
      />
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-matrix-border bg-matrix-surface sticky top-0 z-30">
          <span className="font-bold text-neon-green">Skill Bridge</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400">🪙 {profile.coins}</span>
            <span className="text-orange-400">🔥 {profile.streak_days}</span>
          </div>
        </div>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
