import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/student";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Get user role to redirect properly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_onboarded")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        const redirectPath =
          !profile.is_onboarded && profile.role === "student"
            ? "/student/onboarding"
            : `/${profile.role}`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
