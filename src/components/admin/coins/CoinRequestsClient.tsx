"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface RedemptionRow {
  id: string;
  student_id: string;
  reward_id: string;
  coins_spent: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  student?: { full_name: string };
  reward?: { title: string; icon: string; cost: number };
}

export function CoinRequestsClient({ 
  pendingData,
  historyData 
}: { 
  pendingData: RedemptionRow[];
  historyData: RedemptionRow[];
}) {
  const [data, setData] = useState(pendingData);
  const [history, setHistory] = useState(historyData);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [loadingAction, setLoadingAction] = useState<{ id: string; type: "approved" | "rejected" } | null>(null);
  const router = useRouter();

  async function handleAction(id: string, status: "approved" | "rejected") {
    setLoadingAction({ id, type: status });
    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const item = data.find((r) => r.id === id);
        if (item) {
          setData(data.filter((r) => r.id !== id));
          setHistory([{ ...item, status }, ...history]);
        }
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process request");
      }
    } catch (e) {
      alert("Network error occurred.");
    }
    setLoadingAction(null);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-matrix-surface rounded-xl border border-matrix-border w-fit">
        {(["pending", "history"] as const).map((tab) => (
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
            {tab === "pending" ? "Pending Requests" : "History"}
            {tab === "pending" && data.length > 0 && (
              <span className="ml-2 bg-neon-green text-black px-1.5 py-0.5 rounded-full text-xs">
                {data.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "pending" && (
        <>
          {data.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center text-muted-foreground">
                <p className="text-4xl mb-4">✨</p>
                <p>No pending coin requests.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.map((req) => (
                <Card key={req.id}>
                  <CardBody className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-white">{req.student?.full_name || "Unknown Student"}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(req.created_at)}</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-6 bg-matrix-surface rounded-xl border border-matrix-border mb-4">
                      <span className="text-4xl mb-2">{req.reward?.icon || "🎁"}</span>
                      <p className="font-bold text-center px-4">{req.reward?.title || "Unknown Reward"}</p>
                      <p className="text-sm text-yellow-400 font-bold mt-1">🪙 {req.coins_spent} spent</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button
                        variant="outline"
                        className="text-neon-red border-neon-red hover:bg-neon-red/10"
                        onClick={() => handleAction(req.id, "rejected")}
                        disabled={loadingAction !== null}
                        isLoading={loadingAction?.id === req.id && loadingAction?.type === "rejected"}
                      >
                        Reject & Refund
                      </Button>
                      <Button
                        variant="solid"
                        className="bg-neon-green text-black hover:bg-neon-green/90"
                        onClick={() => handleAction(req.id, "approved")}
                        disabled={loadingAction !== null}
                        isLoading={loadingAction?.id === req.id && loadingAction?.type === "approved"}
                      >
                        Approve
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <Card>
          <CardBody className="p-0">
            {history.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No history found.</p>
              </div>
            ) : (
              <div className="divide-y divide-matrix-border">
                {history.map((req) => (
                  <div key={req.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="text-3xl">{req.reward?.icon || "🎁"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {req.student?.full_name} <span className="font-normal text-muted-foreground">requested</span> {req.reward?.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(req.created_at)} • {req.coins_spent} 🪙
                      </p>
                    </div>
                    <div>
                      {req.status === "approved" ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <Badge variant="danger">Rejected</Badge>
                      )}
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
