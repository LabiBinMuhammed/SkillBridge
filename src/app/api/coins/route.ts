import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/coins?studentId=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/coins — award coins
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { studentId, amount, description, type = "earned", referenceId, referenceType } = body;

  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", studentId)
    .single();

  if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const newBalance = profile.coins + amount;

  const [txResult] = await Promise.all([
    supabase.from("coin_transactions").insert({
      student_id: studentId,
      type,
      amount,
      balance_after: newBalance,
      description,
      reference_id: referenceId,
      reference_type: referenceType,
    }),
    supabase.from("profiles").update({ coins: newBalance }).eq("id", studentId),
  ]);

  if (txResult.error) return NextResponse.json({ error: txResult.error.message }, { status: 500 });
  return NextResponse.json({ success: true, newBalance });
}
