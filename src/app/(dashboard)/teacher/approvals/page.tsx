import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalsClient } from "./ApprovalsClient";

export default async function TeacherApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  let pendingApprovals: any[] = [];

  if (profile?.role === "admin") {
    // Admins see everything
    const { data } = await supabase
      .from("todo_approvals")
      .select("*, student:profiles(full_name, department)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    pendingApprovals = data || [];
  } else {
    // Get clubs this teacher mentors to filter approvals to only their mentees
    const { data: teacherClubs } = await supabase
      .from("teacher_clubs")
      .select("club_id")
      .eq("teacher_id", user?.id);

    const clubIds = teacherClubs?.map(tc => tc.club_id) || [];
    
    if (clubIds.length > 0) {
      // Get students in these clubs
      const { data: studentClubs } = await supabase
        .from("student_clubs")
        .select("student_id")
        .in("club_id", clubIds);

      const studentIds = studentClubs?.map(sc => sc.student_id) || [];

      if (studentIds.length > 0) {
        // Get pending approvals for these students
        const { data } = await supabase
          .from("todo_approvals")
          .select("*, student:profiles(full_name, department)")
          .in("student_id", studentIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        pendingApprovals = data || [];
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Task Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and manage your mentees' task submissions.</p>
      </div>

      <ApprovalsClient initialData={pendingApprovals} />
    </div>
  );
}
