"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ProfileClient({ profile, roleColor = "neon-green" }: { profile: any, roleColor?: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    department: profile.department || "",
    semester: profile.semester || "",
    section: profile.section || "",
  });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", profile.id);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <h2 className={`font-bold text-white flex items-center gap-2`}>
          <span>👤</span> Personal Information
        </h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email (Read Only)</label>
              <input
                type="text"
                value={profile.email || ""}
                readOnly
                className="w-full bg-matrix-surface border border-matrix-border rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed"
              />
            </div>
            {profile.role === "student" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Roll Number (Read Only)</label>
                  <input
                    type="text"
                    value={profile.roll_number || ""}
                    readOnly
                    className="w-full bg-matrix-surface border border-matrix-border rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Semester</label>
                  <input
                    type="number"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department / Branch</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`w-full bg-matrix-bg border border-matrix-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-${roleColor}`}
              rows={3}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="solid" isLoading={loading} className={profile.role === "student" ? "bg-neon-green text-black" : profile.role === "teacher" ? "bg-blue-400 text-black" : "bg-yellow-400 text-black"}>
              Save Changes
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
