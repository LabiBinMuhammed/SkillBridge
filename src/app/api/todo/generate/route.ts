import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateTodoPriorityScore } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { studentId, date } = await req.json();
    if (!studentId || !date) {
      return NextResponse.json({ error: "Missing studentId or date" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 1. Delete existing todo for this date (regenerate)
    await supabase
      .from("student_daily_todos")
      .delete()
      .eq("student_id", studentId)
      .eq("date", date);

    // 2. Fetch student context
    const [dreamsRes, syllabusRes, homeworkRes, profileRes] = await Promise.all([
      supabase
        .from("student_dreams")
        .select("*, dream:dreams(*, skills(*, tasks(*)))")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("priority"),

      supabase
        .from("daily_progress")
        .select("*, subject:subjects(name)")
        .gte("lag_percentage", 10)
        .eq("status", "lagging")
        .order("lag_percentage", { ascending: false })
        .limit(5),

      supabase
        .from("cce_assignments")
        .select("*, subject:subjects(name), student_submission:homework_submissions!inner(status)")
        .lte("due_date", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .filter("student_submission.status", "eq", "pending"),

      supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", studentId)
        .single(),
    ]);

    const dreams = dreamsRes.data || [];
    const laggingSubjects = syllabusRes.data || [];
    const pendingHomework = homeworkRes.data || [];
    const streak = profileRes.data?.streak_days || 0;

    // 3. Build todo items
    const todoItems: {
      type: string;
      priority: string;
      title: string;
      description: string;
      estimated_minutes: number;
      coin_reward: number;
      xp_reward: number;
      priority_score: number;
      is_auto_prioritized: boolean;
      task_id?: string;
      assignment_id?: string;
      subject_id?: string;
    }[] = [];

    // Homework tasks (highest urgency if due soon)
    for (const hw of pendingHomework.slice(0, 3)) {
      const dueDate = new Date(hw.due_date);
      const today = new Date(date);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const priorityScore = calculateTodoPriorityScore({
        type: "homework_task",
        syllabusLag: 0,
        daysUntilDue,
        dreamPriority: 3,
        streakDays: streak,
      });

      let priority = "medium";
      if (daysUntilDue <= 0) priority = "critical";
      else if (daysUntilDue <= 1) priority = "high";

      todoItems.push({
        type: "homework_task",
        priority,
        title: `Submit: ${hw.title}`,
        description: `${hw.subject?.name} • Due: ${new Date(hw.due_date).toLocaleDateString("en-IN")}`,
        estimated_minutes: 45,
        coin_reward: daysUntilDue <= 0 ? 15 : 10,
        xp_reward: 20,
        priority_score: priorityScore,
        is_auto_prioritized: daysUntilDue <= 1,
        assignment_id: hw.id,
        subject_id: hw.subject_id,
      });
    }

    // Syllabus catch-up tasks (if lagging)
    for (const lag of laggingSubjects.slice(0, 3)) {
      const priorityScore = calculateTodoPriorityScore({
        type: "syllabus_task",
        syllabusLag: lag.lag_percentage,
        daysUntilDue: 7,
        dreamPriority: 3,
        streakDays: streak,
      });

      const isAutoPrioritized = lag.lag_percentage > 30;

      todoItems.push({
        type: "syllabus_task",
        priority: lag.lag_percentage > 40 ? "critical" : lag.lag_percentage > 20 ? "high" : "medium",
        title: `Review: ${lag.subject?.name || "Subject"}`,
        description: `Syllabus is ${Math.round(lag.lag_percentage)}% behind target. Catch up today.`,
        estimated_minutes: 60,
        coin_reward: 8,
        xp_reward: 15,
        priority_score: priorityScore,
        is_auto_prioritized: isAutoPrioritized,
        subject_id: lag.subject_id,
      });
    }

    // Dream tasks (add from top priority dream first)
    let dreamTasksAdded = 0;
    const maxDreamTasks = laggingSubjects.length > 2 ? 2 : 4; // reduce dream tasks if syllabus lagging

    for (const sd of dreams) {
      if (dreamTasksAdded >= maxDreamTasks) break;
      const dream = sd.dream as any;

      if (!dream?.skills?.length) continue;

      // Pick a skill and its first incomplete task
      const skill = dream.skills[0];
      if (!skill?.tasks?.length) continue;

      const task = skill.tasks[0];

      const priorityScore = calculateTodoPriorityScore({
        type: "dream_task",
        syllabusLag: 0,
        daysUntilDue: 7,
        dreamPriority: sd.priority,
        streakDays: streak,
      });

      todoItems.push({
        type: "dream_task",
        priority: sd.priority <= 2 ? "high" : "medium",
        title: task.title,
        description: `${dream.name} › ${skill.name}`,
        estimated_minutes: task.estimated_minutes || 30,
        coin_reward: task.coin_reward || 5,
        xp_reward: task.xp_reward || 25,
        priority_score: priorityScore,
        is_auto_prioritized: false,
        task_id: task.id,
      });

      dreamTasksAdded++;
    }

    // Sort all by priority score desc
    todoItems.sort((a, b) => b.priority_score - a.priority_score);

    const totalCoins = todoItems.reduce((sum, i) => sum + i.coin_reward, 0);

    // 4. Create todo record
    const { data: todoRecord, error: todoError } = await supabase
      .from("student_daily_todos")
      .insert({
        student_id: studentId,
        date,
        total_tasks: todoItems.length,
        completed_tasks: 0,
        coins_available: totalCoins,
        coins_earned: 0,
      })
      .select()
      .single();

    if (todoError) throw todoError;

    // 5. Insert items
    if (todoItems.length > 0) {
      const { error: itemsError } = await supabase.from("todo_items").insert(
        todoItems.map((item) => ({
          ...item,
          todo_id: todoRecord.id,
          student_id: studentId,
        }))
      );
      if (itemsError) throw itemsError;
    }

    // 6. Return full todo with items
    const { data: fullTodo } = await supabase
      .from("student_daily_todos")
      .select("*, items:todo_items(*)")
      .eq("id", todoRecord.id)
      .single();

    return NextResponse.json({ todo: fullTodo });
  } catch (err: any) {
    console.error("Todo generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
