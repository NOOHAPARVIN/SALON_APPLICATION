import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import DashboardTopbar from "@/components/DashboardTopbar";
import { BranchProvider } from "@/lib/BranchContext";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = user.user_metadata?.role === 'super_admin' 
    ? 'super_admin' 
    : (profile?.role || "customer");

  return (
    <BranchProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-main)] font-['Montserrat']">
          <Sidebar role={role} />
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            <DashboardTopbar role={role} />
            <main className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)]">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BranchProvider>
  );
}
