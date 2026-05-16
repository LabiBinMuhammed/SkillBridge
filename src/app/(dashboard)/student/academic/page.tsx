import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { getSyllabusStatusColor, getSyllabusStatusLabel, formatDate } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

export const metadata = { title: "Academic Status" };

export default async function StudentAcademicPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("department, semester")
    .eq("id", user.id)
    .single();

  const [subjectsRes, homeworkRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("*, daily_progress:daily_progress(status, lag_percentage, date, topics_covered)")
      .eq("department", profile?.department || "")
      .eq("semester", profile?.semester || 1),
    supabase
      .from("cce_assignments")
      .select("*, subject:subjects(name), student_submission:homework_submissions!left(status, marks_obtained)")
      .order("due_date")
      .limit(20),
  ]);

  const subjects = subjectsRes.data || [];
  const homework = homeworkRes.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          Academic <span className="text-neon-green">Status</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time view of syllabus progress and homework status.
        </p>
      </div>

      {/* Subject status grid */}
      <div>
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <span>📚</span> Syllabus Tracker
        </h2>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject: any) => {
              const latestProgress = subject.daily_progress?.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

              const status = latestProgress?.status || "not_started";
              const lagPct = latestProgress?.lag_percentage || 0;
              const color = getSyllabusStatusColor(status as any);
              const progressPct = Math.max(0, 100 - lagPct);

              return (
                <div
                  key={subject.id}
                  className="p-5 rounded-xl border transition-all"
                  style={{
                    borderColor: `${color}33`,
                    background: `${color}05`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{subject.name}</h3>
                      {subject.code && (
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                      style={{
                        color,
                        borderColor: `${color}44`,
                        background: `${color}15`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      {getSyllabusStatusLabel(status as any)}
                    </span>
                  </div>

                  <ProgressBar value={progressPct} size="sm" color={status === "lagging" ? "red" : "green"} />

                  {latestProgress?.topics_covered?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Last covered:</p>
                      <div className="flex flex-wrap gap-1">
                        {latestProgress.topics_covered.slice(0, 3).map((topic: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-matrix-surface border border-matrix-border text-foreground/70">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestProgress?.date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated: {formatDate(latestProgress.date)}
                    </p>
                  )}

                  {lagPct > 0 && (
                    <p className="text-xs text-neon-red mt-1 font-mono">
                      ⚠ {Math.round(lagPct)}% behind target
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-muted-foreground">
                No subjects found for your department/semester. Contact admin.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Homework & Assignments */}
      <div>
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <span>📝</span> Homework & Assignments
        </h2>
        <Card>
          <CardBody className="p-0">
            {homework.length > 0 ? (
              <div className="divide-y divide-matrix-border">
                {homework.map((hw: any) => {
                  const submission = hw.student_submission?.[0];
                  const dueDate = new Date(hw.due_date);
                  const isOverdue = dueDate < new Date() && (!submission || submission.status === "pending");

                  return (
                    <div key={hw.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{hw.title}</p>
                        <p className="text-xs text-muted-foreground">{hw.subject?.name}</p>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <p className={`text-xs font-medium ${isOverdue ? "text-neon-red" : "text-muted-foreground"}`}>
                          {isOverdue ? "⚠ " : ""}
                          {formatDate(hw.due_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">Due date</p>
                      </div>
                      <div className="flex-shrink-0">
                        {submission?.status === "graded" ? (
                          <span className="status-green">
                            ✓ {submission.marks_obtained}/{hw.max_marks}
                          </span>
                        ) : submission?.status === "submitted" ? (
                          <span className="status-amber">⏳ Submitted</span>
                        ) : (
                          <span className={isOverdue ? "status-red" : "status-amber"}>
                            {isOverdue ? "❌ Overdue" : "📌 Pending"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-4xl mb-2">📝</p>
                <p>No assignments found</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
