import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminAcademicClient } from "@/components/academic/AdminAcademicClient";

export const metadata = { title: "Academic Monitor — Admin" };

export default async function AdminAcademicPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/login");

  // Fetch all data for admin overview
  const [subjectsRes, progressRes, homeworkRes, teachersRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("*, teacher:profiles(id, full_name, department), daily_progress(status, lag_percentage, date, actual_hours)")
      .order("name"),
    supabase
      .from("daily_progress")
      .select("status, lag_percentage, date, subject_id, teacher_id")
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("cce_assignments")
      .select("id, title, type, due_date, submitted_count, total_students, subject_id, subject:subjects(name, code)")
      .order("due_date"),
    supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("role", "teacher"),
  ]);

  const subjects = subjectsRes.data || [];
  const progress = progressRes.data || [];
  const homework = homeworkRes.data || [];
  const teachers = teachersRes.data || [];

  // Compute department stats server-side
  const deptMap: Record<string, { total: number; lagging: number; on_track: number; completed: number }> = {};
  subjects.forEach((s: any) => {
    const dept = s.department || "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, lagging: 0, on_track: 0, completed: 0 };
    deptMap[dept].total++;

    const latest = [...(s.daily_progress || [])].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    if (latest?.status === "lagging") deptMap[dept].lagging++;
    else if (latest?.status === "on_track") deptMap[dept].on_track++;
    else if (latest?.status === "completed") deptMap[dept].completed++;
  });

  const totalLagging = subjects.filter((s: any) => {
    const latest = [...(s.daily_progress || [])].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return latest?.status === "lagging";
  }).length;

  const totalOnTrack = subjects.filter((s: any) => {
    const latest = [...(s.daily_progress || [])].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return latest?.status === "on_track";
  }).length;

  const avgLag = progress.length > 0
    ? Math.round(
        progress.reduce((acc: number, p: any) => acc + (p.lag_percentage || 0), 0) / progress.length * 10
      ) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          Academic <span className="text-neon-green">Monitor</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time syllabus tracking, homework analytics, and teacher performance insights.
        </p>
      </div>

      <AdminAcademicClient
        subjects={subjects as any}
        progress={progress as any}
        homework={homework as any}
        teachers={teachers as any}
        stats={{
          totalSubjects: subjects.length,
          totalLagging,
          totalOnTrack,
          avgLag,
          departmentStats: deptMap,
        }}
      />
    </div>
  );
}
