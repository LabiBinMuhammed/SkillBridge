"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, StatCard } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSyllabusStatusColor, getSyllabusStatusLabel, formatDate } from "@/lib/utils";

interface AdminAcademicClientProps {
  subjects: any[];
  progress: any[];
  homework: any[];
  teachers: any[];
  stats: {
    totalSubjects: number;
    totalLagging: number;
    totalOnTrack: number;
    avgLag: number;
    departmentStats: Record<string, { total: number; lagging: number; on_track: number; completed: number }>;
  };
}

type TabType = "overview" | "subjects" | "homework" | "teachers";

export function AdminAcademicClient({ subjects, progress, homework, teachers, stats }: AdminAcademicClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "subjects", label: "Subjects", icon: "📚" },
    { id: "homework", label: "Assignments", icon: "📝" },
    { id: "teachers", label: "Teachers", icon: "👨‍🏫" },
  ];

  // Compute per-subject latest status
  const subjectsWithStatus = subjects.map((s: any) => {
    const logs = s.daily_progress || [];
    const latest = [...logs].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return { ...s, latestStatus: latest?.status || "not_started", latestLag: latest?.lag_percentage || 0 };
  });

  const filteredSubjects = subjectsWithStatus.filter((s) =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.teacher?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Homework due stats
  const overdue = homework.filter((h: any) => new Date(h.due_date) < new Date());
  const upcoming = homework.filter((h: any) => new Date(h.due_date) >= new Date());
  const avgSubmissionRate = homework.length > 0
    ? Math.round(
        homework
          .filter((h: any) => h.total_students > 0)
          .reduce((acc: number, h: any) => acc + (h.submitted_count / h.total_students) * 100, 0) /
        Math.max(homework.filter((h: any) => h.total_students > 0).length, 1)
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Subjects" value={stats.totalSubjects} icon="📚" color="blue" />
        <StatCard title="On Track" value={stats.totalOnTrack} icon="✅" color="green" />
        <StatCard title="Lagging" value={stats.totalLagging} icon="⚠️" color="red" />
        <StatCard
          title="Avg Lag"
          value={`${stats.avgLag}%`}
          icon="📉"
          color={stats.avgLag > 20 ? "red" : stats.avgLag > 10 ? "gold" : "green"}
        />
      </div>

      {/* Tabs and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-matrix-surface rounded-xl border border-matrix-border overflow-x-auto w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-matrix-card text-white border border-matrix-border shadow-sm"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <a 
          href="/admin/academic/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/20 hover:bg-blue-400 hover:text-white transition-all shrink-0"
        >
          <span>📤</span> Import Data
        </a>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Red-Green Status Map */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>🗺️</span> Syllabus Status Map
              </h2>
            </CardHeader>
            <CardBody>
              {subjectsWithStatus.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {subjectsWithStatus.map((s) => {
                    const color = getSyllabusStatusColor(s.latestStatus);
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl border text-center transition-all cursor-default hover:scale-105"
                        style={{ borderColor: `${color}44`, background: `${color}08` }}
                        title={`${s.teacher?.full_name || "No teacher"} · ${s.latestLag > 0 ? `-${Math.round(s.latestLag)}% lag` : "On schedule"}`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mx-auto mb-2"
                          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
                        />
                        <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{s.name}</p>
                        {s.code && <p className="text-xs text-muted-foreground font-mono mt-0.5">{s.code}</p>}
                        <p className="text-xs mt-1" style={{ color }}>{getSyllabusStatusLabel(s.latestStatus)}</p>
                        {s.latestLag > 0 && (
                          <p className="text-xs text-neon-red font-mono mt-0.5">-{Math.round(s.latestLag)}%</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No subjects found</p>
              )}
            </CardBody>
          </Card>

          {/* Department Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>🏢</span> Department Overview
                </h2>
              </CardHeader>
              <CardBody>
                {Object.entries(stats.departmentStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.departmentStats).map(([dept, ds]) => {
                      const onTrackPct = ds.total > 0 ? Math.round((ds.on_track / ds.total) * 100) : 0;
                      const laggingPct = ds.total > 0 ? Math.round((ds.lagging / ds.total) * 100) : 0;
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-white">{dept}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-neon-green">{ds.on_track} on track</span>
                              {ds.lagging > 0 && (
                                <span className="text-neon-red">{ds.lagging} lagging</span>
                              )}
                              <span className="text-muted-foreground">{ds.total} total</span>
                            </div>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                            {onTrackPct > 0 && (
                              <div
                                className="rounded-l-full transition-all"
                                style={{ width: `${onTrackPct}%`, background: "#00FF41" }}
                              />
                            )}
                            {laggingPct > 0 && (
                              <div
                                className="transition-all"
                                style={{ width: `${laggingPct}%`, background: "#FF3131" }}
                              />
                            )}
                            <div
                              className="flex-1 rounded-r-full"
                              style={{ background: "#1F2937" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-6">No department data</p>
                )}
              </CardBody>
            </Card>

            {/* Recent Lagging Alerts */}
            <Card danger={stats.totalLagging > 0}>
              <CardHeader>
                <h2 className="font-bold text-white flex items-center gap-2">
                  <span>🚨</span> Lagging Alerts
                </h2>
              </CardHeader>
              <CardBody>
                {subjectsWithStatus.filter(s => s.latestStatus === "lagging").length > 0 ? (
                  <div className="space-y-3">
                    {subjectsWithStatus
                      .filter(s => s.latestStatus === "lagging")
                      .sort((a, b) => b.latestLag - a.latestLag)
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-neon-red/5 border border-neon-red/20">
                          <div className="w-2 h-2 rounded-full bg-neon-red flex-shrink-0 animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.teacher?.full_name || "Unassigned"} · {s.department}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-neon-red font-bold flex-shrink-0">
                            -{Math.round(s.latestLag)}% lag
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-sm text-neon-green font-semibold">All subjects on track!</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Assignment summary */}
          <Card>
            <CardHeader>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>📝</span> Assignment Summary
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-neon-red/5 border border-neon-red/20">
                  <p className="text-2xl font-bold text-neon-red">{overdue.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Overdue</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-400/5 border border-blue-400/20">
                  <p className="text-2xl font-bold text-blue-400">{upcoming.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
                </div>
                <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
                  <p className="text-2xl font-bold text-neon-green">{avgSubmissionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Submission</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── SUBJECTS TAB ─── */}
      {activeTab === "subjects" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by name, teacher, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground text-sm focus:outline-none focus:border-blue-400/50"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Subject", "Teacher", "Dept / Sem", "Status", "Lag", "Hours"].map(h => (
                    <th key={h} className="text-left pb-3 text-xs uppercase tracking-wider text-muted-foreground pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-matrix-border">
                {filteredSubjects.map((s) => {
                  const color = getSyllabusStatusColor(s.latestStatus);
                  const logs = s.daily_progress || [];
                  const totalH = logs.reduce((acc: number, l: any) => acc + (l.actual_hours || 0), 0);
                  return (
                    <tr key={s.id} className="hover:bg-matrix-surface/50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">{s.name}</p>
                        {s.code && <p className="text-xs text-muted-foreground font-mono">{s.code}</p>}
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground">
                        {s.teacher?.full_name || <span className="italic opacity-50">Unassigned</span>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {s.department || "—"} / Sem {s.semester || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                          style={{ color, borderColor: `${color}44`, background: `${color}15` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          {getSyllabusStatusLabel(s.latestStatus)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {s.latestLag > 0 ? (
                          <span className="text-neon-red font-mono text-xs">-{Math.round(s.latestLag)}%</span>
                        ) : (
                          <span className="text-neon-green text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {totalH.toFixed(1)}h / {s.total_hours || "?"}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSubjects.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No subjects match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── HOMEWORK TAB ─── */}
      {activeTab === "homework" && (
        <div className="space-y-4">
          {homework.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {["Assignment", "Subject", "Type", "Due Date", "Submission Rate", "Max Marks"].map(h => (
                      <th key={h} className="text-left pb-3 text-xs uppercase tracking-wider text-muted-foreground pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-matrix-border">
                  {homework.map((hw: any) => {
                    const isOverdue = new Date(hw.due_date) < new Date();
                    const subRate = hw.total_students > 0
                      ? Math.round((hw.submitted_count / hw.total_students) * 100) : 0;
                    return (
                      <tr key={hw.id} className="hover:bg-matrix-surface/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-white">{hw.title}</td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{hw.subject?.name}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-400/10 text-blue-400">
                            {hw.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={isOverdue ? "text-neon-red" : "text-foreground"}>
                            {isOverdue && "⚠ "}{formatDate(hw.due_date)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {hw.submitted_count}/{hw.total_students || "?"}
                            </span>
                            <div className="w-16 bg-matrix-border rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${subRate}%`,
                                  background: subRate >= 70 ? "#00FF41" : subRate >= 40 ? "#F59E0B" : "#FF3131"
                                }}
                              />
                            </div>
                            <span className="text-xs" style={{
                              color: subRate >= 70 ? "#00FF41" : subRate >= 40 ? "#F59E0B" : "#FF3131"
                            }}>{subRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-yellow-400 font-semibold">{hw.max_marks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-muted-foreground">No assignments in the system yet.</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ─── TEACHERS TAB ─── */}
      {activeTab === "teachers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher: any) => {
            const teacherSubjects = subjectsWithStatus.filter(s => s.teacher_id === teacher.id);
            const lagging = teacherSubjects.filter(s => s.latestStatus === "lagging").length;
            const onTrack = teacherSubjects.filter(s => s.latestStatus === "on_track").length;
            const consistency = teacherSubjects.length > 0
              ? Math.round((onTrack / teacherSubjects.length) * 100) : 0;

            return (
              <Card key={teacher.id}>
                <CardBody>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
                      {teacher.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{teacher.full_name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.department || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subjects</span>
                      <span className="font-semibold text-white">{teacherSubjects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">On Track</span>
                      <span className="font-semibold text-neon-green">{onTrack}</span>
                    </div>
                    {lagging > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lagging</span>
                        <span className="font-semibold text-neon-red">{lagging}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Consistency</span>
                        <span style={{ color: consistency >= 70 ? "#00FF41" : consistency >= 40 ? "#F59E0B" : "#FF3131" }}>
                          {consistency}%
                        </span>
                      </div>
                      <ProgressBar
                        value={consistency}
                        size="sm"
                        color={consistency >= 70 ? "green" : "red"}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
          {teachers.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardBody className="text-center py-12">
                  <p className="text-4xl mb-3">👨‍🏫</p>
                  <p className="text-muted-foreground">No teachers in the system yet.</p>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
