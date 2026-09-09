import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { FaCheckCircle, FaExclamationCircle, FaBuilding, FaUserTie } from "react-icons/fa";
import BillingUpgradeClient from "@/components/BillingUpgradeClient";

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const isSuperAdmin = user.user_metadata?.role === "super_admin";

  if (isSuperAdmin) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
    
    const { data: ownerProfiles } = await supabaseAdmin.from('profiles').select('id').eq('role', 'owner');
    const ownerIds = new Set(ownerProfiles?.map(p => p.id) || []);

    // Filter to only users who are owners in profiles table OR have explicitly set metadata
    const owners = usersData?.users.filter(u => 
      ownerIds.has(u.id) ||
      u.user_metadata?.role === 'owner' || 
      u.user_metadata?.subscription_status
    ) || [];

    // Also fetch companies to get their real names
    const { data: companies } = await supabaseAdmin.from('companies').select('id, name');

    return (
      <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FaBuilding className="text-[#5c54b6]" /> Global Billing & Subscriptions
            </h1>
            <p className="text-gray-500 mt-2">Manage and view SaaS subscriptions across all tenants.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                    <th className="p-4">Company</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Plan Tier</th>
                    <th className="p-4">Trial Ends At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies?.map(company => {
                    // Find the owner for this company
                    const owner = owners.find(o => String(o.user_metadata?.company_id) === String(company.id));
                    
                    const cName = company.name;
                    
                    const subStatus = owner?.user_metadata?.subscription_status || 'free';
                    const trialEndsAt = owner?.user_metadata?.trial_ends_at;
                    const planTier = owner?.user_metadata?.plan_tier || 'free';
                    
                    let statusColor = "bg-gray-100 text-gray-700";
                    if (subStatus === 'active') statusColor = "bg-emerald-100 text-emerald-700";
                    if (subStatus === 'trialing') statusColor = "bg-amber-100 text-amber-700";
                    if (subStatus === 'canceled' || subStatus === 'past_due') statusColor = "bg-red-100 text-red-700";

                    return (
                      <tr key={company.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-semibold text-gray-800">{cName}</td>
                        <td className="p-4 text-gray-600 text-sm flex items-center gap-2">
                          <FaUserTie className="text-gray-400" /> {owner ? owner.email : 'No owner assigned'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor} uppercase tracking-wider`}>
                            {subStatus}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 font-medium uppercase text-sm">{planTier}</td>
                        <td className="p-4 text-gray-500 text-sm">
                          {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                  {companies?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No tenants found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD OWNER VIEW ---
  const subscriptionStatus = user.user_metadata?.subscription_status || 'free';
  const trialEndsAtStr = user.user_metadata?.trial_ends_at;
  const trialEndsAt = trialEndsAtStr ? new Date(trialEndsAtStr) : null;
  const planTier = user.user_metadata?.plan_tier || 'free';
  const companyName = user.user_metadata?.branch || "My Salon";
  
  let daysLeft = 0;
  if (trialEndsAt) {
    const msDiff = trialEndsAt.getTime() - new Date().getTime();
    daysLeft = Math.ceil(msDiff / (1000 * 3600 * 24));
  }

  const isTrialing = subscriptionStatus === 'trialing' && daysLeft > 0;
  const isPastDue = subscriptionStatus === 'trialing' && daysLeft <= 0;
  const isActive = subscriptionStatus === 'active';

  return (
    <div className="p-4 md:p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Status Banners */}
        <div className="mb-6">
          {isTrialing && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm">
               <div className="text-amber-500 mt-1"><FaExclamationCircle size={20} /></div>
               <div>
                 <h3 className="text-amber-800 font-bold">14-Day Free Trial</h3>
                 <p className="text-amber-700 text-sm mt-1">You have <strong>{daysLeft} days left</strong> in your free trial. Upgrade now to avoid service interruption.</p>
               </div>
            </div>
          )}

          {isPastDue && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-4 shadow-sm">
               <div className="text-red-500 mt-1"><FaExclamationCircle size={20} /></div>
               <div>
                 <h3 className="text-red-800 font-bold">Trial Expired</h3>
                 <p className="text-red-700 text-sm mt-1">Your free trial has expired. Please subscribe to continue using the platform.</p>
               </div>
            </div>
          )}

          {isActive && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-4 shadow-sm">
               <div className="text-emerald-500 mt-1"><FaCheckCircle size={20} /></div>
               <div>
                 <h3 className="text-emerald-800 font-bold">Active Subscription</h3>
                 <p className="text-emerald-700 text-sm mt-1">Your {planTier} plan is active and up to date.</p>
               </div>
            </div>
          )}
        </div>

        {/* Custom Checkout UI */}
        <BillingUpgradeClient companyName={companyName} />
        
      </div>
    </div>
  );
}
