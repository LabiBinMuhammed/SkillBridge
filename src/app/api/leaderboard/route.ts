import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/leaderboard
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const sortBy = searchParams.get("sort") || "xp";

  const orderCol = sortBy === "coins" ? "coin_rank" : sortBy === "streak" ? "streak_rank" : "xp_rank";

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order(orderCol)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
