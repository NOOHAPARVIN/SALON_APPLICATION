import { redirect } from "next/navigation";

export default function ReportsPage({ searchParams }: { searchParams: { view?: string, branch?: string, staff?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.view) params.set('view', searchParams.view);
  if (searchParams.branch) params.set('branch', searchParams.branch);
  if (searchParams.staff) params.set('staff', searchParams.staff);
  
  const queryString = params.toString();
  redirect(`/dashboard/owner/summary${queryString ? `?${queryString}` : ''}`);
}
