import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { RankBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { DashboardTasksClient } from "@/components/dashboard/DashboardTasksClient";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parallel data fetching
  const [profileRes, todayTodoRes, dreamRes, badgesRes, recentTxRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("student_daily_todos")
      .select("*, items:todo_items(*)")
      .eq("student_id", user.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .single(),
    supabase
      .from("student_dreams")
      .select("*, dream:dreams(name, icon, color)")
      .eq("student_id", user.id)
      .eq("is_active", true)
      .order("priority"),
    supabase
      .from("student_badges")
      .select("*, badge:badges(name, icon, rarity)")
      .eq("student_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(5),
    supabase
      .from("coin_transactions")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileRes.data;
  if (!profile) redirect("/login");

  const todayTodo = todayTodoRes.data;
  const dreams = dreamRes.data || [];
  const badges = badgesRes.data || [];
  const recentTx = recentTxRes.data || [];

  const completionRate = todayTodo
    ? Math.round((todayTodo.completed_tasks / Math.max(todayTodo.total_tasks, 1)) * 100)
    : 0;

  const xpForNext = profile.level * profile.level * 100;
  const xpProgress = Math.min(100, (profile.xp / xpForNext) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            Welcome back, <span className="text-neon-green">{profile.full_name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <RankBadge rank={profile.rank} size="md" />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Coins"
          value={profile.coins.toLocaleString()}
          icon="🪙"
          color="gold"
          subtitle="Total earned"
        />
        <StatCard
          title="XP"
          value={`${(profile.xp / 1000).toFixed(1)}k`}
          icon="⚡"
          color="green"
          subtitle={`Level ${profile.level}`}
        />
        <StatCard
          title="Streak"
          value={`${profile.streak_days}d`}
          icon="🔥"
          color="red"
          subtitle={`Best: ${profile.longest_streak}d`}
        />
        <StatCard
          title="Today"
          value={`${todayTodo?.completed_tasks || 0}/${todayTodo?.total_tasks || 0}`}
          icon="✅"
          color="blue"
          subtitle="Tasks completed"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Today&apos;s Progress
                </h2>
                <a href="/student/todo" className="text-xs text-neon-green hover:underline">
                  View all →
                </a>
              </div>
            </CardHeader>
            <CardBody>
              <DashboardTasksClient 
                initialTodo={todayTodo} 
                studentId={user.id} 
                today={new Date().toISOString().split("T")[0]} 
              />
            </CardBody>
          </Card>

          {/* Active Dreams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>🎯</span> Active Dreams
                </h2>
                <a href="/student/dreams" className="text-xs text-neon-green hover:underline">
                  Manage →
                </a>
              </div>
            </CardHeader>
            <CardBody>
              {dreams.length > 0 ? (
                <div className="space-y-3">
                  {dreams.map((sd: any) => (
                    <div
                      key={sd.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-matrix-border hover:border-neon-green/20 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${sd.dream?.color || "#00FF41"}15` }}
                      >
                        {sd.dream?.icon || "🎯"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold truncate">{sd.dream?.name}</p>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            Lvl {sd.level}
                          </span>
                        </div>
                        <ProgressBar
                          value={sd.xp_earned}
                          max={sd.level * sd.level * 100}
                          size="xs"
                          color="green"
                        />
                      </div>
                      <div
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: sd.dream?.color || "#00FF41",
                          background: `${sd.dream?.color || "#00FF41"}15`,
                        }}
                      >
                        #{sd.priority}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="text-muted-foreground text-sm">No dreams selected yet.</p>
                  <a href="/student/dreams" className="text-neon-green text-sm mt-2 inline-block hover:underline">
                    Select your dreams →
                  </a>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Level progress */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>🏆</span> Level Progress
              </h2>
            </CardHeader>
            <CardBody>
              <div className="text-center mb-4">
                <div
                  className="inline-flex w-20 h-20 rounded-full items-center justify-center text-3xl font-black border-4 mb-3"
                  style={{ borderColor: "#00FF41", boxShadow: "0 0 20px rgba(0,255,65,0.3)" }}
                >
                  {profile.level}
                </div>
                <RankBadge rank={profile.rank} size="md" />
              </div>
              <ProgressBar
                value={xpProgress}
                label="XP Progress"
                showValue
                size="md"
                color="green"
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {profile.xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
              </p>
            </CardBody>
          </Card>

          {/* Recent Badges */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>🏅</span> Recent Badges
                </h2>
                <a href="/student/badges" className="text-xs text-neon-green hover:underline">
                  All →
                </a>
              </div>
            </CardHeader>
            <CardBody>
              {badges.length > 0 ? (
                <div className="space-y-2">
                  {badges.map((sb: any) => (
                    <div
                      key={sb.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-matrix-surface transition-colors"
                    >
                      <span className="text-2xl">{sb.badge?.icon || "🏅"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{sb.badge?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(sb.earned_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-4xl mb-2">🏅</p>
                  <p className="text-sm text-muted-foreground">Complete tasks to earn badges</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Coin Activity */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>🪙</span> Coin Activity
              </h2>
            </CardHeader>
            <CardBody>
              {recentTx.length > 0 ? (
                <div className="space-y-2">
                  {recentTx.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-matrix-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.created_at)}</p>
                      </div>
                      <span
                        className={`text-sm font-bold font-mono ml-3 flex-shrink-0 ${
                          tx.type === "earned" || tx.type === "bonus" ? "text-neon-green" : "text-neon-red"
                        }`}
                      >
                        {tx.type === "earned" || tx.type === "bonus" ? "+" : "-"}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
