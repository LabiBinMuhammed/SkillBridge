import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { Profile } from "@/types";

const teacherNavItems = [
  { href: "/teacher", label: "Dashboard", icon: "🏠" },
  { href: "/teacher/subjects", label: "My Subjects", icon: "📚" },
  { href: "/teacher/syllabus", label: "Syllabus Tracker", icon: "📊" },
  { href: "/teacher/homework", label: "Assignments", icon: "📝" },
  { href: "/teacher/students", label: "Students", icon: "🎓" },
  { href: "/teacher/approvals", label: "Task Approvals", icon: "✅" },
  { href: "/teacher/profile", label: "Profile", icon: "👤" },
];

export default async function TeacherLayout({
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
  if (profile.role !== "teacher") redirect(`/${profile.role}`);

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as Profile} navItems={teacherNavItems} role="teacher" />
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden flex items-center px-4 py-4 border-b border-matrix-border bg-matrix-surface sticky top-0 z-30">
          <span className="font-bold text-blue-400">Skill Bridge — Teacher</span>
        </div>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
