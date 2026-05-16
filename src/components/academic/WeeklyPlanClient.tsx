"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Subject } from "@/types";
import { formatDate } from "@/lib/utils";

interface WeeklyPlanClientProps {
  subjects: Subject[];
  teacherId: string;
  existingPlans: any[];
}

export function WeeklyPlanClient({ subjects, teacherId, existingPlans }: WeeklyPlanClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    subject_id: subjects[0]?.id || "",
    week_start: "",
    week_end: "",
    target_chapters: "",
    target_topics: "",
    target_pages_start: "",
    target_pages_end: "",
    planned_hours: "",
    notes: "",
  });

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");

    const res = await fetch("/api/academic/weekly-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        target_chapters: form.target_chapters.split(",").map(s => s.trim()).filter(Boolean),
        target_topics: form.target_topics.split(",").map(s => s.trim()).filter(Boolean),
        target_pages_start: form.target_pages_start ? parseInt(form.target_pages_start) : null,
        target_pages_end: form.target_pages_end ? parseInt(form.target_pages_end) : null,
        planned_hours: parseFloat(form.planned_hours) || 0,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create plan");
    } else {
      setSuccess("Weekly plan created successfully!");
      setForm({
        subject_id: subjects[0]?.id || "",
        week_start: "", week_end: "", target_chapters: "",
        target_topics: "", target_pages_start: "", target_pages_end: "",
        planned_hours: "", notes: "",
      });
      setShowForm(false);
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white flex items-center gap-2">
          <span>📅</span> Weekly Study Plans
        </h2>
        <Button
          variant="neon"
          size="sm"
          className="border-blue-400/60 text-blue-400 hover:bg-blue-400/10"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ New Plan"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Create Weekly Study Plan</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={createPlan} className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Subject *
                </label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50"
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code && `(${s.code})`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="plan-week-start"
                  label="Week Start *"
                  type="date"
                  value={form.week_start}
                  onChange={(e) => setForm({ ...form, week_start: e.target.value })}
                  required
                />
                <Input
                  id="plan-week-end"
                  label="Week End *"
                  type="date"
                  value={form.week_end}
                  onChange={(e) => setForm({ ...form, week_end: e.target.value })}
                  required
                />
                <Input
                  id="plan-chapters"
                  label="Target Chapters (comma-sep)"
                  placeholder="Chapter 5, Chapter 6"
                  value={form.target_chapters}
                  onChange={(e) => setForm({ ...form, target_chapters: e.target.value })}
                />
                <Input
                  id="plan-topics"
                  label="Target Topics (comma-sep)"
                  placeholder="Sorting, Searching"
                  value={form.target_topics}
                  onChange={(e) => setForm({ ...form, target_topics: e.target.value })}
                />
                <Input
                  id="plan-pages-start"
                  label="Pages From"
                  type="number"
                  placeholder="120"
                  value={form.target_pages_start}
                  onChange={(e) => setForm({ ...form, target_pages_start: e.target.value })}
                />
                <Input
                  id="plan-pages-end"
                  label="Pages To"
                  type="number"
                  placeholder="155"
                  value={form.target_pages_end}
                  onChange={(e) => setForm({ ...form, target_pages_end: e.target.value })}
                />
                <Input
                  id="plan-hours"
                  label="Planned Hours"
                  type="number"
                  step="0.5"
                  placeholder="6"
                  value={form.planned_hours}
                  onChange={(e) => setForm({ ...form, planned_hours: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50 resize-none"
                  placeholder="Weekly goals and notes..."
                  rows={2}
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
              <Button type="submit" variant="neon" className="border-blue-400 text-blue-400 hover:bg-blue-400/10" isLoading={saving}>
                Save Plan
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Plan list */}
      {existingPlans.length > 0 ? (
        <div className="space-y-3">
          {existingPlans.map((plan) => {
            const isCurrentWeek =
              new Date(plan.week_start) <= new Date() &&
              new Date(plan.week_end) >= new Date();
            return (
              <div
                key={plan.id}
                className="p-4 rounded-xl border transition-all"
                style={{
                  borderColor: isCurrentWeek ? "rgba(0,255,65,0.3)" : "rgba(0,255,65,0.1)",
                  background: isCurrentWeek ? "rgba(0,255,65,0.04)" : "transparent",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{plan.subject?.name}</p>
                      {isCurrentWeek && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-neon-green/15 text-neon-green border border-neon-green/30 font-semibold">
                          Current Week
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(plan.week_start)} → {formatDate(plan.week_end)} · {plan.planned_hours}h planned
                    </p>
                    {plan.target_chapters?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.target_chapters.map((c: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-matrix-surface border border-matrix-border text-muted-foreground">
                            📖 {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {plan.target_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plan.target_topics.map((t: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-blue-400/5 border border-blue-400/20 text-blue-400">
                            🔖 {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {(plan.target_pages_start || plan.target_pages_end) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📄 Pages {plan.target_pages_start}–{plan.target_pages_end}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No weekly plans yet. Create your first plan above.
        </div>
      )}
    </div>
  );
}
