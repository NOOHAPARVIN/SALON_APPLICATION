"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useBranch } from "@/lib/BranchContext";
import React from "react";

interface ReportsLocationFilterProps {
  currentBranch: string;
  currentStaff?: string;
  currentService?: string;
  tab?: string;
  view?: string;
  staffList?: { id: number | string; name: string }[];
  servicesList?: { id?: number | string; name: string; title?: string }[];
}

export default function ReportsLocationFilter({ 
  currentBranch, 
  currentStaff = "all", 
  currentService = "all",
  tab = "", 
  view = "day", 
  staffList = [],
  servicesList = []
}: ReportsLocationFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const { setCurrentBranch, branchesForCurrentCompany } = useBranch();

  const updateFilters = (newBranch: string, newStaff: string, newService: string) => {
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (companyId) params.set("companyId", companyId);
    params.set("view", view);
    params.set("branch", newBranch);
    params.set("staff", newStaff);
    params.set("service", newService);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCurrentBranch(selected);
    updateFilters(selected, "all", currentService);
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStaff = e.target.value;
    updateFilters(currentBranch, selectedStaff, currentService);
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedService = e.target.value;
    updateFilters(currentBranch, currentStaff, selectedService);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Location Dropdown */}
      <select 
        value={currentBranch}
        onChange={handleLocationChange}
        className="border border-gray-200 bg-white text-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 focus:outline-none focus:border-[#5c54b6] cursor-pointer shadow-sm"
      >
        <option value="all">All branches</option>
        {branchesForCurrentCompany.map((b) => (
          <option key={b.id} value={b.slug}>{b.name}</option>
        ))}
      </select>

      {/* Staff Dropdown */}
      <select 
        value={currentStaff}
        onChange={handleStaffChange}
        className="border border-gray-200 bg-white text-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 focus:outline-none focus:border-[#5c54b6] cursor-pointer shadow-sm max-w-[150px] truncate"
      >
        <option value="all">All staff</option>
        {staffList.map((s) => (
          <option key={s.id} value={String(s.id)}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Service Dropdown */}
      <select 
        value={currentService}
        onChange={handleServiceChange}
        className="border border-gray-200 bg-white text-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 focus:outline-none focus:border-[#5c54b6] cursor-pointer shadow-sm max-w-[170px] truncate"
      >
        <option value="all">All services</option>
        {servicesList.map((srv, idx) => {
          const srvName = srv.name || srv.title || String(srv);
          return (
            <option key={srv.id || idx} value={srvName}>
              {srvName}
            </option>
          );
        })}
      </select>
    </div>
  );
}
