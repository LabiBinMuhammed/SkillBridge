"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle2, Download, UserCheck } from "lucide-react";

export default function TeachersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ successful: number; failed: number; errors: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/teachers");
      const json = await res.json();
      setTeachers(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const downloadTemplate = () => {
    const headers = ["full_name", "email", "password", "club", "club_role"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      "Dr. Jane Smith,jane@example.com,pass123,Debate Club,mentor\nMr. Alex Doe,alex@example.com,pass123,Science Club,assistant_mentor";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "teacher_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/admin/teachers/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ teachers: results.data }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Failed to upload teachers");
          } else {
            setResults(data.results);
            setFile(null); // Reset file
            fetchTeachers(); // Refresh the list
          }
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setError("Failed to parse CSV file: " + error.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Manage Teachers</h1>
          <p className="text-muted-foreground mt-1">Upload teachers and assign them as Mentors or Assistant Mentors to Clubs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-white">Bulk Upload</h2>
              <Button onClick={downloadTemplate} variant="ghost" size="sm" className="h-8 text-xs p-2 hover:bg-white/10">
                <Download className="w-3 h-3 mr-1" /> Template
              </Button>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center transition-colors hover:border-white/40">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-10 h-10 text-white/40 mb-3" />
                    <span className="text-white font-medium mb-1">
                      {file ? file.name : "Select CSV file"}
                    </span>
                    <span className="text-xs text-white/50">
                      Include &apos;club&apos; and &apos;club_role&apos; headers
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {results && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Upload Completed
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/20 p-2 rounded text-center">
                        <div className="text-xs text-white/50 mb-1">Success</div>
                        <div className="text-xl font-bold text-white">{results.successful}</div>
                      </div>
                      <div className="bg-black/20 p-2 rounded text-center">
                        <div className="text-xs text-white/50 mb-1">Failed</div>
                        <div className="text-xl font-bold text-red-400">{results.failed}</div>
                      </div>
                    </div>
                    
                    {results.errors && results.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-400 mb-1">Errors:</p>
                        <ul className="text-xs text-white/70 space-y-1 bg-black/40 p-2 rounded max-h-24 overflow-y-auto">
                          {results.errors.map((e, idx) => (
                            <li key={idx} className="flex gap-1">
                              <span className="font-medium truncate max-w-[80px]">{e.email}:</span>
                              <span className="truncate">{e.error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={!file || loading}
                  className="w-full gap-2"
                >
                  {loading ? "Processing..." : <><Upload className="w-4 h-4" /> Upload Teachers</>}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6 border-blue-500/30 bg-blue-500/5">
            <CardBody className="p-4 space-y-3 text-sm">
              <p className="font-bold text-blue-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Setup Required
              </p>
              <p className="text-white/70 leading-relaxed">
                To use the Club assignment feature, you must run the provided SQL command in your Supabase SQL Editor to create the <code className="bg-black/50 px-1 rounded text-blue-300">teacher_clubs</code> table.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Teacher List Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-white">All Teachers</h2>
            </CardHeader>
            <CardBody>
              {teachersLoading ? (
                <p className="text-muted-foreground text-sm">Loading teachers...</p>
              ) : teachers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No teachers found.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 border border-matrix-border rounded-lg bg-matrix-surface">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{teacher.full_name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                      
                      {teacher.club ? (
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {teacher.club_role === "mentor" ? "Mentor" : "Asst. Mentor"}
                            </p>
                            <p className="text-sm font-medium" style={{ color: teacher.club.color }}>
                              {teacher.club.name} {teacher.club.icon}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/50">
                            Unassigned
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
