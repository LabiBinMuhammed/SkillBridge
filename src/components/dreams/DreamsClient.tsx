"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dream, StudentDream } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

interface DreamsClientProps {
  dreams: Dream[];
  studentDreams: (StudentDream & { dream: Dream })[];
  studentId: string;
}

export function DreamsClient({ dreams, studentDreams, studentId }: DreamsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(studentDreams.map((sd) => sd.dream_id));
  const [activeTab, setActiveTab] = useState<"select" | "progress">("select");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSelect = selected.length < 3;

  function toggleDream(dreamId: string) {
    if (selected.includes(dreamId)) {
      setSelected((s) => s.filter((id) => id !== dreamId));
    } else {
      if (selected.length >= 3) return;
      setSelected((s) => [...s, dreamId]);
    }
  }

  async function saveDreams() {
    setSaving(true);
    setError("");
    const supabase = createClient();

    // Remove deselected
    const toRemove = studentDreams
      .filter((sd) => !selected.includes(sd.dream_id))
      .map((sd) => sd.dream_id);

    if (toRemove.length > 0) {
      await supabase
        .from("student_dreams")
        .delete()
        .eq("student_id", studentId)
        .in("dream_id", toRemove);
    }

    // Add new selections
    const existing = studentDreams.map((sd) => sd.dream_id);
    const toAdd = selected
      .filter((id) => !existing.includes(id))
      .map((id, idx) => ({
        student_id: studentId,
        dream_id: id,
        priority: existing.length + idx + 1,
      }));

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from("student_dreams")
        .insert(toAdd);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-matrix-surface rounded-xl border border-matrix-border w-fit">
        {(["select", "progress"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
              activeTab === tab
                ? "bg-neon-green/15 text-neon-green border border-neon-green/30"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {tab === "select" ? "🎯 Select Dreams" : "📊 Progress"}
          </button>
        ))}
      </div>

      {activeTab === "select" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Selected{" "}
                <span className="text-neon-green font-bold">{selected.length}</span>/3 dreams.
                {selected.length < 3 && (
                  <span className="ml-1">You can select {3 - selected.length} more.</span>
                )}
              </p>
            </div>
            <Button
              variant="solid"
              size="sm"
              onClick={saveDreams}
              isLoading={saving}
              disabled={selected.length === 0}
            >
              Save Dreams
            </Button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-neon-red/10 border border-neon-red/30 text-sm text-neon-red">
              {error}
            </div>
          )}

          {/* Selected order */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((id, idx) => {
                const dream = dreams.find((d) => d.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer"
                    style={{
                      borderColor: dream?.color ? `${dream.color}44` : "#00FF4144",
                      background: dream?.color ? `${dream.color}11` : "#00FF4111",
                      color: dream?.color || "#00FF41",
                    }}
                    onClick={() => toggleDream(id)}
                    title="Click to remove"
                  >
                    <span className="text-xs font-mono opacity-60">#{idx + 1}</span>
                    <span>{dream?.icon}</span>
                    <span>{dream?.name}</span>
                    <span className="opacity-50 hover:opacity-100">✕</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dream grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dreams.map((dream) => {
              const isSelected = selected.includes(dream.id);
              const selIdx = selected.indexOf(dream.id);

              return (
                <div
                  key={dream.id}
                  onClick={() => toggleDream(dream.id)}
                  className={cn(
                    "relative p-5 rounded-xl border cursor-pointer transition-all duration-300",
                    isSelected
                      ? "border-opacity-60 shadow-lg"
                      : "border-matrix-border hover:border-neon-green/20",
                    !isSelected && !canSelect && "opacity-40 cursor-not-allowed"
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: dream.color,
                          background: `${dream.color}08`,
                          boxShadow: `0 0 20px ${dream.color}20`,
                        }
                      : {
                          background: "linear-gradient(135deg, rgba(0,255,65,0.03) 0%, rgba(0,255,65,0.01) 100%)",
                        }
                  }
                >
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: dream.color,
                        color: "#050A05",
                      }}
                    >
                      {selIdx + 1}
                    </div>
                  )}

                  <div
                    className="text-4xl mb-3 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: `${dream.color}15` }}
                  >
                    {dream.icon}
                  </div>

                  <h3
                    className="font-bold text-base mb-1"
                    style={{ color: isSelected ? dream.color : "white" }}
                  >
                    {dream.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dream.description}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "progress" && (
        <div className="space-y-6">
          {studentDreams.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🌱</p>
              <p className="text-muted-foreground">No dreams selected yet. Go to Select Dreams tab!</p>
            </div>
          ) : (
            studentDreams.map((sd) => {
              const xpForNext = sd.level * sd.level * 100;
              const xpPct = Math.min(100, (sd.xp_earned / xpForNext) * 100);

              return (
                <Card key={sd.id} glow={sd.priority === 1}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: `${sd.dream?.color || "#00FF41"}15` }}
                      >
                        {sd.dream?.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-lg">{sd.dream?.name}</h3>
                          <Badge variant={sd.priority === 1 ? "green" : "gray"}>
                            Priority #{sd.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Level {sd.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-neon-green font-mono">{sd.xp_earned}</p>
                        <p className="text-xs text-muted-foreground">XP earned</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ProgressBar
                      value={sd.xp_earned}
                      max={xpForNext}
                      label={`Level ${sd.level} → ${sd.level + 1}`}
                      showValue
                      size="md"
                      color="green"
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
                        <p className="text-lg font-bold text-neon-green">{sd.level}</p>
                        <p className="text-xs text-muted-foreground">Level</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
                        <p className="text-lg font-bold text-yellow-400">{sd.xp_earned}</p>
                        <p className="text-xs text-muted-foreground">Total XP</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-matrix-surface border border-matrix-border">
                        <p className="text-lg font-bold text-blue-400">{sd.energy_level}</p>
                        <p className="text-xs text-muted-foreground">Energy</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
