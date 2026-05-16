import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { RankBadge, RarityBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leaderboard" };

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [leaderboardRes, currentUserRes] = await Promise.all([
    supabase
      .from("leaderboard")
      .select("*")
      .order("xp_rank")
      .order("coins", { ascending: false })
      .order("full_name")
      .limit(50),
    supabase.from("leaderboard").select("*").eq("id", user.id).single(),
  ]);

  const leaders = leaderboardRes.data || [];
  const me = currentUserRes.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          🏆 <span className="text-neon-green">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Compete, grow, and dominate the campus rankings.
        </p>
      </div>

      {/* My rank card */}
      {me && (() => {
        const myRankIndex = leaders.findIndex((l: any) => l.id === user.id);
        const displayRank = myRankIndex !== -1 ? myRankIndex + 1 : me.xp_rank;
        return (
          <Card glow>
            <CardBody className="py-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black font-mono text-neon-green w-12 text-center">
                  #{displayRank}
                </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-[#050A05]"
                style={{ background: "#00FF41" }}
              >
                {me.full_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">You — {me.full_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <RankBadge rank={me.rank} size="sm" />
                  <span className="text-xs text-muted-foreground">{me.department}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
                <div>
                  <p className="text-lg font-bold text-neon-green font-mono">{me.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-400 font-mono">{me.coins}</p>
                  <p className="text-xs text-muted-foreground">Coins</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-400 font-mono">{me.streak_days}d</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        );
      })()}

      {/* Leaderboard tabs */}
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
              {leaders.map((entry: any, i) => {
                const isMe = entry.id === user.id;
                const rank = i + 1;

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-matrix-border last:border-0 transition-colors",
                      isMe ? "bg-neon-green/5" : "hover:bg-matrix-surface/50"
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
                          style={{ background: isMe ? "#00FF41" : "#00CC33" }}
                        >
                          {entry.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className={cn("font-semibold text-sm", isMe && "text-neon-green")}>
                            {entry.full_name} {isMe && "(You)"}
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
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
