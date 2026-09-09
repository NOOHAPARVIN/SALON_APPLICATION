import { createClient } from "@/utils/supabase/server";
import { getAdvancedReportingData } from "@/lib/dashboardData";
import StructuredDailyReport from "@/components/reports/StructuredDailyReport";

export default async function OwnerDailyReportPage({
  searchParams
}: {
  searchParams?: { branch?: string; staff?: string; companyId?: string }
}) {
  const branch = searchParams?.branch || 'all';
  const staff = searchParams?.staff || 'all';
  let companyId = searchParams?.companyId || null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    companyId = user.user_metadata?.company_id || null;
  }

  const advancedData = await getAdvancedReportingData(branch, 'day', staff, companyId);

  return (
    <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <StructuredDailyReport
          branch={branch}
          rawBookings={(advancedData?.allBookings as any[]) || []}
          giftCards={(advancedData?.allGiftCards as any[]) || []}
          userRole="owner"
        />
      </div>
    </div>
  );
}
