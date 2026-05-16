import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard, Card, CardHeader, CardBody } from "@/components/ui/Card";
import { RankBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSyllabusStatusColor, getSyllabusStatusLabel } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [statsRes, studentsRes, laggingSubjectsRes, topStudentsRes, pendingTasksRes] = await Promise.all([
    // Platform-wide stats
    supabase.rpc("get_platform_stats"),
    supabase.from("profiles").select("id, full_name, role, coins, xp, rank, department, streak_days").eq("role", "student").order("xp", { ascending: false }).limit(5),
    supabase.from("daily_progress").select("*, subject:subjects(name)").eq("status", "lagging").order("lag_percentage", { ascending: false }).limit(5),
    supabase.from("leaderboard").select("*").order("xp_rank").limit(5),
    supabase.from("todo_approvals").select("*, student:profiles(full_name)").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
  ]);

  const students = studentsRes.data || [];
  const laggingSubjects = laggingSubjectsRes.data || [];
  const topStudents = topStudentsRes.data || [];
  const pendingTasks = pendingTasksRes.data || [];

  // Fallback stats
  const totalStudents = students.length;
  const totalLagging = laggingSubjects.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          Admin <span className="text-yellow-400">Control Center</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Campus-wide intelligence overview</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Students" value="2,500+" icon="🎓" color="blue" />
        <StatCard title="Task Approvals" value={pendingTasks.length} icon="✅" color="green" />
        <StatCard title="Lagging Subjects" value={totalLagging} icon="⚠️" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top students */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>🏆</span> Top Students
                </h2>
                <a href="/admin/leaderboard" className="text-xs text-yellow-400 hover:underline">
                  Full Leaderboard →
                </a>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {topStudents.map((s: any, i) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border border-matrix-border hover:border-yellow-400/20 transition-colors">
                    <span className="text-xl w-8 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "#00FF4120", color: "#00FF41" }}
                    >
                      {s.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.full_name}</p>
                      <div className="flex items-center gap-2">
                        <RankBadge rank={s.rank} size="sm" showIcon={false} />
                        <span className="text-xs text-muted-foreground">{s.department}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-neon-green font-mono">{Number(s.xp).toLocaleString()} XP</p>
                      <p className="text-xs text-yellow-400">{s.coins} coins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Task Approvals */}
          <Card danger={pendingTasks.length > 5}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>✅</span> Task Approvals
                </h2>
                <a href="/admin/approvals" className="text-xs text-yellow-400 hover:underline">
                  Review →
                </a>
              </div>
            </CardHeader>
            <CardBody>
              {pendingTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 4).map((task: any) => (
                    <div key={task.id} className="flex flex-col gap-1 p-2 rounded-lg border border-matrix-border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate">{task.student?.full_name}</p>
                        <span className="text-[10px] text-neon-green bg-neon-green/10 px-1.5 py-0.5 rounded">+{task.xp_reward}XP</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{task.title}</p>
                    </div>
                  ))}
                  {pendingTasks.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{pendingTasks.length - 4} more pending
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
              )}
            </CardBody>
          </Card>

          {/* Lagging subjects */}
          <Card danger={laggingSubjects.length > 2}>
            <CardHeader>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>⚠️</span> Lagging Subjects
              </h2>
            </CardHeader>
            <CardBody>
              {laggingSubjects.length > 0 ? (
                <div className="space-y-2">
                  {laggingSubjects.map((p: any) => (
                    <div key={p.id} className="p-3 rounded-lg border border-neon-red/20 bg-neon-red/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold">{p.subject?.name}</p>
                        <span className="text-xs text-neon-red font-mono">
                          -{Math.round(p.lag_percentage)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={100 - p.lag_percentage}
                        size="xs"
                        color="red"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-4xl mb-1">✅</p>
                  <p className="text-sm text-muted-foreground">All subjects on track!</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
