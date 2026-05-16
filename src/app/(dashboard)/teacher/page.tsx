import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSyllabusStatusLabel, getSyllabusStatusColor, formatDate } from "@/lib/utils";

export const metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First get profile and clubs
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, department, role")
    .eq("id", user.id)
    .single();

  const { data: teacherClubs } = await supabase
    .from("teacher_clubs")
    .select("club_id")
    .eq("teacher_id", user.id);

  const clubIds = teacherClubs?.map(tc => tc.club_id) || [];

  // Parallel fetching for the rest
  const subjectsPromise = supabase.from("subjects").select("*").eq("teacher_id", user.id);
  const progressPromise = supabase
    .from("daily_progress")
    .select("*, subject:subjects(name)")
    .eq("teacher_id", user.id)
    .order("date", { ascending: false })
    .limit(10);
  const assignmentsPromise = supabase
    .from("cce_assignments")
    .select("*, subject:subjects(name)")
    .eq("teacher_id", user.id)
    .order("due_date")
    .limit(5);

  // Fetch pending approvals based on role and clubs
  let pendingQuery = supabase
    .from("todo_approvals")
    .select("*, student:profiles(full_name, department)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (profile?.role !== "admin") {
    if (clubIds.length > 0) {
      // Get students in these clubs
      const { data: studentClubs } = await supabase
        .from("student_clubs")
        .select("student_id")
        .in("club_id", clubIds);
      
      const studentIds = studentClubs?.map(sc => sc.student_id) || [];
      if (studentIds.length > 0) {
        pendingQuery = pendingQuery.in("student_id", studentIds);
      } else {
        // No students, no approvals
        pendingQuery = pendingQuery.in("student_id", ["00000000-0000-0000-0000-000000000000"]);
      }
    } else {
      // No clubs, no approvals
      pendingQuery = pendingQuery.in("student_id", ["00000000-0000-0000-0000-000000000000"]);
    }
  }

  const [subjectsRes, progressRes, pendingRes, assignmentsRes] = await Promise.all([
    subjectsPromise,
    progressPromise,
    pendingQuery,
    assignmentsPromise,
  ]);
  const subjects = subjectsRes.data || [];
  const progress = progressRes.data || [];
  const pending = pendingRes.data || [];
  const assignments = assignmentsRes.data || [];

  const laggingCount = progress.filter((p: any) => p.status === "lagging").length;
  const onTrackCount = progress.filter((p: any) => p.status === "on_track").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          Teacher <span className="text-blue-400">Dashboard</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome, {profile?.full_name} · {profile?.department}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Subjects" value={subjects.length} icon="📚" color="blue" />
        <StatCard title="On Track" value={onTrackCount} icon="✅" color="green" />
        <StatCard title="Lagging" value={laggingCount} icon="⚠️" color="red" />
        <StatCard title="Pending Approvals" value={pending.length} icon="🔔" color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent progress log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>📊</span> Syllabus Status
              </h2>
              <a href="/teacher/syllabus" className="text-xs text-blue-400 hover:underline">
                Log Progress →
              </a>
            </div>
          </CardHeader>
          <CardBody>
            {progress.length > 0 ? (
              <div className="space-y-3">
                {progress.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-matrix-border">
                    <div>
                      <p className="text-sm font-semibold">{p.subject?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.lag_percentage > 0 && (
                        <span className="text-xs font-mono text-neon-red">
                          -{Math.round(p.lag_percentage)}% lag
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                        style={{
                          color: getSyllabusStatusColor(p.status),
                          borderColor: `${getSyllabusStatusColor(p.status)}33`,
                          background: `${getSyllabusStatusColor(p.status)}11`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: getSyllabusStatusColor(p.status) }}
                        />
                        {getSyllabusStatusLabel(p.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No progress logged yet.</p>
                <a href="/teacher/syllabus" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                  Log today&apos;s progress →
                </a>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>✅</span> Pending Approvals
              </h2>
              <a href="/teacher/approvals" className="text-xs text-blue-400 hover:underline">
                View all →
              </a>
            </div>
          </CardHeader>
          <CardBody>
            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map((sub: any) => (
                  <div key={sub.id} className="flex items-start gap-3 p-3 rounded-lg border border-matrix-border hover:border-blue-400/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {sub.student?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{sub.student?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.title}</p>
                    </div>
                    <a
                      href={`/teacher/approvals?id=${sub.id}`}
                      className="text-xs text-blue-400 hover:underline flex-shrink-0"
                    >
                      Review
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-muted-foreground text-sm">No pending approvals</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Upcoming assignments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>📝</span> Upcoming Assignments
              </h2>
              <a href="/teacher/homework" className="text-xs text-blue-400 hover:underline">
                Manage →
              </a>
            </div>
          </CardHeader>
          <CardBody>
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-3 text-xs uppercase tracking-wider text-muted-foreground">Assignment</th>
                      <th className="text-left pb-3 text-xs uppercase tracking-wider text-muted-foreground">Subject</th>
                      <th className="text-left pb-3 text-xs uppercase tracking-wider text-muted-foreground">Due Date</th>
                      <th className="text-right pb-3 text-xs uppercase tracking-wider text-muted-foreground">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-matrix-border">
                    {assignments.map((a: any) => {
                      const submissionRate = Math.round((a.submitted_count / Math.max(a.total_students, 1)) * 100);
                      const dueDate = new Date(a.due_date);
                      const isPast = dueDate < new Date();

                      return (
                        <tr key={a.id}>
                          <td className="py-3 font-medium">{a.title}</td>
                          <td className="py-3 text-muted-foreground">{a.subject?.name}</td>
                          <td className="py-3">
                            <span className={isPast ? "text-neon-red" : "text-foreground"}>
                              {formatDate(a.due_date)}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground">
                                {a.submitted_count}/{a.total_students}
                              </span>
                              <ProgressBar
                                value={submissionRate}
                                className="w-16"
                                size="xs"
                                color={submissionRate >= 70 ? "green" : "red"}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6 text-sm">No upcoming assignments</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
