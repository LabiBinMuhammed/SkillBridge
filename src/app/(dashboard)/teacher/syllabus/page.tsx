import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SyllabusClient } from "@/components/academic/SyllabusClient";
import { WeeklyPlanClient } from "@/components/academic/WeeklyPlanClient";

export const metadata = { title: "Syllabus Tracker" };

export default async function SyllabusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [subjectsRes, progressRes, plansRes] = await Promise.all([
    supabase.from("subjects").select("*").eq("teacher_id", user.id),
    supabase
      .from("daily_progress")
      .select("*, subject:subjects(name, code)")
      .eq("teacher_id", user.id)
      .order("date", { ascending: false })
      .limit(15),
    supabase
      .from("weekly_study_plans")
      .select("*, subject:subjects(name, code)")
      .eq("teacher_id", user.id)
      .order("week_start", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          Syllabus <span className="text-blue-400">Tracker</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plan weekly targets and log daily progress. Students see real-time Red/Green status.
        </p>
      </div>

      {/* Weekly Study Plans */}
      <WeeklyPlanClient
        subjects={subjectsRes.data as any || []}
        teacherId={user.id}
        existingPlans={plansRes.data as any || []}
      />

      {/* Daily Progress Logger */}
      <SyllabusClient
        subjects={subjectsRes.data || []}
        recentProgress={progressRes.data as any || []}
        teacherId={user.id}
      />
    </div>
  );
}
