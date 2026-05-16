"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";

export default function AdminDreamsPage() {
  const [dreams, setDreams] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections for drill-down
  const [selectedDream, setSelectedDream] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [results, setResults] = useState<{ successful: number; failed: number; errors: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDreams();
  }, []);

  useEffect(() => {
    if (selectedDream) fetchSkills(selectedDream.id);
  }, [selectedDream]);

  useEffect(() => {
    if (selectedSkill) fetchTasks(selectedSkill.id);
  }, [selectedSkill]);

  async function fetchDreams() {
    try {
      const res = await fetch("/api/admin/dreams");
      const json = await res.json();
      setDreams(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSkills(dreamId: string) {
    try {
      const res = await fetch(`/api/admin/skills?dream_id=${dreamId}`);
      const json = await res.json();
      setSkills(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchTasks(skillId: string) {
    try {
      const res = await fetch(`/api/admin/tasks?skill_id=${skillId}`);
      const json = await res.json();
      setTasks(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteDream(id: string) {
    if (!confirm("Are you sure?")) return;
    await fetch("/api/admin/dreams", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchDreams();
    if (selectedDream?.id === id) {
      setSelectedDream(null);
      setSelectedSkill(null);
      setSkills([]);
      setTasks([]);
    }
  }

  async function deleteSkill(id: string) {
    if (!confirm("Are you sure?")) return;
    await fetch("/api/admin/skills", { method: "DELETE", body: JSON.stringify({ id }) });
    if (selectedDream) fetchSkills(selectedDream.id);
    if (selectedSkill?.id === id) {
      setSelectedSkill(null);
      setTasks([]);
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure?")) return;
    await fetch("/api/admin/tasks", { method: "DELETE", body: JSON.stringify({ id }) });
    if (selectedSkill) fetchTasks(selectedSkill.id);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "dream_name", "dream_description", "dream_icon", "dream_color",
      "skill_name", "skill_description", "skill_xp", "skill_coin",
      "task_title", "task_description", "task_minutes"
    ];
    // Demonstrate inheritance: subsequent rows can leave dream and skill blank to inherit from above
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      "Software Engineering,Become a pro developer,💻,#00FF41,Frontend Basics,Learn HTML and CSS,50,10,Learn HTML Tags,Study div and span elements,30\n" +
      ",,,,,,,,Create a Bio Page,Use tags to build a bio,45\n" +
      ",,,,,,,,Deploy to Vercel,Host your page online,20\n" +
      ",,,,JavaScript Fundamentals,Learn logic and interactivity,100,20,Variables & Functions,Learn how to store data,60\n" +
      ",,,,,,,,Build a Calculator,Write logic for basic math,90";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dreams_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadLoading(true);
    setError(null);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsedResults) => {
        try {
          const res = await fetch("/api/admin/dreams/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items: parsedResults.data }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Failed to upload dreams data");
          } else {
            setResults(data.results);
            setFile(null); // Reset file
            fetchDreams(); // Refresh the list
            if (selectedDream) fetchSkills(selectedDream.id);
            if (selectedSkill) fetchTasks(selectedSkill.id);
          }
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
        } finally {
          setUploadLoading(false);
        }
      },
      error: (err) => {
        setError("Failed to parse CSV file: " + err.message);
        setUploadLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Manage Dreams & Tasks</h1>
          <p className="text-muted-foreground mt-1">Upload and organize dreams, skills, and tasks hierarchically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
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
                    <span className="text-white font-medium mb-1 text-sm">
                      {file ? file.name : "Select CSV file"}
                    </span>
                    <span className="text-xs text-white/50 px-2 text-center mt-1">
                      Include dream, skill, and task hierarchy
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
                              <span className="font-medium truncate max-w-[80px]">{e.row}:</span>
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
                  disabled={!file || uploadLoading}
                  className="w-full gap-2"
                >
                  {uploadLoading ? "Processing..." : <><Upload className="w-4 h-4" /> Upload Data</>}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* DREAMS COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader><h2 className="text-lg font-bold text-white">1. Dreams</h2></CardHeader>
            <CardBody>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : dreams.length === 0 ? (
                <p className="text-xs text-muted-foreground">No dreams found.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {dreams.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => { setSelectedDream(d); setSelectedSkill(null); }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedDream?.id === d.id ? 'border-neon-green bg-neon-green/10' : 'border-matrix-border bg-matrix-surface hover:border-neon-green/50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>{d.icon}</span>
                          <span className="font-bold text-sm" style={{color: d.color}}>{d.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteDream(d.id); }} className="text-xs text-red-500 hover:text-red-400">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SKILLS COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader><h2 className="text-lg font-bold text-white">2. Skills</h2></CardHeader>
            <CardBody>
              {!selectedDream ? (
                <p className="text-muted-foreground text-sm">Select a dream first.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills.</p>}
                  {skills.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedSkill(s)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedSkill?.id === s.id ? 'border-neon-green bg-neon-green/10' : 'border-matrix-border bg-matrix-surface hover:border-neon-green/50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-white">{s.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteSkill(s.id); }} className="text-xs text-red-500 hover:text-red-400">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* TASKS COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader><h2 className="text-lg font-bold text-white">3. Tasks</h2></CardHeader>
            <CardBody>
              {!selectedSkill ? (
                <p className="text-muted-foreground text-sm">Select a skill first.</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {tasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks.</p>}
                  {tasks.map(t => (
                    <div key={t.id} className="p-3 border border-matrix-border bg-matrix-surface rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm text-white block">{t.title}</span>
                          <span className="text-xs text-muted-foreground">{t.estimated_minutes} min</span>
                        </div>
                        <button onClick={() => deleteTask(t.id)} className="text-xs text-red-500 hover:text-red-400">Del</button>
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

