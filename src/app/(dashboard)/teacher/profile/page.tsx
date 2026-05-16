import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/dashboard/ProfileClient";
import { StatCard } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Teacher Profile" };

export default async function TeacherProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Fetch some stats for the teacher
  const [subjectsRes, clubsRes] = await Promise.all([
    supabase.from("subjects").select("id", { count: "exact" }).eq("teacher_id", user.id),
    supabase.from("teacher_clubs").select("id", { count: "exact" }).eq("teacher_id", user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Teacher Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your professional details and view your teaching stats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats overview */}
        <div className="space-y-6">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-4xl font-bold mb-4 border-2 border-blue-500/50">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
            <p className="text-sm text-blue-400 mb-4">{profile.department || "Faculty Member"}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Teacher Account
            </div>
            <p className="text-xs text-muted-foreground mt-4">Joined {formatDate(profile.created_at)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Subjects" value={subjectsRes.count || 0} icon="📚" color="blue" />
            <StatCard title="Clubs" value={clubsRes.count || 0} icon="🏢" color="blue" />
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <ProfileClient profile={profile} roleColor="blue-400" />
        </div>
      </div>
    </div>
  );
}
