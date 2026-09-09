import { createClient } from "@/utils/supabase/server";
import { getDashboardData, getAdvancedReportingData, getAllReportingTimeframes } from "@/lib/dashboardData";
import Link from "next/link";
import RevenueSummary from "@/components/reports/RevenueSummary";

export default async function SummaryPage({ 
  searchParams 
}: { 
  searchParams?: { view?: string; branch?: string; staff?: string; service?: string; companyId?: string } 
}) {
  const view = searchParams?.view || 'month';
  const branch = searchParams?.branch || 'all';
  const staff = searchParams?.staff || 'all';
  const service = searchParams?.service || 'all';
  let companyId = searchParams?.companyId || null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isSuperAdmin = user?.user_metadata?.role === 'super_admin';

  // ENFORCE DATA ISOLATION
  if (user && !isSuperAdmin) {
    companyId = user.user_metadata?.company_id || null;
  }

  // Fetch data with branch, view, staff, companyId, and service filtering
  const data = await getDashboardData(branch, undefined, staff, companyId);
  const advancedData = await getAdvancedReportingData(branch, view, staff, companyId, service);
  const allTimeframes = await getAllReportingTimeframes(branch, staff, companyId, service);

  return (
    <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Revenue Summary</h1>
              <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2.5 py-0.5 rounded-full font-bold">● Excel Export & Financial Ledger</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Downloadable excel reports and financial revenue breakdown filtered by staff, location, timeframe, and service.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center">
              <Link href={`/dashboard/owner/summary?view=day&branch=${branch}&staff=${staff}&service=${service}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'day' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Day</Link>
              <Link href={`/dashboard/owner/summary?view=week&branch=${branch}&staff=${staff}&service=${service}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'week' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Week</Link>
              <Link href={`/dashboard/owner/summary?view=month&branch=${branch}&staff=${staff}&service=${service}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'month' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Month</Link>
              <Link href={`/dashboard/owner/summary?view=year&branch=${branch}&staff=${staff}&service=${service}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'year' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Year</Link>
            </div>
          </div>
        </div>

        {/* Dedicated Revenue Summary (RSummary) Component with Downloadable Excel & Staff/Location/Service Filters */}
        <RevenueSummary
          advancedData={advancedData}
          allTimeframes={allTimeframes}
          currentBranch={branch}
          currentStaff={staff}
          currentService={service}
          staffList={data.staffList || []}
          servicesList={advancedData?.servicesList || []}
          userRole="owner"
        />
      </div>
    </div>
  );
}
