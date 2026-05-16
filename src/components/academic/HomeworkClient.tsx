"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import type { Subject } from "@/types";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  due_date: string;
  max_marks: number;
  submitted_count: number;
  total_students: number;
  subject: Subject | null;
  homework_submissions?: { id: string; status: string; student_id: string }[];
}

interface HomeworkClientProps {
  assignments: Assignment[];
  subjects: Subject[];
  teacherId: string;
}

const TYPE_COLORS: Record<string, string> = {
  homework: "#60A5FA",
  assignment: "#A78BFA",
  project: "#F59E0B",
  test: "#FF3131",
};

const TYPE_ICONS: Record<string, string> = {
  homework: "📝",
  assignment: "📋",
  project: "🔬",
  test: "📊",
};

export function HomeworkClient({ assignments: initialAssignments, subjects, teacherId }: HomeworkClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "homework" | "assignment" | "project" | "test">("all");
  const [form, setForm] = useState({
    subject_id: subjects[0]?.id || "",
    title: "",
    description: "",
    type: "homework",
    due_date: "",
    max_marks: "10",
  });

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");

    const res = await fetch("/api/academic/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create assignment");
    } else {
      setSuccess(`"${data.assignment.title}" created!`);
      setForm({ subject_id: subjects[0]?.id || "", title: "", description: "", type: "homework", due_date: "", max_marks: "10" });
      setShowForm(false);
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  async function updateSubmittedCount(id: string, count: number) {
    const res = await fetch("/api/academic/homework", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, submitted_count: count }),
    });
    if (res.ok) {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, submitted_count: count } : a));
    }
  }

  const filtered = filter === "all" ? assignments : assignments.filter(a => a.type === filter);

  const typeLabels = ["all", "homework", "assignment", "project", "test"] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {typeLabels.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === t
                  ? "border-blue-400 bg-blue-400/15 text-blue-400"
                  : "border-matrix-border text-muted-foreground hover:border-blue-400/30"
              }`}
            >
              {t === "all" ? "All" : `${TYPE_ICONS[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
            </button>
          ))}
        </div>
        <Button variant="neon" size="sm"
          className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ New Assignment"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📝</span> Create Assignment / Homework
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={createAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="">Select subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["homework", "assignment", "project", "test"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className="px-3 py-2 rounded-lg border text-xs font-semibold transition-all text-left"
                        style={{
                          borderColor: form.type === t ? TYPE_COLORS[t] : "rgba(0,255,65,0.12)",
                          background: form.type === t ? `${TYPE_COLORS[t]}15` : "transparent",
                          color: form.type === t ? TYPE_COLORS[t] : "#9CA3AF",
                        }}
                      >
                        {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  id="hw-title"
                  label="Title *"
                  placeholder="Chapter 5 Practice Problems"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <Input
                  id="hw-due"
                  label="Due Date *"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                />
                <Input
                  id="hw-marks"
                  label="Max Marks"
                  type="number"
                  min="1"
                  value={form.max_marks}
                  onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400/60">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50 resize-none"
                  placeholder="Instructions for this assignment..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <Button type="submit" variant="neon" size="md"
                className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                isLoading={saving}
              >
                Create Assignment
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Assignments List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((a) => {
            const color = TYPE_COLORS[a.type] || "#9CA3AF";
            const dueDate = new Date(a.due_date);
            const isOverdue = dueDate < new Date();
            const submissionRate = a.total_students > 0
              ? Math.round((a.submitted_count / a.total_students) * 100)
              : 0;

            return (
              <Card key={a.id}>
                <CardBody className="py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon + title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}33` }}
                      >
                        {TYPE_ICONS[a.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.subject?.name}
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ color, background: `${color}15` }}
                          >
                            {a.type}
                          </span>
                        </p>
                        {a.description && (
                          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{a.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {/* Due date */}
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${isOverdue ? "text-neon-red" : "text-foreground"}`}>
                          {isOverdue ? "⚠ " : ""}{formatDate(a.due_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">Due date</p>
                      </div>

                      {/* Submission tracker */}
                      <div className="text-center min-w-[80px]">
                        <div className="flex items-center gap-1 justify-center mb-1">
                          <span className="text-sm font-bold text-neon-green">{a.submitted_count}</span>
                          <span className="text-xs text-muted-foreground">/ {a.total_students || "?"}</span>
                        </div>
                        <div className="w-20 bg-matrix-border rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${submissionRate}%`,
                              background: submissionRate >= 70 ? "#00FF41" : submissionRate >= 40 ? "#F59E0B" : "#FF3131"
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">submitted</p>
                      </div>

                      {/* Quick update submitted count */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSubmittedCount(a.id, Math.max(0, a.submitted_count - 1))}
                          className="w-6 h-6 rounded border border-matrix-border text-muted-foreground hover:text-white hover:border-white/30 flex items-center justify-center text-xs transition-colors"
                        >
                          −
                        </button>
                        <button
                          onClick={() => updateSubmittedCount(a.id, a.submitted_count + 1)}
                          className="w-6 h-6 rounded border border-neon-green/30 text-neon-green hover:bg-neon-green/10 flex items-center justify-center text-xs transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Max marks */}
                      <div className="text-center">
                        <p className="text-sm font-bold text-yellow-400">{a.max_marks}</p>
                        <p className="text-xs text-muted-foreground">max marks</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-muted-foreground text-sm">
              {filter === "all" ? "No assignments created yet." : `No ${filter}s created yet.`}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
