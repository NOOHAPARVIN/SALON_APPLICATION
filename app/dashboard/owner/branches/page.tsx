"use client";

import React, { useState, useEffect } from 'react';
import { FaPlus, FaBuilding, FaExclamationCircle, FaTrash, FaUndo, FaCheckCircle } from 'react-icons/fa';
import { useBranch } from '@/lib/BranchContext';

export default function BranchesPage() {
  const { refreshBranches } = useBranch();
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchSlug, setNewBranchSlug] = useState("");
  const [error, setError] = useState("");
  const [deletingBranch, setDeletingBranch] = useState<{ id: string; name: string } | null>(null);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsAdding(true);

    if (!newBranchName || !newBranchSlug) {
      setError("Name and slug are required.");
      setIsAdding(false);
      return;
    }

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBranchName, slug: newBranchSlug })
      });
      const data = await res.json();
      if (data.success) {
        setNewBranchName("");
        setNewBranchSlug("");
        await fetchBranches();
        await refreshBranches();
      } else {
        setError(data.error || "Failed to add branch.");
      }
    } catch (err: any) {
      setError("Connection error: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    const { id } = deletingBranch;
    setActionLoadingId(id);
    setError("");

    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchBranches();
        await refreshBranches();
        setDeletingBranch(null);
      } else {
        setError(data.error || "Failed to delete branch.");
      }
    } catch (err: any) {
      setError("Connection error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivateBranch = async (id: string) => {
    setActionLoadingId(id);
    setError("");

    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      const data = await res.json();
      if (data.success) {
        await fetchBranches();
        await refreshBranches();
      } else {
        setError(data.error || "Failed to reactivate branch.");
      }
    } catch (err: any) {
      setError("Connection error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-white font-medium">Loading branches...</div>;
  }

  const activeBranches = branches.filter(b => b.is_active !== false);
  const inactiveBranches = branches.filter(b => b.is_active === false);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#d4af37]">Branches</h1>
          <p className="text-gray-400 mt-2">Manage your salon locations.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3 mb-6">
          <FaExclamationCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {deletingBranch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b2b20] border border-red-500/30 p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FaExclamationCircle className="text-red-400" />
              Delete Branch?
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-amber-300">&quot;{deletingBranch.name}&quot;</span>? This will deactivate the branch in the database and remove it from active booking selectors.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                disabled={actionLoadingId === deletingBranch.id}
                className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteBranch}
                disabled={actionLoadingId === deletingBranch.id}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoadingId === deletingBranch.id ? "Deactivating..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch List */}
        <div className="space-y-6">
          {/* Active Branches */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaBuilding className="w-5 h-5 text-[#d4af37]" />
              Active Branches ({activeBranches.length})
            </h2>
            {activeBranches.map(branch => (
              <div key={branch.id} className="bg-[#0b2b20] border border-white/10 p-5 rounded-lg flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{branch.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">Slug: {branch.slug}</p>
                  <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FaCheckCircle className="mr-1 text-[10px]" /> Active
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDeletingBranch({ id: branch.id, name: branch.name })}
                  disabled={actionLoadingId === branch.id}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="Delete/Deactivate branch"
                >
                  <FaTrash className="text-xs" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
            {activeBranches.length === 0 && (
              <div className="text-gray-400 italic bg-[#0b2b20]/50 p-4 rounded-lg border border-white/5 text-sm">
                No active branches found.
              </div>
            )}
          </div>

          {/* Inactive Branches (Soft Deleted) */}
          {inactiveBranches.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Inactive Branches ({inactiveBranches.length})
              </h3>
              {inactiveBranches.map(branch => (
                <div key={branch.id} className="bg-[#081f17] border border-white/5 p-4 rounded-lg flex items-center justify-between gap-4 opacity-75">
                  <div>
                    <h4 className="text-base font-bold text-gray-300 line-through">{branch.name}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">Slug: {branch.slug}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Inactive (Database Soft-Deleted)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReactivateBranch(branch.id)}
                    disabled={actionLoadingId === branch.id}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <FaUndo className="text-xs" />
                    <span>Reactivate</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Branch */}
        <div>
          <form onSubmit={handleAddBranch} className="bg-[#0b2b20] border border-[#d4af37]/30 p-6 rounded-lg sticky top-8">
            <h2 className="text-xl font-semibold text-[#d4af37] mb-6 flex items-center gap-2">
              <FaPlus className="w-5 h-5" />
              Add New Branch
            </h2>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
              <FaExclamationCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">Adding a new branch will increase your active SaaS subscription quantity. Your card will be automatically charged a prorated amount by Stripe.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Branch Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0d3326] text-white rounded p-3 focus:outline-none border border-transparent focus:border-[#d4af37]/50"
                  placeholder="e.g. Rospa Salon - Mirqab"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Branch URL Slug</label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9\-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                  className="w-full bg-[#0d3326] text-white rounded p-3 focus:outline-none border border-transparent focus:border-[#d4af37]/50"
                  placeholder="e.g. rospa-mirqab"
                  value={newBranchSlug}
                  onChange={e => {
                    // Auto format slug
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
                    setNewBranchSlug(val);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Used in booking links (e.g. /booking?branch=rospa-mirqab)</p>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-[#d4af37] text-black font-bold py-3 px-4 rounded hover:bg-[#b5952f] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAdding ? "Adding Branch..." : "Confirm & Add Branch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

