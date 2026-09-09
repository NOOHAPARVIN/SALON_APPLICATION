import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { FaChartBar, FaDownload } from "react-icons/fa";
import { getDashboardData, getAdvancedReportingData, getAllReportingTimeframes } from "@/lib/dashboardData";
import Link from "next/link";
import OverviewTab from "@/components/reports/OverviewTab";
import BusinessTab from "@/components/reports/BusinessTab";
import ActivityTab from "@/components/reports/ActivityTab";
import DetailedReportsTab from "@/components/reports/DetailedReportsTab";
import ReportsLocationFilter from "@/components/reports/ReportsLocationFilter";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";

export default async function OwnerDashboard({ searchParams }: { searchParams?: { view?: string, branch?: string, staff?: string, companyId?: string } }) {
  const view = searchParams?.view || 'month';
  const branch = searchParams?.branch || 'all';
  const staff = searchParams?.staff || 'all';
  let companyId = searchParams?.companyId || null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isSuperAdmin = user?.user_metadata?.role === 'super_admin';

  // ENFORCE DATA ISOLATION
  if (user) {
    if (!isSuperAdmin) {
      companyId = user.user_metadata?.company_id || null;
    }
  }

  // If Super Admin is in Global Overview mode (no specific company selected), show Platform Overview Dashboard
  if (isSuperAdmin && !companyId) {
    const { data: companies } = await supabaseAdmin.from('companies').select('*');
    const { data: branches } = await supabaseAdmin.from('branches').select('*');
    const { data: bookings } = await supabaseAdmin.from('bookings').select('*');
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();

    return (
      <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
        <div className="max-w-7xl mx-auto">
          <SuperAdminDashboard
            companies={companies || []}
            branches={branches || []}
            users={usersData?.users || []}
            bookings={bookings || []}
          />
        </div>
      </div>
    );
  }

  // Fetch real data with branch and staff filtering securely isolated to the company
  const data = await getDashboardData(branch, undefined, staff, companyId);
  const advancedData = await getAdvancedReportingData(branch, view, staff, companyId);
  const allTimeframes = await getAllReportingTimeframes(branch, staff, companyId);

  return (
    <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header & Global Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Owner Dashboard</h1>
              <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2.5 py-0.5 rounded-full font-bold">● Live</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">Real-time financial analytics, staff productivity, and booking intelligence.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center">
              <Link href={`/dashboard/owner?view=day&branch=${branch}&staff=${staff}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'day' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Day</Link>
              <Link href={`/dashboard/owner?view=week&branch=${branch}&staff=${staff}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'week' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Week</Link>
              <Link href={`/dashboard/owner?view=month&branch=${branch}&staff=${staff}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'month' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Month</Link>
              <Link href={`/dashboard/owner?view=year&branch=${branch}&staff=${staff}&companyId=${companyId || ''}`} className={`px-4 py-2 text-xs font-semibold transition-colors ${view === 'year' ? 'bg-[#5c54b6] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Year</Link>
            </div>

            {/* Location & Staff Filters */}
            <ReportsLocationFilter currentBranch={branch} currentStaff={staff} view={view} staffList={data.staffList || []} />
          </div>
        </div>

        {/* Merged Reports & Analytics Suite */}
        <div className="space-y-12 pb-12">
          {/* Section 1: Detailed Executive Overview */}
          <div className="border-t border-gray-200 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Executive Financial Overview</h2>
                <p className="text-sm text-gray-400">Deep-dive KPI metrics, revenue performance, and service rankings</p>
              </div>
            </div>
            <OverviewTab data={data} advancedData={advancedData} allTimeframes={allTimeframes} />
          </div>

          {/* Section 2: Business & Revenue Breakdown */}
          <div className="border-t border-gray-200 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Business & Revenue Breakdown</h2>
                <p className="text-sm text-gray-400">Revenue performance, cash vs card split, and discount reductions</p>
              </div>
            </div>
            <BusinessTab advancedData={advancedData} allTimeframes={allTimeframes} />
          </div>

          {/* Section 3: Activity & Staff Productivity */}
          <div className="border-t border-gray-200 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Activity & Staff Productivity</h2>
                <p className="text-sm text-gray-400">Appointment metrics, client retention, and booking hours utilization</p>
              </div>
            </div>
            <ActivityTab advancedData={advancedData} allTimeframes={allTimeframes} />
          </div>

          {/* Section 4: Detailed Ledger & Reports */}
          <div className="border-t border-gray-200 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Detailed Ledger & Reports</h2>
                <p className="text-sm text-gray-400">Granular transaction logs and cancellation breakdowns</p>
              </div>
            </div>
            <DetailedReportsTab advancedData={advancedData} />
          </div>
        </div>
      </div>
    </div>
  );
}
