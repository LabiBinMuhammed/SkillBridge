"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Role = "student" | "teacher" | "admin";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as Role,
    department: "",
    rollNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role,
          department: form.department,
          roll_number: form.rollNumber,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (form.role === "student") {
      router.push("/student/onboarding");
    } else {
      router.push(`/${form.role}`);
    }
  }

  const roles: { value: Role; label: string; icon: string; color: string }[] = [
    { value: "student", label: "Student", icon: "🎓", color: "#00FF41" },
    { value: "teacher", label: "Teacher", icon: "👨‍🏫", color: "#60A5FA" },
    { value: "admin", label: "Admin", icon: "🏛️", color: "#F59E0B" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="fixed top-0 right-1/4 w-[500px] h-[400px] bg-neon-green/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neon-green flex items-center justify-center">
              <span className="text-[#050A05] font-black">SB</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="text-neon-green">Skill</span>
              <span className="text-white">Bridge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the campus intelligence network</p>
        </div>

        <div className="neon-card p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neon-green/60">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => update("role", r.value)}
                    className="p-3 rounded-lg border text-center transition-all duration-200"
                    style={{
                      borderColor: form.role === r.value ? r.color : "rgba(0,255,65,0.12)",
                      background: form.role === r.value ? `${r.color}15` : "transparent",
                    }}
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div
                      className="text-xs font-semibold"
                      style={{ color: form.role === r.value ? r.color : "#9CA3AF" }}
                    >
                      {r.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              id="reg-name"
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />

            <Input
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="you@campus.edu"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />

            {form.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="reg-roll"
                  label="Roll Number"
                  type="text"
                  placeholder="2024CS001"
                  value={form.rollNumber}
                  onChange={(e) => update("rollNumber", e.target.value)}
                />
                <Input
                  id="reg-dept"
                  label="Department"
                  type="text"
                  placeholder="CS / IT"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                />
              </div>
            )}

            <Input
              id="reg-password"
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />

            <Input
              id="reg-confirm-password"
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />

            {error && (
              <div className="px-4 py-3 rounded-lg bg-neon-red/10 border border-neon-red/30 text-sm text-neon-red">
                ⚠ {error}
              </div>
            )}

            <Button
              type="submit"
              variant="solid"
              className="w-full mt-2"
              isLoading={loading}
            >
              Create Account →
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-matrix-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-neon-green font-semibold hover:glow-text-green">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
