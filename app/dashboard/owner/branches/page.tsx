"use client";

import React, { useState, useEffect } from 'react';
import { FaPlus, FaBuilding, FaExclamationCircle } from 'react-icons/fa';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchSlug, setNewBranchSlug] = useState("");
  const [error, setError] = useState("");

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
        fetchBranches();
      } else {
        setError(data.error || "Failed to add branch.");
      }
    } catch (err: any) {
      setError("Connection error: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-white">Loading branches...</div>;
  }

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
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaBuilding className="w-5 h-5 text-[#d4af37]" />
            Active Branches ({branches.length})
          </h2>
          {branches.map(branch => (
            <div key={branch.id} className="bg-[#0b2b20] border border-white/10 p-5 rounded-lg">
              <h3 className="text-lg font-bold text-white">{branch.name}</h3>
              <p className="text-gray-400 text-sm mt-1">Slug: {branch.slug}</p>
              <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                Active
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="text-gray-400 italic bg-[#0b2b20]/50 p-4 rounded-lg border border-white/5">
              No branches found.
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
              <p>Adding a new branch will increase your active SaaS subscription quantity. Your card will be automatically charged a prorated amount by Stripe.</p>
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
                className="w-full bg-[#d4af37] text-black font-bold py-3 px-4 rounded hover:bg-[#b5952f] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
