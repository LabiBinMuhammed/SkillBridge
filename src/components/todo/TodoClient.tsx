"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { StudentDailyTodo, TodoItem } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn, getPriorityColor, getPriorityLabel } from "@/lib/utils";

interface TodoClientProps {
  todo: (StudentDailyTodo & { items: TodoItem[] }) | null;
  studentId: string;
  today: string;
}

const typeIcons: Record<string, string> = {
  dream_task: "🎯",
  syllabus_task: "📚",
  homework_task: "📝",
  custom: "✨",
};

const typeColors: Record<string, string> = {
  dream_task: "#00FF41",
  syllabus_task: "#60A5FA",
  homework_task: "#F59E0B",
  custom: "#A78BFA",
};

export function TodoClient({ todo: initialTodo, studentId, today }: TodoClientProps) {
  const [todo, setTodo] = useState(initialTodo);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const router = useRouter();

  async function generateTodos() {
    setGenerating(true);
    try {
      const res = await fetch("/api/todo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date: today }),
      });
      const data = await res.json();
      if (data.todo) {
        setTodo(data.todo);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  async function toggleItem(itemId: string, completed: boolean) {
    setCompleting(itemId);
    const supabase = createClient();

    const { error } = await supabase
      .from("todo_items")
      .update({
        is_completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      })
      .eq("id", itemId);

    if (!error && todo) {
      const updatedItems = todo.items?.map((item) =>
        item.id === itemId
          ? { ...item, is_completed: !completed, completed_at: !completed ? new Date().toISOString() : undefined }
          : item
      );

      const completedCount = updatedItems?.filter((i) => i.is_completed).length || 0;
      const totalCoinEarned = updatedItems
        ?.filter((i) => i.is_completed)
        .reduce((sum, i) => sum + i.coin_reward, 0) || 0;

      // Update the todo header counts
      await supabase
        .from("student_daily_todos")
        .update({ completed_tasks: completedCount, coins_earned: totalCoinEarned })
        .eq("id", todo.id);

      setTodo((prev) =>
        prev
          ? {
              ...prev,
              items: updatedItems || [],
              completed_tasks: completedCount,
              coins_earned: totalCoinEarned,
            }
          : null
      );

      // Send to mentor for approval instead of instant coins
      const item = todo.items?.find((i) => i.id === itemId);
      if (item) {
        try {
          if (!completed) {
            const { error: approvalError } = await supabase.from("todo_approvals").insert({
              todo_item_id: item.id,
              student_id: studentId,
              title: item.title,
              coin_reward: item.coin_reward || 0,
              xp_reward: item.xp_reward || 10,
              status: "pending"
            });
            if (approvalError) console.error("Error creating approval:", approvalError);
          } else {
            const { error: deleteError } = await supabase.from("todo_approvals").delete().match({
              todo_item_id: item.id,
              status: "pending"
            });
            if (deleteError) console.error("Error deleting approval:", deleteError);
          }
        } catch (e) {
          console.error("API Error in toggleItem:", e);
        }
      }
    }
    router.refresh();
    setCompleting(null);
  }

  const completionRate = todo
    ? Math.round(((todo.completed_tasks || 0) / Math.max(todo.total_tasks || 1, 1)) * 100)
    : 0;

  const groupedItems = todo?.items?.reduce(
    (groups, item) => {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, TodoItem[]>
  );

  const sortedGroups = Object.entries(groupedItems || {}).sort((a, b) => {
    const order = ["homework_task", "syllabus_task", "dream_task", "custom"];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  return (
    <div className="space-y-6">
      {/* Header stats */}
      {todo ? (
        <Card>
          <CardBody className="py-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-bold text-white">
                    Today&apos;s Task List
                  </h2>
                  <Badge variant="green">
                    {todo.completed_tasks}/{todo.total_tasks} done
                  </Badge>
                </div>
                <ProgressBar
                  value={completionRate}
                  size="md"
                  color={completionRate >= 80 ? "green" : completionRate >= 40 ? "blue" : "red"}
                  showValue
                />
              </div>

              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-400">{todo.coins_earned}</p>
                  <p className="text-xs text-muted-foreground">Coins earned</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-neon-green">{todo.coins_available}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <Button variant="neon" size="sm" onClick={generateTodos} isLoading={generating}>
                  ↺ Regenerate
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-5xl mb-4">⚡</p>
            <h3 className="text-xl font-bold text-white mb-2">No tasks for today yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The engine will auto-generate your personalized task list based on your dreams, syllabus status, and pending homework.
            </p>
            <Button variant="solid" onClick={generateTodos} isLoading={generating}>
              ⚡ Generate Today&apos;s Tasks
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Task groups */}
      {sortedGroups.map(([type, items]) => (
        <div key={type}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">{typeIcons[type]}</span>
            <h3
              className="font-bold text-sm uppercase tracking-wider"
              style={{ color: typeColors[type] }}
            >
              {type === "dream_task"
                ? "Dream Tasks"
                : type === "syllabus_task"
                ? "Syllabus Tasks"
                : type === "homework_task"
                ? "Homework & Assignments"
                : "Custom Tasks"}
            </h3>
            <div
              className="text-xs px-2 py-0.5 rounded-full border font-semibold"
              style={{ color: typeColors[type], borderColor: `${typeColors[type]}33`, background: `${typeColors[type]}11` }}
            >
              {items.filter((i) => i.is_completed).length}/{items.length}
            </div>
          </div>

          <div className="space-y-2">
            {items
              .sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
              })
              .map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 group",
                    item.is_completed
                      ? "border-matrix-border opacity-60"
                      : "border-matrix-border hover:border-neon-green/20"
                  )}
                  style={{
                    background: item.is_completed
                      ? "rgba(0,255,65,0.02)"
                      : "linear-gradient(135deg, rgba(0,255,65,0.03) 0%, transparent 100%)",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id, item.is_completed)}
                    disabled={completing === item.id}
                    className={cn(
                      "mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      item.is_completed
                        ? "bg-neon-green border-neon-green"
                        : "border-matrix-border hover:border-neon-green/50"
                    )}
                  >
                    {item.is_completed && (
                      <svg className="w-3.5 h-3.5 text-[#050A05]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {completing === item.id && (
                      <svg className="w-3.5 h-3.5 text-neon-green animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn("text-sm font-semibold", item.is_completed && "line-through text-muted-foreground")}
                        >
                          {item.title}
                        </span>
                        {item.is_auto_prioritized && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20">
                            Auto-prioritized
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: getPriorityColor(item.priority) }}
                          title={getPriorityLabel(item.priority)}
                        />
                        <span className="text-xs text-yellow-400 font-mono">+{item.coin_reward}🪙</span>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">⏱ {item.estimated_minutes}min</span>
                      <span className="text-xs text-neon-green/60">+{item.xp_reward} XP</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getPriorityColor(item.priority) }}
                      >
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Empty todo with regenerate */}
      {todo && todo.items?.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-4xl mb-3">✨</p>
          <p>All caught up! No tasks for today.</p>
        </div>
      )}
    </div>
  );
}
