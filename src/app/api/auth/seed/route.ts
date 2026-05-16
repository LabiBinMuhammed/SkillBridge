import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/auth/seed — Create the demo admin user
export async function GET() {
  try {
    const supabase = await createServiceClient();

    const adminEmail = "admin@skillbridge.com";
    const adminPassword = "admin123";

    // Check if admin already exists by querying profiles table
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", adminEmail)
      .single();

    if (existingProfile) {
      // Update password in case it changed
      await supabase.auth.admin.updateUserById(existingProfile.id, {
        password: adminPassword,
      });

      // Ensure profile role is correct
      await supabase
        .from("profiles")
        .update({ role: "admin", is_onboarded: true })
        .eq("id", existingProfile.id);

      return NextResponse.json({
        message: "Admin user already exists, password updated",
        email: adminEmail,
        password: adminPassword,
      });
    }

    // Create the admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin",
      },
    });

    let adminId = newUser?.user?.id;

    if (createError) {
      // If error is because user already exists (often "Database error saving new user" or similar unique constraint)
      // We must find the user in auth.users
      const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existingAuthUser = allUsers?.users?.find((u) => u.email === adminEmail);
      
      if (existingAuthUser) {
        adminId = existingAuthUser.id;
        // Update their password
        await supabase.auth.admin.updateUserById(adminId, { password: adminPassword });
      } else {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }

    // Ensure profile row exists
    if (adminId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: adminId,
        email: adminEmail,
        full_name: "Admin",
        role: "admin",
        is_onboarded: true,
      }, { onConflict: "id" });

      if (profileError) {
         return NextResponse.json({ error: "Profile creation failed: " + profileError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      email: adminEmail,
      password: adminPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
