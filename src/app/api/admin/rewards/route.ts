import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };
  return { user, profile };
}

// GET /api/admin/rewards
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("coin_rewards_catalog").select("*").order("cost");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/admin/rewards
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { title, description, icon, cost, category, stock } = body;
  if (!title || !cost) return NextResponse.json({ error: "title and cost required" }, { status: 400 });

  const { data, error } = await supabase
    .from("coin_rewards_catalog")
    .insert({
      title, description, icon: icon || "🎁", cost,
      category: category || "campus", is_active: true, stock: stock || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/admin/rewards
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase.from("coin_rewards_catalog").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
