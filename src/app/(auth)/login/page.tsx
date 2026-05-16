"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fetch user role and redirect accordingly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_onboarded")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      if (!profile.is_onboarded && profile.role === "student") {
        router.push("/student/onboarding");
      } else {
        router.push(`/${profile.role}`);
      }
    } else {
      router.push("/student");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-neon-green/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neon-green flex items-center justify-center">
              <span className="text-[#050A05] font-black">SB</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="text-neon-green">Skill</span>
              <span className="text-white">Bridge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form card */}
        <div className="neon-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              id="login-email"
              label="Email Address"
              type="email"
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              icon={<span className="text-xs">✉</span>}
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              icon={<span className="text-xs">🔒</span>}
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
              Sign In →
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
}
