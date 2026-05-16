import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all teachers
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch teacher clubs
  const { data: teacherClubs } = await supabase
    .from("teacher_clubs")
    .select("teacher_id, role, clubs(name, icon, color)");

  // Merge the data
  const enrichedTeachers = teachers?.map(teacher => {
    const clubAssoc = teacherClubs?.find(tc => tc.teacher_id === teacher.id);
    return {
      ...teacher,
      club: clubAssoc?.clubs || null,
      club_role: clubAssoc?.role || null
    };
  });

  return NextResponse.json({ data: enrichedTeachers });
}
