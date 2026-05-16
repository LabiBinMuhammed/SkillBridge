import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject_id");

  let query = supabase
    .from("weekly_study_plans")
    .select("*, subject:subjects(name, code)")
    .eq("teacher_id", user.id)
    .order("week_start", { ascending: false })
    .limit(20);

  if (subjectId) query = query.eq("subject_id", subjectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    subject_id, week_start, week_end,
    target_chapters, target_topics,
    target_pages_start, target_pages_end,
    planned_hours, notes
  } = body;

  if (!subject_id || !week_start || !week_end) {
    return NextResponse.json({ error: "subject_id, week_start, week_end are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("weekly_study_plans")
    .insert({
      subject_id,
      teacher_id: user.id,
      week_start,
      week_end,
      target_chapters: target_chapters || [],
      target_topics: target_topics || [],
      target_pages_start: target_pages_start || null,
      target_pages_end: target_pages_end || null,
      planned_hours: parseFloat(planned_hours) || 0,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plan: data });
}
