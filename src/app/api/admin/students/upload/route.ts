import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabaseAdmin = await createServiceClient();

  // Very basic auth check using service client is tricky because it has admin privileges,
  // so we should check the user token from the request header/cookies if we want strict security.
  // We can instantiate a normal client for auth check.
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
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "No students provided" }, { status: 400 });
    }

    // Fetch existing clubs to map by name
    const { data: existingClubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name");

    if (clubsError) {
      throw new Error(`Failed to fetch clubs: ${clubsError.message}`);
    }

    // Map club names (case-insensitive) to IDs
    const clubMap = new Map<string, string>();
    existingClubs?.forEach((c) => {
      clubMap.set(c.name.toLowerCase().trim(), c.id);
    });

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[]
    };

    for (const student of students) {
      const { email, password, full_name, roll_number, class: className, clubs } = student;

      if (!email || !password) {
        results.failed++;
        results.errors.push({ email: email || "Unknown", error: "Email and password are required" });
        continue;
      }

      // Create user via Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || email.split("@")[0],
          role: "student",
          roll_number: roll_number || null,
          department: className || null,
        },
      });

      if (authError) {
        results.failed++;
        results.errors.push({ email, error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Force upsert profile to bypass any potential trigger failures
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        email,
        full_name: full_name || email.split("@")[0],
        role: "student",
        roll_number: roll_number || null,
        department: className || null,
      }, { onConflict: "id" });

      // Process clubs association
      
      if (clubs && typeof clubs === "string") {
        const clubNames = clubs.split(",").map(c => c.trim()).filter(Boolean);
        const clubIdsToAssign = clubNames
          .map(name => clubMap.get(name.toLowerCase()))
          .filter(Boolean) as string[];

        if (clubIdsToAssign.length > 0) {
          // Add to student_clubs
          const clubInserts = clubIdsToAssign.map(club_id => ({
            student_id: userId,
            club_id
          }));

          const { error: assocError } = await supabaseAdmin
            .from("student_clubs")
            .insert(clubInserts);

          if (assocError) {
            console.error(`Error assigning clubs to ${email}:`, assocError);
            // We don't fail the whole user creation for this, just log it
          }
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
