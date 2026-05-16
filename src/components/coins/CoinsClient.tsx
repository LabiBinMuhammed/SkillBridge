"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoinReward, CoinTransaction } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeTime } from "@/lib/utils";

interface CoinsClientProps {
  coins: number;
  catalog: CoinReward[];
  transactions: CoinTransaction[];
  redemptions: any[];
  studentId: string;
}

const categoryIcons: Record<string, string> = {
  campus: "🏫",
  digital: "💻",
  event: "🎪",
  privilege: "⭐",
};

export function CoinsClient({
  coins: initialCoins,
  catalog,
  transactions,
  redemptions,
  studentId,
}: CoinsClientProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [activeTab, setActiveTab] = useState<"redeem" | "history">("redeem");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(catalog.map((r) => r.category)))];

  const filteredCatalog = selectedCategory === "all"
    ? catalog
    : catalog.filter((r) => r.category === selectedCategory);

  async function handleRedeem(reward: CoinReward) {
    if (coins < reward.cost) return;
    setRedeeming(reward.id);
    const supabase = createClient();

    const { error } = await supabase.from("coin_redemptions").insert({
      student_id: studentId,
      reward_id: reward.id,
      coins_spent: reward.cost,
      status: "pending",
    });

    if (!error) {
      // Deduct coins from profile
      await supabase
        .from("profiles")
        .update({ coins: coins - reward.cost })
        .eq("id", studentId);

      setCoins((c) => c - reward.cost);
      setRedeemSuccess(`Successfully requested "${reward.title}"! Admin will approve soon.`);
      setTimeout(() => setRedeemSuccess(""), 5000);
    }

    setRedeeming(null);
  }

  return (
    <div className="space-y-6">
      {/* Coin balance */}
      <div
        className="p-6 rounded-2xl border text-center"
        style={{
          borderColor: "rgba(255,215,0,0.3)",
          background: "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,165,0,0.04) 100%)",
          boxShadow: "0 0 40px rgba(255,215,0,0.05)",
        }}
      >
        <div className="text-6xl mb-2">🪙</div>
        <p className="text-6xl font-black font-mono text-yellow-400">{coins.toLocaleString()}</p>
        <p className="text-muted-foreground mt-1">Total Coins Balance</p>

        <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm mx-auto">
          <div className="text-center">
            <p className="text-lg font-bold text-neon-green">
              {transactions.filter((t) => t.type === "earned" || t.type === "bonus").reduce((sum, t) => sum + t.amount, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-neon-red">
              {transactions.filter((t) => t.type === "redeemed").reduce((sum, t) => sum + t.amount, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Redeemed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{redemptions.length}</p>
            <p className="text-xs text-muted-foreground">Requests</p>
          </div>
        </div>
      </div>

      {redeemSuccess && (
        <div className="px-4 py-3 rounded-lg bg-neon-green/10 border border-neon-green/30 text-sm text-neon-green">
          ✓ {redeemSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-matrix-surface rounded-xl border border-matrix-border w-fit">
        {(["redeem", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
              activeTab === tab
                ? "bg-neon-green/15 text-neon-green border border-neon-green/30"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {tab === "redeem" ? "🎁 Redeem" : "📋 History"}
          </button>
        ))}
      </div>

      {activeTab === "redeem" && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all",
                  selectedCategory === cat
                    ? "bg-neon-green/15 text-neon-green border-neon-green/30"
                    : "border-matrix-border text-muted-foreground hover:text-white"
                )}
              >
                {cat !== "all" && categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((reward) => {
              const canAfford = coins >= reward.cost;
              return (
                <Card
                  key={reward.id}
                  className={cn(!canAfford && "opacity-60")}
                  hover={canAfford}
                >
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{reward.icon}</div>
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm font-bold"
                          style={{
                            color: "#FFD700",
                            borderColor: "rgba(255,215,0,0.3)",
                            background: "rgba(255,215,0,0.08)",
                          }}
                        >
                          <span>🪙</span> {reward.cost}
                        </div>
                        <Badge variant="gray">{reward.category}</Badge>
                      </div>
                    </div>

                    <h3 className="font-bold text-white mb-1">{reward.title}</h3>
                    {reward.description && (
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        {reward.description}
                      </p>
                    )}

                    <Button
                      variant={canAfford ? "solid" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => handleRedeem(reward)}
                      isLoading={redeeming === reward.id}
                      disabled={!canAfford || redeeming !== null}
                    >
                      {canAfford ? "Redeem →" : `Need ${reward.cost - coins} more coins`}
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <Card>
          <CardBody className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-4xl mb-2">🪙</p>
                <p>No transactions yet. Complete tasks to earn coins!</p>
              </div>
            ) : (
              <div className="divide-y divide-matrix-border">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0",
                        tx.type === "earned" || tx.type === "bonus"
                          ? "bg-neon-green/10 text-neon-green"
                          : "bg-neon-red/10 text-neon-red"
                      )}
                    >
                      {tx.type === "earned" || tx.type === "bonus" ? "↑" : "↓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(tx.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={cn(
                          "font-bold font-mono",
                          tx.type === "earned" || tx.type === "bonus"
                            ? "text-neon-green"
                            : "text-neon-red"
                        )}
                      >
                        {tx.type === "earned" || tx.type === "bonus" ? "+" : "-"}
                        {tx.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {tx.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
