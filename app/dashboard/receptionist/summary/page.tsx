import { redirect } from "next/navigation";

export default function ReceptionistSummaryPage({
  searchParams
}: {
  searchParams?: { branch?: string; staff?: string; companyId?: string }
}) {
  const params = new URLSearchParams();
  if (searchParams?.branch) params.set('branch', searchParams.branch);
  if (searchParams?.staff) params.set('staff', searchParams.staff);
  if (searchParams?.companyId) params.set('companyId', searchParams.companyId);

  const queryString = params.toString();
  redirect(`/dashboard/receptionist/daily-report${queryString ? `?${queryString}` : ''}`);
}
