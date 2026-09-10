"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Branch = string;

interface BranchEntity {
  id: string;
  name: string;
  slug: string;
  company_id: string;
  is_active: boolean;
}

interface CompanyEntity {
  id: string;
  name: string;
  is_active: boolean;
}

interface BranchContextType {
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  availableBranches: BranchEntity[];
  isLoadingBranches: boolean;
  
  // New Company state
  companies: CompanyEntity[];
  currentCompanyId: string | null;
  setCurrentCompanyId: (id: string | null) => void;
  branchesForCurrentCompany: BranchEntity[];
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch>('rospa');
  const [availableBranches, setAvailableBranches] = useState<BranchEntity[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Filter branches based on selected company and active status
  const companyFilteredBranches = currentCompanyId 
    ? availableBranches.filter(b => String(b.company_id) === String(currentCompanyId))
    : availableBranches;

  const activeBranches = companyFilteredBranches.filter(b => b.is_active !== false);

  const branchesForCurrentCompany = activeBranches.length > 0
    ? activeBranches
    : (String(currentCompanyId) === "2"
        ? [{ id: "elan-1", name: "Elan Gents Salon", slug: "elan", company_id: "2", is_active: true }]
        : [{ id: "rospa-1", name: "Rospa Salon - Mirqab", slug: "rospa", company_id: "1", is_active: true }]);

  const refreshBranches = async () => {
    try {
      const branchesRes = await fetch('/api/branches?all=true');
      const branchesData = await branchesRes.json();
      if (branchesData.success && Array.isArray(branchesData.branches)) {
        setAvailableBranches(branchesData.branches);
      }
    } catch (e) {
      console.error("Failed to refresh branches", e);
    }
  };

  useEffect(() => {
    async function initBranch() {
      setIsLoadingBranches(true);
      try {
        // 1. Fetch Companies
        const companiesRes = await fetch('/api/companies');
        const companiesData = await companiesRes.json();
        const loadedCompanies = companiesData.success ? companiesData.companies : [];
        setCompanies(loadedCompanies);
        
        // 2. Fetch available branches across all companies
        const branchesRes = await fetch('/api/branches?all=true');
        const branchesData = await branchesRes.json();
        let branches: BranchEntity[] = branchesData.success ? branchesData.branches : [];
        if (branches.length === 0) {
          branches = [
            { id: "1", name: "Rospa Salon - Mirqab", slug: "rospa", company_id: "1", is_active: true },
            { id: "2", name: "Elan Gents Salon", slug: "elan", company_id: "2", is_active: true }
          ];
        }
        setAvailableBranches(branches);

        const validSlugs = branches.map(b => b.slug);
        
        // 3. Fetch User Profile
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        let initialBranch: Branch = validSlugs.length > 0 ? validSlugs[0] : 'rospa';
        let initialCompany: string | null = loadedCompanies.length > 0 ? loadedCompanies[0].id : null;
        
        let isOwner = false;
        let isSuperAdmin = false;
        if (user) {
          const profileRes = await fetch('/api/profile');
          const profile = await profileRes.json();
          
          if (user.user_metadata?.role === 'super_admin') {
             isSuperAdmin = true;
          } else if (profile && profile.role === 'owner') {
             isOwner = true;
          }
            
          if (profile && profile.role === 'receptionist') {
            // Force their assigned branch based on their user metadata
            const assignedBranch = user.user_metadata?.branch;
            if (validSlugs.includes(assignedBranch)) {
              initialBranch = assignedBranch;
              // Set the company to the one this branch belongs to
              const matchedBranch = branches.find(b => b.slug === assignedBranch);
              if (matchedBranch) initialCompany = matchedBranch.company_id;
            }
            setTimeout(() => {
              setCurrentBranch(initialBranch);
              setCurrentCompanyId(initialCompany);
            }, 0);
            setIsLoadingBranches(false);
            return;
          } else if (profile && profile.role === 'owner') {
            // Force their assigned company
            const assignedCompany = user.user_metadata?.company_id;
            if (assignedCompany && loadedCompanies.find((c: any) => String(c.id) === String(assignedCompany))) {
              initialCompany = assignedCompany;
              const fallback = branches.find(b => String(b.company_id) === String(assignedCompany));
              if (fallback) initialBranch = fallback.slug;
            }
          }
        }

        const savedBranch = localStorage.getItem('selectedBranch');
        const savedCompany = localStorage.getItem('selectedCompany');
        
        // For super admin, we want to always default to empty string so they see the global overview
        if (isSuperAdmin) {
           initialCompany = "";
           initialBranch = 'all';
           // Clear any saved company/branch so they don't get stuck in a specific tenant's view
           localStorage.removeItem('selectedCompany');
           localStorage.removeItem('selectedBranch');
        }
        
        // Only use saved company/branch if we didn't just force an owner's company
        if (!isOwner && !isSuperAdmin && savedCompany && loadedCompanies.find((c: any) => String(c.id) === String(savedCompany))) {
          initialCompany = savedCompany;
        }
        
        if (!isSuperAdmin && savedBranch && validSlugs.includes(savedBranch)) {
          // Verify the branch belongs to the initialCompany
          const branchObj = branches.find(b => b.slug === savedBranch);
          if (branchObj && branchObj.company_id === initialCompany) {
            initialBranch = savedBranch;
          } else {
             // Fallback to first branch in the initialCompany
             const fallback = branches.find(b => b.company_id === initialCompany);
             if (fallback) initialBranch = fallback.slug;
             else initialBranch = 'all';
          }
        }
        
        setTimeout(() => {
          setCurrentBranch(initialBranch);
          setCurrentCompanyId(initialCompany);
          if (initialCompany) {
            document.cookie = `companyId=${initialCompany}; path=/; max-age=31536000; SameSite=Lax`;
          }
        }, 0);
      } catch (error) {
        console.error("Failed to initialize branches", error);
      } finally {
        setIsLoadingBranches(false);
      }
    }
    initBranch();
  }, []);

  const updateBranch = (branch: Branch) => {
    setCurrentBranch(branch);
    localStorage.setItem('selectedBranch', branch);
  };
  
  const updateCompany = (companyId: string | null) => {
    setCurrentCompanyId(companyId);
    if (companyId) {
      localStorage.setItem('selectedCompany', companyId);
      document.cookie = `companyId=${companyId}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Auto-switch to the first branch of this new company
      const fallback = availableBranches.find(b => b.company_id === companyId);
      if (fallback) {
         updateBranch(fallback.slug);
      } else {
         updateBranch('all');
      }
    }
  };

  return (
    <BranchContext.Provider value={{ 
      currentBranch, 
      setCurrentBranch: updateBranch, 
      availableBranches, 
      isLoadingBranches,
      companies,
      currentCompanyId,
      setCurrentCompanyId: updateCompany,
      branchesForCurrentCompany,
      refreshBranches
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
