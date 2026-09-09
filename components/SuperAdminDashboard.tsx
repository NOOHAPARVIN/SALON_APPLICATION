"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaBuilding, 
  FaCodeBranch, 
  FaUsers, 
  FaReceipt, 
  FaPlus, 
  FaUserShield, 
  FaArrowRight, 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaTrash,
  FaCopy, 
  FaExternalLinkAlt 
} from "react-icons/fa";
import { useModal } from "@/components/ModalContext";

interface SuperAdminDashboardProps {
  companies: any[];
  branches: any[];
  users: any[];
  bookings: any[];
}

export default function SuperAdminDashboard({ companies: initialCompanies, branches, users: initialUsers, bookings }: SuperAdminDashboardProps) {
  const { showAlert, showConfirm } = useModal();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvedLinkInfo, setApprovedLinkInfo] = useState<{ companyName: string; link: string } | null>(null);

  const totalCompanies = initialCompanies.filter(c => c.is_active !== false).length;
  const totalBranches = branches.length;
  const totalUsers = initialUsers.length;
  
  const totalRevenue = bookings.reduce((sum, b) => {
    const val = Number(b.total || b.price || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const totalBookingsCount = bookings.length;

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch("/api/admin/requests");
      const data = await res.json();
      if (data.success) {
        setPendingRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAction = async (companyId: string, companyName: string, action: 'approve' | 'reject' | 'delete') => {
    setActionLoading(companyId);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, action }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned an invalid response. Please refresh and try again.");
      }

      if (data.success) {
        if (action === 'approve') {
          showAlert("Approved!", `Workspace for ${companyName} has been approved.`, "success");
          if (data.signinLink) {
            setApprovedLinkInfo({ companyName, link: window.location.origin + data.signinLink });
          }
        } else if (action === 'reject') {
          showAlert("Rejected", `Registration request for ${companyName} has been rejected.`, "info");
        } else if (action === 'delete') {
          showAlert("Deleted", `Workspace "${companyName}" has been permanently deleted from the database.`, "success");
        }
        fetchPendingRequests();
      } else {
        showAlert("Error", data.error || "Action failed", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message || "Request failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = (companyId: string, companyName: string) => {
    showConfirm(
      "Delete Registration Request",
      `Are you sure you want to permanently delete the workspace request for "${companyName}"? This will delete all company records and user access from the database.`,
      () => handleAction(companyId, companyName, 'delete'),
      "danger"
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#2c3828] to-[#45573e] text-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3 backdrop-blur-sm">
            <FaUserShield /> Super Admin Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Master Overview</h1>
          <p className="text-gray-200 text-sm mt-1 max-w-xl">
            Monitor SaaS tenant performance, approve pending workspace requests, and manage active salon locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/owner/companies"
            className="bg-[#c29957] hover:bg-[#b08746] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <FaPlus className="text-xs" /> Add Company
          </Link>
          <Link
            href="/dashboard/owner/users"
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all backdrop-blur-sm flex items-center gap-2"
          >
            <FaUsers className="text-xs" /> System Users
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <FaBuilding />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Companies</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalCompanies}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Approved Tenant Salons</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <FaCodeBranch />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Branches</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalBranches}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Total Physical Locations</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <FaUsers />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Users</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalUsers}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Owners & Receptionists</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <FaReceipt />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Volume</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{totalBookingsCount} Total Bookings</p>
          </div>
        </div>
      </div>

      {/* PENDING REGISTRATION REQUESTS SECTION */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaClock className="text-amber-600" /> Pending Registration Requests
              {pendingRequests.length > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {pendingRequests.length} New
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Review and approve new salon workspace signup applications</p>
          </div>
        </div>

        {approvedLinkInfo && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm text-emerald-900">
            <div>
              <p className="font-bold">🎉 Approved sign-in link generated for {approvedLinkInfo.companyName}:</p>
              <p className="text-xs text-emerald-700 mt-0.5 break-all font-mono">{approvedLinkInfo.link}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(approvedLinkInfo.link);
                  showAlert("Copied!", "Sign-in link copied to clipboard.", "success");
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
              >
                <FaCopy /> Copy Link
              </button>
              <button
                onClick={() => setApprovedLinkInfo(null)}
                className="text-emerald-700 text-xs hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                <th className="p-4">Salon / Company Name</th>
                <th className="p-4">Owner Name</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4">Request Date</th>
                <th className="p-4 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {pendingRequests.map((req) => (
                <tr key={req.company_id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs uppercase">
                      {req.company_name.charAt(0)}
                    </div>
                    {req.company_name}
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{req.owner_name}</td>
                  <td className="p-4 text-gray-600">{req.owner_email}</td>
                  <td className="p-4 text-gray-500 text-xs">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(req.company_id, req.company_name, 'approve')}
                        disabled={actionLoading === req.company_id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.company_id, req.company_name, 'reject')}
                        disabled={actionLoading === req.company_id}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FaTimes /> Reject
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(req.company_id, req.company_name)}
                        disabled={actionLoading === req.company_id}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Delete Workspace Request"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingRequests && pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    No pending registration requests at this time.
                  </td>
                </tr>
              )}
              {loadingRequests && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading pending requests...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Companies Overview Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaBuilding className="text-[#c29957]" /> Approved Salon Companies
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Summary of all active businesses operating on the platform</p>
          </div>
          <Link
            href="/dashboard/owner/companies"
            className="text-xs font-semibold text-[#c29957] hover:underline flex items-center gap-1"
          >
            Manage All Companies <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                <th className="p-4">Company Name</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Branches Count</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {initialCompanies.map((company) => {
                const compBranches = branches.filter((b) => String(b.company_id) === String(company.id));
                const owner = initialUsers.find((u) => String(u.user_metadata?.company_id) === String(company.id) && u.user_metadata?.role === 'owner');

                const isPending = company.is_active === false;

                return (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 text-[#5c54b6] flex items-center justify-center font-bold text-xs uppercase">
                        {company.name.charAt(0)}
                      </div>
                      {company.name}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {owner ? owner.email : <span className="text-gray-400 italic">No owner assigned</span>}
                    </td>
                    <td className="p-4">
                      {isPending ? (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        {compBranches.length} Branch{compBranches.length !== 1 ? 'es' : ''}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/owner?companyId=${company.id}`}
                        className="text-xs text-[#5c54b6] hover:text-[#453e99] font-bold bg-[#5c54b6]/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        View Dashboard <FaArrowRight className="text-[10px]" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {initialCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                    No companies registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
