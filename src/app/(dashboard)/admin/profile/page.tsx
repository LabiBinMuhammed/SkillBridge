import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/dashboard/ProfileClient";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin Profile" };

export default async function AdminProfilePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Administrator Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your system administrator details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats overview */}
        <div className="space-y-6">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-4xl font-bold mb-4 border-2 border-yellow-400/50">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
            <p className="text-sm text-yellow-400 mb-4">System Administrator</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              Root Access
            </div>
            <p className="text-xs text-muted-foreground mt-4">System User since {formatDate(profile.created_at)}</p>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <ProfileClient profile={profile} roleColor="yellow-400" />
        </div>
      </div>
    </div>
  );
}
