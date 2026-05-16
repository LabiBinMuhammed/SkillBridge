import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { clubs } = await req.json();

    if (!Array.isArray(clubs) || clubs.length === 0) {
      return NextResponse.json({ error: "No clubs provided" }, { status: 400 });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as { name: string; error: string }[]
    };

    for (const club of clubs) {
      const { name, description, icon, color } = club;

      if (!name) {
        results.failed++;
        results.errors.push({ name: "Unknown", error: "Name is required" });
        continue;
      }

      const { error } = await supabase
        .from("clubs")
        .insert({
          name: name.trim(),
          description: description || null,
          icon: icon || "🏢",
          color: color || "#00FF41"
        });

      if (error) {
        // If error is unique violation, it means club exists, we can treat it as failed but with clear error
        results.failed++;
        results.errors.push({ name, error: error.message });
      } else {
        results.successful++;
      }
    }

    return NextResponse.json({
      message: "Upload completed",
      results
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
