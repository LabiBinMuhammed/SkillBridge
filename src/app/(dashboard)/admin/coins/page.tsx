import { createClient } from "@/lib/supabase/server";
import { CoinRequestsClient } from "@/components/admin/coins/CoinRequestsClient";

export default async function CoinsPage() {
  const supabase = await createClient();

  // Fetch pending requests
  const { data: pendingRequests } = await supabase
    .from("coin_redemptions")
    .select("*, student:profiles(full_name), reward:coin_rewards_catalog(title, icon, cost)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch history
  const { data: historyRequests } = await supabase
    .from("coin_redemptions")
    .select("*, student:profiles(full_name), reward:coin_rewards_catalog(title, icon, cost)")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Coin Requests</h1>
        <p className="text-muted-foreground mt-1">Review and manage student reward redemptions.</p>
      </div>

      <CoinRequestsClient
        pendingData={pendingRequests || []}
        historyData={historyRequests || []}
      />
    </div>
  );
}
