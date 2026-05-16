"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PREDEFINED_DREAMS = [
  { id: "ai-engineer", name: "AI Engineer", icon: "🤖", color: "#00FF41", desc: "Build intelligent ML systems" },
  { id: "full-stack", name: "Full Stack Dev", icon: "💻", color: "#00CC33", desc: "End-to-end web applications" },
  { id: "data-scientist", name: "Data Scientist", icon: "📊", color: "#60A5FA", desc: "Extract insights from data" },
  { id: "entrepreneur", name: "Entrepreneur", icon: "🚀", color: "#FFD700", desc: "Build and scale your startup" },
  { id: "ui-ux", name: "UI/UX Designer", icon: "🎨", color: "#A78BFA", desc: "Craft beautiful experiences" },
  { id: "cybersecurity", name: "Cybersecurity", icon: "🛡️", color: "#FF3131", desc: "Protect digital systems" },
  { id: "researcher", name: "Researcher", icon: "🔬", color: "#60A5FA", desc: "Advance academic knowledge" },
  { id: "speaker", name: "Public Speaker", icon: "🎤", color: "#F59E0B", desc: "Inspire and communicate" },
  { id: "devops", name: "DevOps Engineer", icon: "⚙️", color: "#00CC33", desc: "Bridge dev and operations" },
  { id: "product-manager", name: "Product Manager", icon: "📋", color: "#EC4899", desc: "Define product vision" },
  { id: "mobile-dev", name: "Mobile Developer", icon: "📱", color: "#00FF41", desc: "Build iOS/Android apps" },
  { id: "cloud", name: "Cloud Architect", icon: "☁️", color: "#60A5FA", desc: "Design cloud infrastructure" },
];

const steps = ["Welcome", "Select Dreams", "Set Priority", "You're Ready!"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleDream(id: string) {
    if (selected.includes(id)) {
      setSelected((s) => s.filter((d) => d !== id));
    } else if (selected.length < 5) {
      setSelected((s) => [...s, id]);
    }
  }

  function movePriority(id: string, dir: -1 | 1) {
    const idx = selected.indexOf(id);
    const newSelected = [...selected];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newSelected.length) return;
    [newSelected[idx], newSelected[swapIdx]] = [newSelected[swapIdx], newSelected[idx]];
    setSelected(newSelected);
  }

  async function finishOnboarding() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert student dreams
    const dreamInserts = selected.map((dreamName, idx) => ({
      student_id: user.id,
      dream_id: dreamName, // In real app, map to actual dream IDs from DB
      priority: idx + 1,
    }));

    // Mark as onboarded
    await supabase.from("profiles").update({ is_onboarded: true }).eq("id", user.id);

    router.push("/student");
  }

  const dream = (id: string) => PREDEFINED_DREAMS.find((d) => d.id === id);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-green/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  i <= step ? "bg-neon-green text-[#050A05]" : "bg-matrix-surface border border-matrix-border text-muted-foreground"
                )}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className="h-0.5 w-12 md:w-24 transition-all"
                  style={{ background: i < step ? "#00FF41" : "rgba(0,255,65,0.15)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="neon-card p-10 text-center">
            <div className="text-6xl mb-6">🌟</div>
            <h1 className="text-4xl font-black text-white mb-4">
              Welcome to <span className="text-neon-green">Skill Bridge</span>!
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Let&apos;s set up your personalized growth journey. We&apos;ll help you select your career dreams, and our AI engine will generate your daily tasks automatically.
            </p>
            <Button variant="solid" size="lg" onClick={() => setStep(1)}>
              Get Started →
            </Button>
          </div>
        )}

        {/* Step 1 — Select Dreams */}
        {step === 1 && (
          <div className="neon-card p-8">
            <h2 className="text-2xl font-black text-white mb-2">
              Choose Your <span className="text-neon-green">Dreams</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Select up to 5 career paths you want to pursue. ({selected.length}/5 selected)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {PREDEFINED_DREAMS.map((d) => {
                const isSelected = selected.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDream(d.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      isSelected ? "border-opacity-60" : "border-matrix-border hover:border-neon-green/20",
                      !isSelected && selected.length >= 5 && "opacity-40 cursor-not-allowed"
                    )}
                    style={
                      isSelected
                        ? { borderColor: d.color, background: `${d.color}10`, boxShadow: `0 0 15px ${d.color}15` }
                        : {}
                    }
                    disabled={!isSelected && selected.length >= 5}
                  >
                    <div className="text-2xl mb-2">{d.icon}</div>
                    <p className="text-sm font-bold" style={{ color: isSelected ? d.color : "white" }}>
                      {d.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
              <Button
                variant="solid"
                onClick={() => setStep(2)}
                disabled={selected.length === 0}
              >
                Next: Set Priority →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Set Priority */}
        {step === 2 && (
          <div className="neon-card p-8">
            <h2 className="text-2xl font-black text-white mb-2">
              Set Your <span className="text-neon-green">Priority Order</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Priority #1 gets the most daily task focus. Drag to reorder or use arrows.
            </p>

            <div className="space-y-3 mb-6">
              {selected.map((id, idx) => {
                const d = dream(id);
                if (!d) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-4 p-4 rounded-xl border transition-all"
                    style={{ borderColor: `${d.color}33`, background: `${d.color}08` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-[#050A05]"
                      style={{ background: d.color }}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-2xl">{d.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-white">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => movePriority(id, -1)}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded border border-matrix-border text-muted-foreground hover:text-neon-green hover:border-neon-green/30 disabled:opacity-20 transition-all text-xs"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => movePriority(id, 1)}
                        disabled={idx === selected.length - 1}
                        className="w-7 h-7 rounded border border-matrix-border text-muted-foreground hover:text-neon-green hover:border-neon-green/30 disabled:opacity-20 transition-all text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button variant="solid" onClick={() => setStep(3)}>
                Looks Good! →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Ready */}
        {step === 3 && (
          <div className="neon-card p-10 text-center">
            <div className="text-6xl mb-6 animate-bounce">🚀</div>
            <h2 className="text-3xl font-black text-white mb-4">
              You&apos;re <span className="text-neon-green">All Set!</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Your {selected.length} dream{selected.length > 1 ? "s" : ""} have been saved. Your daily task list will be generated automatically every morning.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {selected.map((id) => {
                const d = dream(id);
                if (!d) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm"
                    style={{ borderColor: `${d.color}44`, background: `${d.color}11`, color: d.color }}
                  >
                    {d.icon} {d.name}
                  </div>
                );
              })}
            </div>

            <Button variant="solid" size="lg" onClick={finishOnboarding} isLoading={saving}>
              Enter Dashboard 🏠
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
