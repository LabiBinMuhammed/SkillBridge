"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Subject } from "@/types";

interface SubjectsClientProps {
  subjects: (Subject & { daily_progress?: any[] })[];
  teacherId: string;
}

export function SubjectsClient({ subjects: initialSubjects, teacherId }: SubjectsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", department: "", semester: "1", total_hours: "60",
  });

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(""); setSuccess("");

    const res = await fetch("/api/academic/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create subject");
    } else {
      setSuccess(`Subject "${data.subject.name}" created!`);
      setForm({ name: "", code: "", department: "", semester: "1", total_hours: "60" });
      setShowForm(false);
      startTransition(() => router.refresh());
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {initialSubjects.length} subject{initialSubjects.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
        <Button variant="neon" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Subject"}
        </Button>
      </div>

      {/* Add Subject Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📚</span> New Subject
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={createSubject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="subject-name"
                  label="Subject Name *"
                  placeholder="Data Structures & Algorithms"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  id="subject-code"
                  label="Subject Code"
                  placeholder="CS301"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <Input
                  id="subject-dept"
                  label="Department"
                  placeholder="Computer Science"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <Input
                  id="subject-semester"
                  label="Semester"
                  type="number"
                  min="1" max="8"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                />
                <Input
                  id="subject-hours"
                  label="Total Hours"
                  type="number"
                  placeholder="60"
                  value={form.total_hours}
                  onChange={(e) => setForm({ ...form, total_hours: e.target.value })}
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
              <Button type="submit" variant="solid" isLoading={saving}>
                Create Subject
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Subjects Grid */}
      {initialSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialSubjects.map((subject) => {
            const logs = subject.daily_progress || [];
            const latest = logs.sort(
              (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];
            const status = latest?.status || "not_started";
            const statusColors: Record<string, string> = {
              on_track: "#00FF41", lagging: "#FF3131",
              completed: "#00CC33", not_started: "#9CA3AF",
            };
            const color = statusColors[status] || "#9CA3AF";
            const statusLabels: Record<string, string> = {
              on_track: "On Track", lagging: "Lagging",
              completed: "Completed", not_started: "Not Started",
            };

            const totalHours = logs.reduce((acc: number, l: any) => acc + (l.actual_hours || 0), 0);
            const pct = Math.min(100, Math.round((totalHours / (subject.total_hours || 60)) * 100));

            return (
              <div
                key={subject.id}
                className="p-5 rounded-xl border transition-all hover:scale-[1.01]"
                style={{ borderColor: `${color}33`, background: `${color}05` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{subject.name}</h3>
                    {subject.code && (
                      <p className="text-xs text-muted-foreground font-mono">{subject.code}</p>
                    )}
                    {subject.department && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sem {subject.semester} · {subject.department}
                      </p>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0"
                    style={{ color, borderColor: `${color}44`, background: `${color}15` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {statusLabels[status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-matrix-border rounded-full h-1.5 mb-3">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{totalHours.toFixed(1)}h / {subject.total_hours}h taught</span>
                  <span className="font-mono" style={{ color }}>{pct}%</span>
                </div>

                {latest?.lag_percentage > 0 && (
                  <p className="text-xs text-neon-red mt-2 font-mono">
                    ⚠ {Math.round(latest.lag_percentage)}% behind target
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-muted-foreground">No subjects yet. Add your first subject above.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
