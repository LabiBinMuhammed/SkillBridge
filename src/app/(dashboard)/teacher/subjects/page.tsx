import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectsClient } from "@/components/academic/SubjectsClient";

export const metadata = { title: "My Subjects" };

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*, daily_progress(status, lag_percentage, date, actual_hours)")
    .eq("teacher_id", user.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          My <span className="text-blue-400">Subjects</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your subjects and track overall syllabus completion.
        </p>
      </div>

      <SubjectsClient
        subjects={subjects as any || []}
        teacherId={user.id}
      />
    </div>
  );
}
