import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };
  return { user, profile };
}

// GET /api/admin/tasks?skill_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skill_id");

  let query = supabase.from("tasks").select("*, skill:skills(name, icon, dream:dreams(name))").order("order_index");
  if (skillId) query = query.eq("skill_id", skillId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/admin/tasks
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const {
    skill_id, title, description, instructions,
    estimated_minutes, difficulty, xp_reward, coin_reward, energy_reward,
    requires_submission, requires_quiz, order_index,
  } = body;

  if (!skill_id || !title) return NextResponse.json({ error: "skill_id and title required" }, { status: 400 });

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      skill_id, title, description, instructions,
      estimated_minutes: estimated_minutes || 30,
      difficulty: difficulty || 1,
      xp_reward: xp_reward || 25,
      coin_reward: coin_reward || 5,
      energy_reward: energy_reward || 10,
      requires_submission: requires_submission || false,
      requires_quiz: requires_quiz || false,
      order_index: order_index || 0,
      is_system: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/admin/tasks
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
