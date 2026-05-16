"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type UploadType = "subjects" | "weekly_plans" | "cce_assignments" | "daily_progress";

const UPLOAD_TYPES: { id: UploadType; label: string; desc: string; template: string }[] = [
  { id: "subjects", label: "Subjects", desc: "name, code, department, semester, teacher_email, total_hours", template: "/data/academic/subjects_template.csv" },
  { id: "weekly_plans", label: "Weekly Plans", desc: "subject_code, teacher_email, week_start, week_end, target_chapters...", template: "/data/academic/weekly_plans_template.csv" },
  { id: "cce_assignments", label: "CCE Assignments", desc: "subject_code, title, type, due_date, max_marks...", template: "/data/academic/cce_assignments_template.csv" },
  { id: "daily_progress", label: "Daily Progress", desc: "subject_code, teacher_email, date, topics_covered, actual_hours...", template: "/data/academic/daily_progress_template.csv" },
];

export default function AcademicUploadPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<UploadType>("subjects");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/admin/academic/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: selectedType, items: results.data }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed");
          setResults(data.results);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setUploading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="px-2">
          ← Back
        </Button>
        <div>
          <h1 className="text-3xl font-black text-white">
            Bulk Import <span className="text-blue-400">Academic Data</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload CSV files to bulk import subjects, plans, assignments, or progress.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📤</span> Upload Data
            </h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-400">Data Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as UploadType)}
                className="w-full px-4 py-3 rounded-lg bg-matrix-surface border border-matrix-border text-foreground focus:outline-none focus:border-blue-400/50"
              >
                {UPLOAD_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Required columns:</strong> {UPLOAD_TYPES.find(t => t.id === selectedType)?.desc}
              </p>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-400">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-400/10 file:text-blue-400 hover:file:bg-blue-400/20"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm">
                {error}
              </div>
            )}

            <Button
              variant="solid"
              className="w-full"
              disabled={!file || uploading}
              isLoading={uploading}
              onClick={handleUpload}
            >
              Upload and Process CSV
            </Button>
          </CardBody>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-white flex items-center gap-2">
              <span>📋</span> Upload Results
            </h2>
          </CardHeader>
          <CardBody>
            {!results ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm">Upload a file to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/20">
                    <p className="text-2xl font-bold text-neon-green">{results.successful}</p>
                    <p className="text-xs text-muted-foreground mt-1">Successfully Imported</p>
                  </div>
                  <div className="p-4 rounded-xl bg-neon-red/10 border border-neon-red/20">
                    <p className="text-2xl font-bold text-neon-red">{results.failed}</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed to Import</p>
                  </div>
                </div>

                {results.errors?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-neon-red mb-2">Errors:</h3>
                    <div className="bg-matrix-surface rounded-lg p-3 max-h-[300px] overflow-y-auto space-y-2 border border-matrix-border">
                      {results.errors.map((err: any, i: number) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="text-white font-semibold">{err.row}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.successful > 0 && results.failed === 0 && (
                  <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center">
                    <p className="text-neon-green font-bold text-sm">✅ All items imported successfully!</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
