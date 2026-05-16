import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, action } = await req.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get the approval record
    const { data: approval, error: fetchError } = await supabase
      .from("todo_approvals")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (fetchError || !approval) {
      return NextResponse.json({ error: "Approval request not found or already processed" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update the approval status
    const { error: updateError } = await supabase
      .from("todo_approvals")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    if (action === "approve") {
      // Fetch current coins
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", approval.student_id)
        .single();

      if (studentProfile) {
        const newBalance = studentProfile.coins + approval.coin_reward;

        // Update profile coins and create transaction
        await Promise.all([
          supabase.from("profiles").update({ coins: newBalance }).eq("id", approval.student_id),
          supabase.from("coin_transactions").insert({
            student_id: approval.student_id,
            type: "earned",
            amount: approval.coin_reward,
            balance_after: newBalance,
            description: `Mentor Approved: ${approval.title}`,
            reference_id: approval.todo_item_id,
            reference_type: "mentor_approval",
          })
        ]);
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error("Teacher approval API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
