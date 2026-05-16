import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TodoClient } from "@/components/todo/TodoClient";

export const metadata = { title: "Daily Tasks" };

export default async function StudentTodoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const { data: todo } = await supabase
    .from("student_daily_todos")
    .select("*, items:todo_items(*)")
    .eq("student_id", user.id)
    .eq("date", today)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          Daily <span className="text-neon-green">Tasks</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your auto-generated action plan for today — dreams, academics, and homework combined.
        </p>
      </div>

      <TodoClient
        todo={todo as any}
        studentId={user.id}
        today={today}
      />
    </div>
  );
}
