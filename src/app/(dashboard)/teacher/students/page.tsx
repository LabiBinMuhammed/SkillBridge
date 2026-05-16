import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get clubs this teacher mentors
  const { data: teacherClubs } = await supabase
    .from("teacher_clubs")
    .select("club_id, role, club:clubs(name)")
    .eq("teacher_id", user?.id);

  const clubIds = teacherClubs?.map(tc => tc.club_id) || [];

  let mentees: any[] = [];
  
  if (clubIds.length > 0) {
    // 2. Get students in those clubs
    const { data: studentClubs } = await supabase
      .from("student_clubs")
      .select("student_id")
      .in("club_id", clubIds);

    const studentIds = studentClubs?.map(sc => sc.student_id) || [];
    const uniqueStudentIds = Array.from(new Set(studentIds));

    if (uniqueStudentIds.length > 0) {
      // 3. Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", uniqueStudentIds)
        .eq("role", "student")
        .order("full_name");
        
      mentees = profiles || [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">My Mentees</h1>
        <p className="text-muted-foreground mt-1">Students assigned to you via your mentor clubs.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mentees.map((student) => (
          <Card key={student.id}>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{student.full_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {student.department ? `${student.department} • ` : ""}
                    Semester {student.semester || "N/A"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      
      {mentees.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center text-muted-foreground border-dashed border-2 border-matrix-border">
            <p className="text-4xl mb-4">🎓</p>
            <h2 className="text-xl font-bold text-white mb-2">No mentees found</h2>
            <p>You are not assigned as a mentor to any clubs with active students.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
