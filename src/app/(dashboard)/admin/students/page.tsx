"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle2, Download, User } from "lucide-react";

export default function StudentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ successful: number; failed: number; errors: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/admin/students");
      const json = await res.json();
      setStudents(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setStudentsLoading(false);
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
    const headers = ["full_name", "email", "password", "roll_number", "class", "clubs"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      "John Doe,john@example.com,pass123,CS101,10A,\"Coding Club, AI Club\"";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_upload_template.csv");
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
          const res = await fetch("/api/admin/students/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ students: results.data }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Failed to upload students");
          } else {
            setResults(data.results);
            setFile(null); // Reset file
            fetchStudents(); // Refresh the list
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
          <h1 className="text-3xl font-black text-white">Manage Students</h1>
          <p className="text-muted-foreground mt-1">Upload and manage student accounts and their associated clubs.</p>
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
                      Match the template headers exactly
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
                  {loading ? "Processing..." : <><Upload className="w-4 h-4" /> Upload Students</>}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Student List Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-white">All Students</h2>
            </CardHeader>
            <CardBody>
              {studentsLoading ? (
                <p className="text-muted-foreground text-sm">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-muted-foreground text-sm">No students found.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border border-matrix-border rounded-lg bg-matrix-surface">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground mb-0.5">Class</p>
                          <p className="text-sm font-medium text-white">{student.department || "N/A"}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground mb-0.5">Roll No</p>
                          <p className="text-sm font-medium text-white">{student.roll_number || "N/A"}</p>
                        </div>
                        <div>
                          <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium">
                            Lvl {student.level || 1}
                          </div>
                        </div>
                      </div>
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
