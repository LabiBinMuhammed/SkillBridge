import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };
  return { user, profile };
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // 1. Fetch redemption
  const { data: redemption, error: fetchErr } = await supabase
    .from("coin_redemptions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
  }

  if (redemption.status !== "pending") {
    return NextResponse.json({ error: "Redemption is not pending" }, { status: 400 });
  }

  // 2. Update status
  const { error: updateErr } = await supabase
    .from("coin_redemptions")
    .update({ status })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 3. Refund if rejected
  if (status === "rejected") {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", redemption.student_id)
      .single();

    if (!profileErr && profile) {
      const newBalance = profile.coins + redemption.coins_spent;

      await supabase
        .from("profiles")
        .update({ coins: newBalance })
        .eq("id", redemption.student_id);

      await supabase.from("coin_transactions").insert({
        student_id: redemption.student_id,
        type: "bonus",
        amount: redemption.coins_spent,
        balance_after: newBalance,
        description: "Refund for rejected reward redemption",
        reference_id: redemption.id,
        reference_type: "redemption_refund",
      });
    }
  }

  return NextResponse.json({ success: true, status });
}
