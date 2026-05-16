import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalsClient } from "@/app/(dashboard)/teacher/approvals/ApprovalsClient";

export const metadata = { title: "Global Task Approvals" };

export default async function AdminApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${profile?.role || "login"}`);
  }

  // Admins see everything
  const { data } = await supabase
    .from("todo_approvals")
    .select("*, student:profiles(full_name, department)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingApprovals = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Global Task Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and manage all student task submissions across the platform.</p>
      </div>

      <ApprovalsClient initialData={pendingApprovals} />
    </div>
  );
}
