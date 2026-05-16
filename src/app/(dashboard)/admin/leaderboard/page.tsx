import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { RankBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin Leaderboard" };

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default async function AdminLeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${profile?.role || "login"}`);
  }

  // Fetch top 100 students
  const { data: leaders } = await supabase
    .from("leaderboard")
    .select("*")
    .order("xp_rank")
    .order("coins", { ascending: false })
    .order("full_name")
    .limit(100);

  const leaderboardData = leaders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          🏆 <span className="text-yellow-400">Platform Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of the top performing students across the entire platform.
        </p>
      </div>

      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border">
                  Student
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border">
                  XP
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border">
                  Coins
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border hidden md:table-cell">
                  Tasks
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-matrix-border hidden md:table-cell">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry: any, i) => {
                const rank = i + 1;

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-matrix-border last:border-0 transition-colors hover:bg-matrix-surface/50"
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {rank <= 3 ? (
                          <span
                            className="text-xl"
                            style={{ filter: `drop-shadow(0 0 6px ${medalColors[rank - 1]})` }}
                          >
                            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="font-mono text-muted-foreground w-8 text-center">
                            #{rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#050A05] flex-shrink-0"
                          style={{ background: "#00CC33" }}
                        >
                          {entry.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white">
                            {entry.full_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <RankBadge rank={entry.rank} size="sm" showIcon={false} />
                            {entry.department && (
                              <span className="text-xs text-muted-foreground">{entry.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono font-bold text-neon-green">
                        {Number(entry.xp).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono font-bold text-yellow-400">
                        {Number(entry.coins).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-blue-400">
                        {Number(entry.tasks_completed)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-orange-400">{entry.streak_days}d</span>
                    </td>
                  </tr>
                );
              })}
              
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    No students found on the leaderboard yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
