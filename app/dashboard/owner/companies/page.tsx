"use client";

import { useEffect, useState } from "react";
import { FaBuilding, FaPlus, FaKey, FaCopy, FaCheck, FaCodeBranch, FaTrash, FaPaperPlane } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createdLinkInfo, setCreatedLinkInfo] = useState<{ companyName: string; link: string; email: string; type: 'invite' | 'created' } | null>(null);

  // Invite Link States
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Branch States
  const [addingBranchForCompany, setAddingBranchForCompany] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchSlug, setNewBranchSlug] = useState("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { showAlert, showConfirm } = useModal();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      } else {
        showAlert("Error", data.error || "Failed to load companies", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      showAlert("Error", "Company name is required", "error");
      return;
    }
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newCompanyName.trim(),
          ownerName: newOwnerName.trim() || undefined,
          ownerEmail: newOwnerEmail.trim() || undefined,
          password: newPassword.trim() || undefined
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        showAlert("Success", `${newCompanyName} has been added!`, "success");
        if (data.signinLink) {
          const fullLink = `${window.location.origin}${data.signinLink}`;
          setCreatedLinkInfo({
            companyName: newCompanyName.trim(),
            link: fullLink,
            email: newOwnerEmail.trim(),
            type: 'created'
          });
        }
        setNewCompanyName("");
        setNewOwnerName("");
        setNewOwnerEmail("");
        setNewPassword("");
        setIsAdding(false);
        fetchCompanies();
      } else {
        showAlert("Error", data.error || "Failed to add company", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    }
  };

  const handleAddBranch = async (companyId: string) => {
    if (!newBranchName.trim() || !newBranchSlug.trim()) {
      showAlert("Error", "Branch name and slug are required", "error");
      return;
    }
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          company_id: companyId,
          name: newBranchName.trim(),
          slug: newBranchSlug.trim()
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        showAlert("Success", `Branch ${newBranchName} added successfully!`, "success");
        setNewBranchName("");
        setNewBranchSlug("");
        setAddingBranchForCompany(null);
        fetchCompanies(); // Refresh to show new branch
      } else {
        showAlert("Error", data.error || "Failed to add branch", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    showConfirm(
      "Delete Branch",
      `Are you sure you want to delete the branch "${branchName}"? This cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`/api/branches/${branchId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showAlert("Success", `Branch ${branchName} deleted successfully!`, "success");
            fetchCompanies();
          } else {
            showAlert("Error", data.error || "Failed to delete branch", "error");
          }
        } catch (err: any) {
          showAlert("Error", err.message, "error");
        }
      },
      "danger"
    );
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    showConfirm(
      "Delete Company",
      `Are you sure you want to delete "${companyName}"? This will permanently delete all its branches, API keys, and associated data. This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`/api/companies/${companyId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showAlert("Success", `Company ${companyName} deleted successfully!`, "success");
            fetchCompanies();
          } else {
            showAlert("Error", data.error || "Failed to delete company", "error");
          }
        } catch (err: any) {
          showAlert("Error", err.message, "error");
        }
      },
      "danger"
    );
  };

  const handleSendInvite = async () => {
    if (!inviteEmailInput.trim() || !inviteEmailInput.includes("@")) {
      showAlert("Error", "Please enter a valid email address.", "error");
      return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: inviteEmailInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Invite Sent!", `Setup invitation link dispatched to ${inviteEmailInput}!`, "success");
        if (data.inviteLink) {
          setCreatedLinkInfo({
            companyName: "Invited Tenant",
            link: data.inviteLink,
            email: inviteEmailInput.trim(),
            type: 'invite'
          });
        }
        setInviteEmailInput("");
        setIsInviting(false);
      } else {
        showAlert("Error", data.error || "Failed to send invitation link", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    } finally {
      setSendingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FaBuilding className="text-[#ff6b35]" />
              Companies & Branches
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your multi-tenant organizations, branches, and API keys.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviting(true)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
            >
              <FaPaperPlane className="text-[#c29957]" /> Send Invite Link
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#ff5a1f] transition-all shadow-md shadow-[#ff6b35]/20"
            >
              <FaPlus /> Add New Company
            </button>
          </div>
        </div>

        {/* Send Tenant Invitation Modal Form */}
        {isInviting && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-lg">
            <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
              <FaPaperPlane className="text-[#c29957]" /> Send Workspace Invitation Link
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the client's email. We will generate and email a unique setup link allowing them to choose their salon name, owner details, and password themselves.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. owner@elansalon.com"
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#c29957]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsInviting(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendInvite}
                disabled={sendingInvite}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {sendingInvite ? "Generating Invite..." : "Send Invite & Copy Link"}
              </button>
            </div>
          </div>
        )}

        {/* Generated Link Banner */}
        {createdLinkInfo && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-emerald-900 text-sm">
                {createdLinkInfo.type === 'invite' 
                  ? `✨ Setup Invitation Link Dispatched to ${createdLinkInfo.email}:`
                  : `🎉 Approved Sign-In Link Generated for ${createdLinkInfo.companyName}:`}
              </p>
              <p className="text-xs text-emerald-700 font-mono mt-1 break-all bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">{createdLinkInfo.link}</p>
              <p className="text-[11px] text-emerald-800 mt-1.5 font-medium">
                {createdLinkInfo.type === 'invite'
                  ? 'Send this setup link to your client so they can enter their salon name and choose their password.'
                  : 'Share this direct sign-in link with the tenant.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdLinkInfo.link);
                  showAlert("Copied!", "Link copied to clipboard.", "success");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
              >
                <FaCopy /> Copy Link
              </button>
              <button
                onClick={() => setCreatedLinkInfo(null)}
                className="text-xs text-emerald-700 hover:underline px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Add Company Modal Form */}
        {isAdding && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-lg">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Create New Company</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Company / Salon Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Elan Salon"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Owner Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Owner"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Owner Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. owner@elansalon.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Default: Salon12345!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCompany}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ff6b35] hover:bg-[#ff5a1f] rounded-lg"
              >
                Create Company & Generate Link
              </button>
            </div>
          </div>
        )}

        {/* Companies List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6b35]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <div key={company.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{company.name}</h2>
                    <span className="text-xs text-slate-400 mt-1 block">Created: {new Date(company.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Company"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Branches Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FaCodeBranch className="text-slate-400" /> Branches
                    </h3>
                    <button 
                      onClick={() => setAddingBranchForCompany(company.id)}
                      className="text-xs font-semibold text-[#ff6b35] hover:underline"
                    >
                      + Add Branch
                    </button>
                  </div>

                  {addingBranchForCompany === company.id && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Downtown"
                            value={newBranchName}
                            onChange={(e) => {
                              setNewBranchName(e.target.value);
                              // Auto generate slug
                              if (!newBranchSlug || newBranchSlug === newBranchName.slice(0, -1).toLowerCase().replace(/[^a-z0-9]/g, '-')) {
                                setNewBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                              }
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Slug (Identifier)</label>
                          <input
                            type="text"
                            placeholder="e.g. downtown"
                            value={newBranchSlug}
                            onChange={(e) => setNewBranchSlug(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-gray-200"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setAddingBranchForCompany(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleAddBranch(company.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#ff6b35] rounded-lg hover:bg-[#ff5a1f]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {company.branches && company.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {company.branches.map((branch: any) => (
                        <div key={branch.id} className="group bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 flex items-center gap-2">
                          <span>{branch.name} <span className="text-slate-400 font-normal">({branch.slug})</span></span>
                          <button 
                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Branch"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">No branches configured.</div>
                  )}
                </div>

                {/* API Keys Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <FaKey className="text-slate-400" /> API Access Keys
                  </h3>
                  
                  {company.company_api_keys && company.company_api_keys.length > 0 ? (
                    company.company_api_keys.map((keyObj: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-200">
                        <code className="text-xs text-slate-600 break-all pr-4 font-mono">{keyObj.api_key}</code>
                        <button 
                          onClick={() => copyToClipboard(keyObj.api_key)}
                          className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
                          title="Copy API Key"
                        >
                          {copiedKey === keyObj.api_key ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 italic">No API keys generated.</div>
                  )}
                </div>
              </div>
            ))}
            
            {companies.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                No companies found. Click "Add New Company" to create one.
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
