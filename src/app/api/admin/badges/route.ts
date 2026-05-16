import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };
  return { user, profile };
}

// GET /api/admin/badges
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("badges").select("*").order("condition_value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/admin/badges
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { name, description, icon, rarity, xp_bonus, coin_bonus, condition_type, condition_value } = body;
  if (!name || !description) return NextResponse.json({ error: "name and description required" }, { status: 400 });

  const { data, error } = await supabase
    .from("badges")
    .insert({
      name, description, icon: icon || "🏅", rarity: rarity || "common",
      xp_bonus: xp_bonus || 0, coin_bonus: coin_bonus || 0,
      condition_type: condition_type || "tasks_completed", condition_value: condition_value || 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/admin/badges
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("badges").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
