import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subject_id");

  let query = supabase
    .from("cce_assignments")
    .select("*, subject:subjects(name, code), homework_submissions(id, status, student_id)")
    .eq("teacher_id", user.id)
    .order("due_date", { ascending: true });

  if (subjectId) query = query.eq("subject_id", subjectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject_id, title, description, type, due_date, max_marks } = body;

  if (!subject_id || !title || !due_date) {
    return NextResponse.json({ error: "subject_id, title, due_date are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cce_assignments")
    .insert({
      subject_id,
      teacher_id: user.id,
      title: title.trim(),
      description: description || null,
      type: type || "homework",
      due_date,
      max_marks: parseInt(max_marks) || 10,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, submitted_count } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("cce_assignments")
    .update({ submitted_count })
    .eq("id", id)
    .eq("teacher_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
