import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeworkClient } from "@/components/academic/HomeworkClient";

export const metadata = { title: "Assignments & Homework" };

export default async function TeacherHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [subjectsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("*")
      .eq("teacher_id", user.id)
      .order("name"),
    supabase
      .from("cce_assignments")
      .select("*, subject:subjects(name, code), homework_submissions(id, status, student_id)")
      .eq("teacher_id", user.id)
      .order("due_date", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          Assignments & <span className="text-blue-400">Homework</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create and track CCE assignments, homework, projects, and tests.
        </p>
      </div>

      <HomeworkClient
        assignments={assignmentsRes.data as any || []}
        subjects={subjectsRes.data as any || []}
        teacherId={user.id}
      />
    </div>
  );
}
