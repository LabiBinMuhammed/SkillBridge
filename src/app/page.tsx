"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01アBCDEFGH";

function MatrixRain() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 text-neon-green font-mono text-sm leading-5"
          style={{
            left: `${i * 5.2}%`,
            animationDuration: `${8 + (i % 7)}s`,
            animationDelay: `${(i * 0.4) % 3}s`,
            animation: `matrix-fall ${8 + (i % 7)}s linear ${(i * 0.4) % 3}s infinite`,
          }}
        >
          {Array.from({ length: 30 }).map((_, j) => (
            <div
              key={j}
              style={{ opacity: 1 - j * 0.03 }}
            >
              {MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="neon-card p-6 group cursor-default">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-base font-bold text-neon-green mb-2 group-hover:glow-text-green transition-all">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Counter({ end, label }: { end: number; label: string }) {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let frame: number;
    const step = end / 60;
    const tick = () => {
      setCount((c) => {
        const next = Math.min(c + step, end);
        if (next < end) frame = requestAnimationFrame(tick);
        return Math.floor(next);
      });
    };
    const timer = setTimeout(() => { frame = requestAnimationFrame(tick); }, 300);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [end]);

  if (!mounted) return (
    <div className="text-center">
      <div className="text-4xl font-bold font-mono text-neon-green glow-text-green">
        0+
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <div className="text-center">
      <div className="text-4xl font-bold font-mono text-neon-green glow-text-green">
        {count.toLocaleString()}+
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <MatrixRain />

      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-green/3 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-neon-green/2 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center">
            <span className="text-[#050A05] font-black text-sm">SB</span>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-neon-green">Skill</span>
            <span className="text-white">Bridge</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="neon" size="sm">Admin / Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 text-xs font-semibold text-neon-green mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          Unified Campus Intelligence Engine
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 animate-fade-in-up">
          <span className="text-white">Bridge Your</span>
          <br />
          <span
            className="text-neon-green"
            style={{ textShadow: "0 0 40px rgba(0,255,65,0.6), 0 0 80px rgba(0,255,65,0.3)" }}
          >
            Dreams
          </span>
          <br />
          <span className="text-white">to Reality</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up">
          Transform your career goals into daily actions. Track academic progress in real-time.
          Earn rewards. Climb the leaderboard. All in one intelligent campus platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
          <Link href="/login">
            <Button variant="solid" size="lg" className="min-w-[180px]">
              Access Portal →
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mt-20">
          <Counter end={2500} label="Active Students" />
          <Counter end={48} label="Teachers" />
          <Counter end={1200} label="Skills Mastered" />
          <Counter end={85000} label="Tasks Completed" />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-3">
          One Platform. <span className="text-neon-green">Every System.</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Everything your campus needs, unified in a single intelligent ecosystem.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            icon="🎯"
            title="Dream-Skill Engine"
            desc="Map your 5 career dreams to skill trees. Every skill unlocks tasks that earn you real rewards."
          />
          <FeatureCard
            icon="📊"
            title="Academic Intelligence"
            desc="Real-time syllabus tracking with green/red indicators. Teachers log progress, students stay accountable."
          />
          <FeatureCard
            icon="⚡"
            title="Auto To-Do Engine"
            desc="Your daily task list generates itself — combining dreams, syllabus, and homework with smart prioritization."
          />
          <FeatureCard
            icon="🪙"
            title="Coin Economy"
            desc="Earn coins for every approved task. Redeem for library priority, event access, and campus privileges."
          />
        </div>
      </section>

      {/* Roles */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-12">
          Built for <span className="text-neon-green">Everyone</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              role: "Students",
              icon: "🎓",
              color: "#00FF41",
              points: [
                "Select 5 career dreams",
                "Daily auto-generated task list",
                "Earn XP, coins, and badges",
                "Track syllabus in real-time",
                "Climb the leaderboard",
              ],
            },
            {
              role: "Teachers",
              icon: "👨‍🏫",
              color: "#60A5FA",
              points: [
                "Upload weekly study plans",
                "Log daily syllabus progress",
                "Assign & track homework",
                "Approve student tasks",
                "Monitor class performance",
              ],
            },
            {
              role: "Admins",
              icon: "🏛️",
              color: "#F59E0B",
              points: [
                "Full campus analytics dashboard",
                "Manage coin reward catalog",
                "View all leaderboards",
                "Approve coin redemptions",
                "Monitor system health",
              ],
            },
          ].map((item) => (
            <div key={item.role} className="neon-card p-6" style={{ borderColor: `${item.color}22` }}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-4" style={{ color: item.color }}>
                {item.role}
              </h3>
              <ul className="space-y-2">
                {item.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span style={{ color: item.color }} className="mt-0.5 flex-shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification showcase */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="neon-card p-8 md:p-12 text-center">
          <h2 className="text-3xl font-black mb-4">
            Gamified <span className="text-neon-green">Campus Life</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Progress through ranks, earn badges, and compete on leaderboards — all while actually getting your work done.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { rank: "Novice", icon: "⚡", color: "#9CA3AF", xp: "0 XP" },
              { rank: "Explorer", icon: "🌱", color: "#60A5FA", xp: "500 XP" },
              { rank: "Specialist", icon: "💎", color: "#A78BFA", xp: "2K XP" },
              { rank: "Master", icon: "🔥", color: "#F59E0B", xp: "5K XP" },
              { rank: "Grandmaster", icon: "👑", color: "#00FF41", xp: "10K XP" },
            ].map((r) => (
              <div
                key={r.rank}
                className="p-4 rounded-xl border text-center"
                style={{ borderColor: `${r.color}33`, background: `${r.color}08` }}
              >
                <div className="text-3xl mb-2">{r.icon}</div>
                <div className="text-sm font-bold" style={{ color: r.color }}>{r.rank}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.xp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-black mb-4">
          Ready to Bridge Your{" "}
          <span className="text-neon-green glow-text-green">Skills?</span>
        </h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of students already transforming their campus experience.
        </p>
        <Link href="/login">
          <Button variant="solid" size="lg" className="animate-pulse-glow">
            🚀 Access Portal
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-matrix-border py-8 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 Skill Bridge — Unified Campus Intelligence Engine
        </p>
      </footer>
    </main>
  );
}
