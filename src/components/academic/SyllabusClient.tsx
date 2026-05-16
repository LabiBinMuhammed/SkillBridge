"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Subject, DailyProgress } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSyllabusStatusColor, getSyllabusStatusLabel, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SyllabusClientProps {
  subjects: Subject[];
  recentProgress: (DailyProgress & { subject: Subject })[];
  teacherId: string;
}

export function SyllabusClient({ subjects, recentProgress, teacherId }: SyllabusClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || "");
  const [form, setForm] = useState({
    topicsCovered: "",
    pagesStart: "",
    pagesEnd: "",
    actualHours: "",
    status: "on_track" as "on_track" | "lagging" | "completed",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function logProgress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    const { error: insertError } = await supabase
      .from("daily_progress")
      .upsert({
        subject_id: selectedSubject,
        teacher_id: teacherId,
        date: today,
        topics_covered: form.topicsCovered.split(",").map((t) => t.trim()).filter(Boolean),
        pages_covered_start: form.pagesStart ? parseInt(form.pagesStart) : null,
        pages_covered_end: form.pagesEnd ? parseInt(form.pagesEnd) : null,
        actual_hours: parseFloat(form.actualHours) || 0,
        status: form.status,
        lag_percentage: form.status === "lagging" ? 25 : 0,
        notes: form.notes,
      }, { onConflict: "subject_id,date" });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess("Progress logged successfully!");
      setForm({ topicsCovered: "", pagesStart: "", pagesEnd: "", actualHours: "", status: "on_track", notes: "" });
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  const statusOptions = [
    { value: "on_track", label: "✅ On Track", color: "#00FF41" },
    { value: "lagging", label: "⚠️ Lagging Behind", color: "#FF3131" },
    { value: "completed", label: "🎯 Completed", color: "#00CC33" },
    { value: "not_started", label: "⏸ Not Started", color: "#9CA3AF" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log progress form */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📝</span> Log Today&apos;s Progress
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={logProgress} className="space-y-4">
              {/* Subject selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50"
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code && `(${s.code})`}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                id="topics-covered"
                label="Topics Covered (comma-separated)"
                placeholder="Variables, Loops, Functions"
                value={form.topicsCovered}
                onChange={(e) => setForm({ ...form, topicsCovered: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="pages-start"
                  label="Pages From"
                  type="number"
                  placeholder="45"
                  value={form.pagesStart}
                  onChange={(e) => setForm({ ...form, pagesStart: e.target.value })}
                />
                <Input
                  id="pages-end"
                  label="Pages To"
                  type="number"
                  placeholder="68"
                  value={form.pagesEnd}
                  onChange={(e) => setForm({ ...form, pagesEnd: e.target.value })}
                />
              </div>

              <Input
                id="actual-hours"
                label="Hours Taught Today"
                type="number"
                step="0.5"
                placeholder="1.5"
                value={form.actualHours}
                onChange={(e) => setForm({ ...form, actualHours: e.target.value })}
              />

              {/* Status buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Syllabus Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, status: opt.value as any })}
                      className="px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-all"
                      style={{
                        borderColor: form.status === opt.value ? opt.color : "rgba(0,255,65,0.12)",
                        background: form.status === opt.value ? `${opt.color}15` : "transparent",
                        color: form.status === opt.value ? opt.color : "#9CA3AF",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50 resize-none"
                  placeholder="Any additional notes about today's class..."
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {success && (
                <div className="px-4 py-3 rounded-lg bg-neon-green/10 border border-neon-green/30 text-sm text-neon-green">
                  ✓ {success}
                </div>
              )}
              {error && (
                <div className="px-4 py-3 rounded-lg bg-neon-red/10 border border-neon-red/30 text-sm text-neon-red">
                  ⚠ {error}
                </div>
              )}

              <Button
                type="submit"
                variant="neon"
                className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10"
                isLoading={saving}
              >
                Log Progress
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Recent logs */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📋</span> Recent Progress Logs
            </h2>
          </CardHeader>
          <CardBody>
            {recentProgress.length > 0 ? (
              <div className="space-y-3">
                {recentProgress.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-matrix-border"
                    style={{
                      borderColor: `${getSyllabusStatusColor(p.status)}22`,
                      background: `${getSyllabusStatusColor(p.status)}05`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold">{p.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: getSyllabusStatusColor(p.status),
                          borderColor: `${getSyllabusStatusColor(p.status)}33`,
                          background: `${getSyllabusStatusColor(p.status)}11`,
                        }}
                      >
                        {getSyllabusStatusLabel(p.status)}
                      </span>
                    </div>

                    {p.topics_covered?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.topics_covered.map((topic, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-matrix-surface border border-matrix-border text-muted-foreground">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {(p.pages_covered_start || p.pages_covered_end) && (
                        <span>📄 Pages {p.pages_covered_start}–{p.pages_covered_end}</span>
                      )}
                      <span>⏱ {p.actual_hours}h taught</span>
                      {p.lag_percentage > 0 && (
                        <span className="text-neon-red font-mono">-{Math.round(p.lag_percentage)}% lag</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">No progress logged yet. Start tracking!</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
