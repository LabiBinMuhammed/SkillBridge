import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { Profile } from "@/types";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/students", label: "All Students", icon: "🎓" },
  { href: "/admin/teachers", label: "Teachers", icon: "👨‍🏫" },
  { href: "/admin/clubs", label: "Clubs", icon: "🏢" },
  { href: "/admin/dreams", label: "Dreams & Tasks", icon: "🎯" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/admin/approvals", label: "Task Approvals", icon: "✅" },
  { href: "/admin/academic", label: "Academic Monitor", icon: "📊" },
  { href: "/admin/profile", label: "Profile", icon: "👤" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect(`/${profile.role}`);

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as Profile} navItems={adminNavItems} role="admin" />
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden flex items-center px-4 py-4 border-b border-matrix-border bg-matrix-surface">
          <span className="font-bold text-yellow-400">Skill Bridge — Admin</span>
        </div>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
