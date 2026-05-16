import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DreamsClient } from "@/components/dreams/DreamsClient";

export const metadata = { title: "My Dreams" };

export default async function StudentDreamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dreamsRes, studentDreamsRes] = await Promise.all([
    supabase.from("dreams").select("*").order("name"),
    supabase
      .from("student_dreams")
      .select("*, dream:dreams(*)")
      .eq("student_id", user.id)
      .eq("is_active", true)
      .order("priority"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          My <span className="text-neon-green">Dreams</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select up to 3 career dreams. Each dream maps to skills and daily tasks.
        </p>
      </div>

      <DreamsClient
        dreams={dreamsRes.data || []}
        studentDreams={(studentDreamsRes.data as any) || []}
        studentId={user.id}
      />
    </div>
  );
}
