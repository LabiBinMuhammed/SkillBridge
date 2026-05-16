import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoinsClient } from "@/components/coins/CoinsClient";

export const metadata = { title: "Coins & Rewards" };

export default async function CoinsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, catalogRes, txRes, redemptionsRes] = await Promise.all([
    supabase.from("profiles").select("coins, xp, level, rank").eq("id", user.id).single(),
    supabase.from("coin_rewards_catalog").select("*").eq("is_active", true).order("cost"),
    supabase
      .from("coin_transactions")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("coin_redemptions")
      .select("*, reward:coin_rewards_catalog(title, icon)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          🪙 Coins & <span className="text-neon-green">Rewards</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Earn coins by completing tasks. Redeem for real campus benefits.
        </p>
      </div>

      <CoinsClient
        coins={profileRes.data?.coins || 0}
        catalog={catalogRes.data || []}
        transactions={txRes.data || []}
        redemptions={redemptionsRes.data || []}
        studentId={user.id}
      />
    </div>
  );
}
