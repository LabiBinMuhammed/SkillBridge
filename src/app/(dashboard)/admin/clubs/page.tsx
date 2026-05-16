"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏢");
  const [color, setColor] = useState("#00FF41");

  // Bulk upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ successful: number; failed: number; errors: any[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      const res = await fetch("/api/admin/clubs");
      const json = await res.json();
      setClubs(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createClub(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon, color }),
      });
      setName("");
      setDescription("");
      fetchClubs();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function deleteClub(id: string) {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await fetch("/api/admin/clubs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchClubs();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResults(null);
      setUploadError(null);
    }
  };

  const downloadTemplate = () => {
    const headers = ["name", "description", "icon", "color"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      "Debate Club,Debate and public speaking,🎤,#FF5733\nScience Club,Explore the universe,🔭,#3380FF";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "club_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/admin/clubs/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ clubs: results.data }),
          });

          const data = await res.json();

          if (!res.ok) {
            setUploadError(data.error || "Failed to upload clubs");
          } else {
            setUploadResults(data.results);
            setFile(null); // Reset file
            fetchClubs(); // Refresh list
          }
        } catch (err: any) {
          setUploadError(err.message || "An unexpected error occurred.");
        } finally {
          setUploadLoading(false);
        }
      },
      error: (error) => {
        setUploadError("Failed to parse CSV file: " + error.message);
        setUploadLoading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Manage Clubs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-white">Create New Club</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={createClub} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-matrix-surface border border-matrix-border rounded-lg px-3 py-2 text-white focus:border-neon-green outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-matrix-surface border border-matrix-border rounded-lg px-3 py-2 text-white focus:border-neon-green outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">Icon (Emoji)</label>
                    <input
                      required
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-matrix-surface border border-matrix-border rounded-lg px-3 py-2 text-white focus:border-neon-green outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">Color (Hex)</label>
                    <input
                      required
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
                <Button type="submit" variant="solid" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Create Club"}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Bulk Upload Card */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-white">Bulk Upload</h2>
              <Button onClick={downloadTemplate} variant="ghost" size="sm" className="h-8 text-xs p-2 hover:bg-white/10">
                <Download className="w-3 h-3 mr-1" /> Template
              </Button>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center transition-colors hover:border-white/40">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-8 h-8 text-white/40 mb-2" />
                    <span className="text-white text-sm font-medium mb-1">
                      {file ? file.name : "Select CSV"}
                    </span>
                  </label>
                </div>

                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{uploadError}</p>
                  </div>
                )}

                {uploadResults && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Uploaded: {uploadResults.successful} | Failed: {uploadResults.failed}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploadLoading}
                  className="w-full gap-2"
                >
                  {uploadLoading ? "Processing..." : <><Upload className="w-4 h-4" /> Upload Clubs</>}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-white">Existing Clubs</h2>
            </CardHeader>
            <CardBody>
              {loading && clubs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : clubs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No clubs found.</p>
              ) : (
                <div className="space-y-3">
                  {clubs.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border border-matrix-border rounded-lg bg-matrix-surface">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: `${c.color}15` }}>
                          {c.icon}
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg" style={{ color: c.color }}>{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-neon-red hover:bg-neon-red/10" onClick={() => deleteClub(c.id)}>
                        Delete
                      </Button>
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
