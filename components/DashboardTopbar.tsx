"use client";

import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useBranch } from "@/lib/BranchContext";
import { useSidebar } from "@/components/SidebarContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface TopbarProps {
  role: string;
}

export default function DashboardTopbar({ role }: TopbarProps) {
  const [name, setName] = useState<string>("User");
  const { currentCompanyId, setCurrentCompanyId, companies, availableBranches } = useBranch();
  const { isOpen, setIsOpen } = useSidebar();
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function getUserInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      } else if (user?.email) {
        setName(user.email.split("@")[0]);
      }
    }
    getUserInfo();
  }, []);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>(searchParams.get("staff") || "all");

  useEffect(() => {
    setSelectedStaff(searchParams.get("staff") || "all");
  }, [searchParams]);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const branchParam = searchParams.get("branch") || "all";
        const companyParam = currentCompanyId || searchParams.get("companyId") || "";
        const url = `/api/staff?branch=${branchParam}${companyParam ? `&companyId=${companyParam}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff.filter((s: any) => s.is_active !== false));
        }
      } catch (e) {
        console.error("Error fetching staff for topbar:", e);
      }
    }
    fetchStaff();
  }, [currentCompanyId, searchParams]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompanyId = e.target.value;
    setCurrentCompanyId(newCompanyId);
    
    // Push new branch to URL so server components re-fetch
    const companyBranches = availableBranches.filter(b => b.company_id === newCompanyId);
    const branchQuery = companyBranches.length > 0 ? companyBranches[0].slug : 'all';
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('branch', branchQuery);
    params.set('companyId', newCompanyId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStaff(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("staff");
    } else {
      params.set("staff", val);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-8 text-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-500 hover:text-[#ff6b35] transition-colors p-2 rounded-lg hover:bg-gray-50 flex items-center justify-center"
        >
          <FaBars className="text-xl" />
        </button>
        
        {(role === 'owner' || role === 'super_admin' || role === 'receptionist') && (
          <div className="hidden md:flex gap-4">
            {role === 'super_admin' ? (
              <select 
                value={currentCompanyId || ""}
                onChange={handleCompanyChange}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#3a4a35] focus:outline-none focus:border-[#ff6b35] transition-colors appearance-none cursor-pointer shadow-sm"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="">All Companies (Overview)</option>
              </select>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-[#5c54b6] shadow-sm flex items-center">
                {companies.find(c => String(c.id) === String(currentCompanyId))?.name || (companies[0]?.name) || "Loading Workspace..."}
              </div>
            )}
            <select
              value={selectedStaff}
              onChange={handleStaffChange}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#5c54b6] transition-colors cursor-pointer shadow-sm max-w-[220px] truncate"
            >
              <option value="all">👨‍💼 Working Staff (All)</option>
              {staffList.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} ({s.role || "Stylist"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer hover:text-[#ff6b35] transition-colors text-gray-400">
          <FaBell className="text-xl" />
        </div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 group-hover:text-[#ff6b35] transition-colors">{name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{role}</p>
          </div>
          <FaUserCircle className="text-3xl text-gray-300 group-hover:text-[#ff6b35] transition-colors" />
        </div>
      </div>
    </div>
  );
}

