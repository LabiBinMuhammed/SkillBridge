import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabaseAdmin = await createServiceClient();

  const { createClient } = await import("@/lib/supabase/server");
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
    const { teachers } = await req.json();

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ error: "No teachers provided" }, { status: 400 });
    }

    // Fetch existing clubs to map by name
    const { data: existingClubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name");

    if (clubsError) {
      throw new Error(`Failed to fetch clubs: ${clubsError.message}`);
    }

    const clubMap = new Map<string, string>();
    existingClubs?.forEach((c) => {
      clubMap.set(c.name.toLowerCase().trim(), c.id);
    });

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[]
    };

    for (const teacher of teachers) {
      const { email, password, full_name, club, club_role } = teacher;

      if (!email || !password) {
        results.failed++;
        results.errors.push({ email: email || "Unknown", error: "Email and password are required" });
        continue;
      }

      let userId = null;

      // Create user via Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || email.split("@")[0],
          role: "teacher"
        },
      });

      if (authError) {
        if (authError.message.includes("already exists") || authError.message.includes("already registered")) {
          // Look up existing user
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === email);
          if (existingUser) {
            userId = existingUser.id;
          } else {
            results.failed++;
            results.errors.push({ email, error: "User exists but couldn't fetch ID" });
            continue;
          }
        } else {
          results.failed++;
          results.errors.push({ email, error: authError.message });
          continue;
        }
      } else {
        userId = authData.user.id;
      }

      // Force upsert profile
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        email,
        full_name: full_name || email.split("@")[0],
        role: "teacher"
      }, { onConflict: "id" });

      // Process club association if provided
      if (club && typeof club === "string") {
        const clubId = clubMap.get(club.toLowerCase().trim());
        const validRole = club_role === "mentor" || club_role === "assistant_mentor" ? club_role : "mentor";

        if (clubId) {
          const { error: assocError } = await supabaseAdmin
            .from("teacher_clubs")
            .upsert({
              teacher_id: userId,
              club_id: clubId,
              role: validRole
            }, { onConflict: "teacher_id, club_id" });

          if (assocError) {
            results.errors.push({ email, error: `Failed to assign club: ${assocError.message}` });
          }
        } else {
          results.errors.push({ email, error: `Club '${club}' not found in database. Teacher created but left unassigned.` });
        }
      }

      results.successful++;
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
