"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function DashboardTasksClient({ 
  initialTodo, 
  studentId, 
  today 
}: { 
  initialTodo: any, 
  studentId: string, 
  today: string 
}) {
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
        router.refresh();
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
      const updatedItems = todo.items?.map((item: any) =>
        item.id === itemId
          ? { ...item, is_completed: !completed, completed_at: !completed ? new Date().toISOString() : undefined }
          : item
      );

      const completedCount = updatedItems?.filter((i: any) => i.is_completed).length || 0;
      const totalCoinEarned = updatedItems
        ?.filter((i: any) => i.is_completed)
        .reduce((sum: number, i: any) => sum + i.coin_reward, 0) || 0;

      await supabase
        .from("student_daily_todos")
        .update({ completed_tasks: completedCount, coins_earned: totalCoinEarned })
        .eq("id", todo.id);

      setTodo((prev: any) =>
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
      const item = todo.items?.find((i: any) => i.id === itemId);
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
        } catch (apiError) {
          console.error("API Error in toggleItem:", apiError);
        }
      }
      
      router.refresh(); // refresh to update other components like stats
    }

    setCompleting(null);
  }

  if (!todo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm mb-4">No tasks generated for today.</p>
        <Button variant="solid" onClick={generateTodos} isLoading={generating}>
          ⚡ Generate today&apos;s tasks
        </Button>
      </div>
    );
  }

  const completionRate = Math.round(((todo.completed_tasks || 0) / Math.max(todo.total_tasks || 1, 1)) * 100);

  return (
    <div className="space-y-4">
      <ProgressBar
        value={completionRate}
        label={`${todo.completed_tasks} of ${todo.total_tasks} tasks done`}
        showValue
        size="md"
        color={completionRate >= 80 ? "green" : completionRate >= 40 ? "blue" : "red"}
      />
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
          <p className="text-lg font-bold text-yellow-400">{todo.coins_available}</p>
          <p className="text-xs text-muted-foreground">Coins available</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
          <p className="text-lg font-bold text-neon-green">{todo.coins_earned}</p>
          <p className="text-xs text-muted-foreground">Coins earned</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
          <p className="text-lg font-bold text-blue-400">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
      </div>

      {todo.items && todo.items.length > 0 && (
        <div className="mt-6 border-t border-matrix-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Today&apos;s Tasks</h3>
            <span className="text-xs text-muted-foreground">{todo.items.length} tasks total</span>
          </div>
          <div className="space-y-2">
            {todo.items.slice(0, 4).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-matrix-border bg-matrix-surface hover:border-neon-green/30 transition-colors">
                <button
                  onClick={() => toggleItem(item.id, item.is_completed)}
                  disabled={completing === item.id}
                  className={`w-6 h-6 rounded flex items-center justify-center border shrink-0 transition-all ${
                    item.is_completed ? 'bg-neon-green border-neon-green text-black' : 'border-matrix-border hover:border-neon-green/50'
                  }`}
                >
                  {completing === item.id ? (
                    <svg className="w-3 h-3 text-neon-green animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : item.is_completed ? (
                    <svg className="w-3.5 h-3.5 text-[#050A05]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${item.is_completed ? 'line-through text-muted-foreground' : 'text-white'}`}>{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.estimated_minutes} min • {item.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-yellow-400">+{item.coin_reward} 🪙</span>
                </div>
              </div>
            ))}
          </div>
          {todo.items.length > 4 && (
            <div className="mt-3 text-center">
              <a href="/student/todo" className="text-xs text-neon-green hover:underline">
                + {todo.items.length - 4} more tasks
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
