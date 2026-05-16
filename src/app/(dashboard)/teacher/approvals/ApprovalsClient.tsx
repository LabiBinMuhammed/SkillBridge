"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ApprovalsClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch("/api/teacher/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (res.ok) {
        setData((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } else {
        const errData = await res.json();
        console.error("Failed to process approval", errData);
        alert(errData.error || "Failed to process approval");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    }
    setProcessing(null);
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold text-white flex items-center gap-2">
          <span>🔔</span> Pending Mentee Approvals
        </h2>
      </CardHeader>
      <CardBody>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-matrix-border bg-matrix-surface">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.student?.full_name}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-matrix-border">
                      {item.student?.department || "Student"}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{item.title}</p>
                  <p className="text-xs text-yellow-400 mt-1 font-bold">🪙 {item.coin_reward} Coins</p>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neon-red text-neon-red hover:bg-neon-red/10"
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={processing === item.id}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    className="bg-neon-green hover:bg-neon-green/90 text-black border-neon-green"
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={processing === item.id}
                    isLoading={processing === item.id}
                  >
                    Approve & Award
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-4">✅</p>
            <p>All caught up! No pending approvals for your mentees.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
