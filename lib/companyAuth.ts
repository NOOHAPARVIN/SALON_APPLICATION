import { supabaseAdmin as supabase } from "./supabaseAdmin";
import { cookies } from "next/headers";

/**
 * Utility to securely extract the correct company_id for an API request.
 * It checks for an external API key first (for external frontends like Elan).
 * Next, it checks for a companyId query parameter.
 * Then, it checks for a companyId cookie.
 * Finally, it falls back to parsing the 'branch' query parameter.
 */
export async function getCompanyIdFromRequest(
  req: Request,
  fallbackBranch?: string | null
): Promise<{ companyId: string | null; error: string | null }> {
  try {
    // 1. Check for External API Key
    const apiKey = req.headers.get("x-api-key");
    
    if (apiKey) {
      const { data: keyData, error: keyError } = await supabase
        .from("company_api_keys")
        .select("company_id, is_active")
        .eq("api_key", apiKey)
        .single();
        
      if (keyError || !keyData) {
        return { companyId: null, error: "Invalid API key" };
      }
      if (!keyData.is_active) {
        return { companyId: null, error: "API key is inactive" };
      }
      
      return { companyId: keyData.company_id, error: null };
    }
    
    const { searchParams } = new URL(req.url);

    // FETCH USER ROLE TO ENFORCE SECURITY BOUNDARIES FIRST
    const { createClient } = await import('@/utils/supabase/server');
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    
    let isOwner = false;
    let forcedStaffBranch = null;

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'owner' || profile?.role === 'super_admin') {
        isOwner = true;
      } else if (profile?.role === 'receptionist' || profile?.role === 'staff') {
        forcedStaffBranch = user.user_metadata?.branch;
      }
    }

    // SECURITY ENFORCEMENT: If staff, they CANNOT override their branch using cookies or queries.
    if (forcedStaffBranch) {
      // We map the slug back to the actual company record
      const companyNameQuery = forcedStaffBranch.toLowerCase();
      const { data: companies } = await supabase.from("companies").select("id, name");
      if (companies) {
        const matchedCompany = companies.find(c => c.name.toLowerCase().includes(companyNameQuery));
        if (matchedCompany) {
          return { companyId: matchedCompany.id, error: null };
        }
      }
      return { companyId: null, error: "Staff member lacks valid branch/company assignment" };
    }

    // 3. Check for explicit companyId in queries or cookies (For owners/super_admins)
    if (isOwner) {
      const queryCompanyId = searchParams.get("companyId");
      if (queryCompanyId) {
        return { companyId: queryCompanyId, error: null };
      }
      
      try {
        const cookieStore = cookies();
        const cookieCompanyId = cookieStore.get('companyId')?.value;
        if (cookieCompanyId) {
          return { companyId: cookieCompanyId, error: null };
        }
      } catch (e) {
        // Ignored: cookies() might throw if not available in this context
      }
    }

    // 4. Fallback to Internal Dashboard / Public booking flow (uses ?branch=... in URL, fallbackBranch, or defaults to rospa)
    const branchSlug = searchParams.get("branch") || fallbackBranch || (isOwner ? null : 'rospa');
    
    // If no branch specified, we can't reliably assign a company_id safely for write operations
    if (!branchSlug || branchSlug === 'all') {
      if (isOwner) {
        return { companyId: null, error: null }; // Owner can see "all companies"
      } else {
        return { companyId: null, error: "Missing branch assignment" };
      }
    }
    
    // We map the slug back to the actual company record
    // e.g., 'rospa' -> 'Rospa Salon', 'elan' -> 'Elan'
    const companyNameQuery = branchSlug.toLowerCase();
    
    // Fetch all companies to find the match (since there are very few companies, this is fast)
    const { data: companies, error: compError } = await supabase
      .from("companies")
      .select("id, name");
      
    if (compError || !companies) {
      return { companyId: null, error: "Failed to load companies" };
    }
    
    // Find matching company (simple fuzzy match)
    const matchedCompany = companies.find(c => c.name.toLowerCase().includes(companyNameQuery));
    
    if (matchedCompany) {
      return { companyId: matchedCompany.id, error: null };
    }
    
    return { companyId: null, error: "Company not found for branch: " + branchSlug };
    
  } catch (error: any) {
    return { companyId: null, error: error.message };
  }
}
