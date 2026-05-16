import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { RarityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Badges" };

const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [earnedRes, allBadgesRes] = await Promise.all([
    supabase
      .from("student_badges")
      .select("*, badge:badges(*)")
      .eq("student_id", user.id)
      .order("earned_at", { ascending: false }),
    supabase.from("badges").select("*"),
  ]);

  const earned = earnedRes.data || [];
  const allBadges = allBadgesRes.data || [];
  const earnedIds = new Set(earned.map((e: any) => e.badge_id));

  const sortedEarned = [...earned].sort((a: any, b: any) =>
    (rarityOrder[a.badge?.rarity as keyof typeof rarityOrder] || 4) -
    (rarityOrder[b.badge?.rarity as keyof typeof rarityOrder] || 4)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          🏅 My <span className="text-neon-green">Badges</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {earned.length} of {allBadges.length} badges earned
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,255,65,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(earned.length / Math.max(allBadges.length, 1)) * 100}%`,
            background: "linear-gradient(90deg, #009922, #00FF41)",
            boxShadow: "0 0 10px rgba(0,255,65,0.5)",
          }}
        />
      </div>

      {/* Earned badges */}
      {sortedEarned.length > 0 && (
        <div>
          <h2 className="font-bold text-white mb-4">Earned Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedEarned.map((sb: any) => {
              const rarityConfig = {
                legendary: "#00FF41",
                epic: "#F59E0B",
                rare: "#A78BFA",
                uncommon: "#60A5FA",
                common: "#9CA3AF",
              };
              const color = rarityConfig[sb.badge?.rarity as keyof typeof rarityConfig] || "#9CA3AF";

              return (
                <div
                  key={sb.id}
                  className="p-4 rounded-xl border text-center transition-all hover:-translate-y-1"
                  style={{
                    borderColor: `${color}33`,
                    background: `${color}08`,
                    boxShadow: `0 0 15px ${color}10`,
                  }}
                >
                  <div className="text-4xl mb-3">{sb.badge?.icon || "🏅"}</div>
                  <h3 className="font-bold text-sm text-white mb-1">{sb.badge?.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {sb.badge?.description}
                  </p>
                  <RarityBadge rarity={sb.badge?.rarity} />
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(sb.earned_at)}</p>
                  {(sb.badge?.xp_bonus > 0 || sb.badge?.coin_bonus > 0) && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {sb.badge?.xp_bonus > 0 && (
                        <span className="text-xs text-neon-green">+{sb.badge.xp_bonus} XP</span>
                      )}
                      {sb.badge?.coin_bonus > 0 && (
                        <span className="text-xs text-yellow-400">+{sb.badge.coin_bonus}🪙</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      <div>
        <h2 className="font-bold text-white mb-4">Locked Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allBadges
            .filter((b: any) => !earnedIds.has(b.id))
            .map((badge: any) => (
              <div
                key={badge.id}
                className="p-4 rounded-xl border border-matrix-border text-center opacity-40 grayscale"
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-bold text-sm text-white mb-1">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                <RarityBadge rarity={badge.rarity} />
                <p className="text-xs text-muted-foreground mt-2">🔒 Locked</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
