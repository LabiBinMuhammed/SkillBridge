import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "@/components/dashboard/ProfileClient";
import { StatCard } from "@/components/ui/Card";
import { RankBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Profile" };

export default async function StudentProfilePage() {
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
        <h1 className="text-3xl font-black text-white">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and view your overall stats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Badges overview */}
        <div className="space-y-6">
          <div className="bg-matrix-surface border border-matrix-border rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-4xl font-bold mb-4 border-2 border-neon-green/50">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{profile.roll_number}</p>
            <RankBadge rank={profile.rank} size="md" />
            <p className="text-xs text-muted-foreground mt-3">Member since {formatDate(profile.created_at)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Level" value={profile.level} icon="⚡" color="green" />
            <StatCard title="Total XP" value={profile.xp.toLocaleString()} icon="⭐" color="gold" />
            <StatCard title="Coins" value={profile.coins.toLocaleString()} icon="🪙" color="gold" />
            <StatCard title="Max Streak" value={`${profile.longest_streak}d`} icon="🔥" color="red" />
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <ProfileClient profile={profile} roleColor="neon-green" />
        </div>
      </div>
    </div>
  );
}
