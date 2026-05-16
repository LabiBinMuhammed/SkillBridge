import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Aggregate academic stats for admin
  const [subjectsRes, progressRes, homeworkRes, teachersRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("*, teacher:profiles(full_name, department), daily_progress(status, lag_percentage, date)")
      .order("name"),
    supabase
      .from("daily_progress")
      .select("status, lag_percentage, date, subject_id, teacher_id")
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("cce_assignments")
      .select("id, title, type, due_date, submitted_count, total_students, subject_id, subject:subjects(name)")
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

  // Calculate department-wise stats
  const deptMap: Record<string, { total: number; lagging: number; on_track: number; completed: number }> = {};
  subjects.forEach((s: any) => {
    const dept = s.department || "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, lagging: 0, on_track: 0, completed: 0 };
    deptMap[dept].total++;

    const latest = (s.daily_progress || []).sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    if (latest?.status === "lagging") deptMap[dept].lagging++;
    else if (latest?.status === "on_track") deptMap[dept].on_track++;
    else if (latest?.status === "completed") deptMap[dept].completed++;
  });

  const totalLagging = progress.filter((p: any) => p.status === "lagging").length;
  const totalOnTrack = progress.filter((p: any) => p.status === "on_track").length;
  const avgLag = progress.length > 0
    ? progress.reduce((acc: number, p: any) => acc + (p.lag_percentage || 0), 0) / progress.length
    : 0;

  return NextResponse.json({
    subjects,
    progress,
    homework,
    teachers,
    stats: {
      totalSubjects: subjects.length,
      totalLagging,
      totalOnTrack,
      avgLag: Math.round(avgLag * 10) / 10,
      departmentStats: deptMap,
    }
  });
}
