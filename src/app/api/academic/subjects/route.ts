import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("subjects")
    .select("*, daily_progress(status, lag_percentage, date, actual_hours)")
    .eq("teacher_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subjects: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department")
    .eq("id", user.id)
    .single();

  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, code, department, semester, total_hours } = body;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      name: name.trim(),
      code: code?.trim() || null,
      department: department || profile.department,
      semester: parseInt(semester) || 1,
      teacher_id: user.id,
      total_hours: parseInt(total_hours) || 60,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subject: data });
}
