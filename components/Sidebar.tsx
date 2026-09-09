"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FaHome, FaCalendarAlt, FaUserTie, FaCut, FaUsers, FaConciergeBell, FaUser, FaSignOutAlt, FaTachometerAlt, FaBookOpen, FaBox, FaChartLine, FaChartBar, FaCog, FaCreditCard, FaMoneyBillWave, FaStar, FaGift, FaSpa, FaBuilding, FaExternalLinkAlt, FaUserFriends, FaBoxOpen, FaFileAlt } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useBranch } from "@/lib/BranchContext";
import { useModal } from "@/components/ModalContext";

import { useSidebar } from "@/components/SidebarContext";
import SidebarSummary from "@/components/SidebarSummary";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showAlert } = useModal();
  const supabase = createClient();
  const { isOpen, setIsOpen } = useSidebar();
  
  // Safely use branch context for owner role, default to rospa otherwise
  let currentCompanyId = null;
  let currentBranch = 'rospa';
  let companies: any[] = [];
  try {
    const branchContext = useBranch();
    currentCompanyId = branchContext.currentCompanyId;
    currentBranch = branchContext.currentBranch;
    companies = branchContext.companies || [];
  } catch (e) {
    // If used outside of BranchProvider, ignore error and keep default
  }

  // If currentCompanyId isn't set yet but we have companies, fallback to the first one
  const activeCompany = companies.find(c => String(c.id) === String(currentCompanyId)) || companies[0];
  
  const isLoading = companies.length === 0;
  const companyName = activeCompany?.name || (isLoading ? 'Loading Workspace...' : 'Workspace');
  const companySettings = activeCompany?.settings || {};
  
  const isElan = companyName.toLowerCase().includes('elan');
  const accentColor = companySettings.primary_color || (isElan ? '#d4af37' : '#5c54b6'); // Default SaaS color
  const bgColor = isElan ? '#fff9eb' : (activeCompany ? '#fff0eb' : '#f4f7f6');
  const logoUrl = companySettings.logo_url;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (role === "super_admin") {
      window.location.href = "/admin/login";
    } else {
      window.location.href = "/portal/login";
    }
  };

  const getNavLinks = () => {
    const branchQuery = currentCompanyId ? `?branch=${currentBranch}&companyId=${currentCompanyId}` : '';

    if (role === "super_admin") {
      return [
        { name: "Dashboard", href: `/dashboard/owner${branchQuery}`, icon: FaHome },
        { name: "Reports", href: `/dashboard/owner/summary${branchQuery}`, icon: FaChartLine },
        { name: "Daily Report", href: `/dashboard/owner/daily-report${branchQuery}`, icon: FaFileAlt },
        { name: "Companies", href: `/dashboard/owner/companies${branchQuery}`, icon: FaBuilding },
        { name: "Billing", href: `/dashboard/owner/billing${branchQuery}`, icon: FaCreditCard },
        { name: "System Users", href: `/dashboard/owner/users${branchQuery}`, icon: FaUser },
        { name: "Settings", href: `/dashboard/owner/settings${branchQuery}`, icon: FaCog },
      ];
    }

    switch (role) {
      case "owner":
        return [
          { name: "Dashboard", href: `/dashboard/owner${branchQuery}`, icon: FaHome },
          { name: "Reports", href: `/dashboard/owner/summary${branchQuery}`, icon: FaChartLine },
          { name: "Daily Report", href: `/dashboard/owner/daily-report${branchQuery}`, icon: FaFileAlt },
          { name: "Calendar", href: `/dashboard/owner/calendar${branchQuery}`, icon: FaCalendarAlt },
          { name: "Appointments", href: `/dashboard/owner/bookings${branchQuery}`, icon: FaBookOpen },
          { name: "Invoices & Payments", href: `/dashboard/owner/payments${branchQuery}`, icon: FaCreditCard },
          { name: "Gift Cards", href: `/dashboard/owner/giftcards${branchQuery}`, icon: FaGift },
          { name: "Customers", href: `/dashboard/owner/customers${branchQuery}`, icon: FaUsers },
          { name: "Services", href: `/dashboard/owner/services${branchQuery}`, icon: FaCut },
          { name: "Staff", href: `/dashboard/owner/staff${branchQuery}`, icon: FaUserFriends },
          { name: "Reviews", href: `/dashboard/owner/reviews${branchQuery}`, icon: FaStar },
          { name: "Inventory", href: `/dashboard/owner/inventory${branchQuery}`, icon: FaBoxOpen },
          { name: "Billing", href: `/dashboard/owner/billing${branchQuery}`, icon: FaCreditCard },
          { name: "Branches", href: `/dashboard/owner/branches${branchQuery}`, icon: FaBuilding },
          { name: "System Users", href: `/dashboard/owner/users${branchQuery}`, icon: FaUser },
          { name: "Settings", href: `/dashboard/owner/settings${branchQuery}`, icon: FaCog },
        ];
      case "receptionist":
        return [
          { name: "Calendar", href: "/dashboard/receptionist", icon: FaCalendarAlt },
          { name: "Daily Report", href: "/dashboard/receptionist/daily-report", icon: FaFileAlt },
          { name: "Appointments", href: "/dashboard/receptionist/bookings", icon: FaBookOpen },
          { name: "Gift Cards", href: "/dashboard/receptionist/giftcards", icon: FaGift },
          { name: "Customers", href: "/dashboard/receptionist/customers", icon: FaUsers },
          { name: "Inventory", href: "/dashboard/receptionist/inventory", icon: FaBox },
          { name: "Invoices & Payments", href: "/dashboard/receptionist/payments", icon: FaCreditCard },
        ];
      case "stylist":
        return [
          { name: "My Schedule", href: "/dashboard/stylist", icon: FaCalendarAlt },
        ];
      case "customer":
      default:
        return [
          { name: "My Bookings", href: "/dashboard/customer", icon: FaCalendarAlt },
          { name: "Book Appointment", href: "/booking", icon: FaConciergeBell },
          { name: "Profile", href: "/profile", icon: FaUser },
        ];
    }
  };

  const links = getNavLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div 
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-64 bg-white border-r border-gray-100 text-slate-800 min-h-screen p-5 flex flex-col shadow-sm fixed md:relative z-50 transition-transform duration-300 ease-in-out`}
      >
      <div className="mb-8 flex items-center gap-3 px-2">
        {(() => {
          if (role === 'super_admin') {
            return (
              <>
                <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid #5c54b650` }}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#5c54b6", color: "white", fontSize: "20px", fontWeight: "bold", borderRadius: "50%" }}>
                    SA
                  </div>
                </div>
                <div>
                  <h2 className="text-slate-800 text-base font-bold leading-tight tracking-wide">Super Admin</h2>
                  <p className="text-xs text-gray-400">Global Overview</p>
                </div>
              </>
            );
          }

          const isElan = companyName.toLowerCase().includes('elan');
          const isRospa = companyName.toLowerCase().includes('rospa');
          const fallbackInitial = companyName ? companyName.charAt(0).toUpperCase() : 'S';
          
          let logoContent;
          if (logoUrl) {
            logoContent = (
              <img
                src={logoUrl}
                alt={`${companyName} Logo`}
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
              />
            );
          } else if (isElan) {
            logoContent = (
              <Image
                src="/images/elan-logo.jpg"
                alt="Elan Salon Logo"
                width={40}
                height={40}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            );
          } else if (isRospa) {
            logoContent = (
              <Image
                src="/images/logo.jpeg"
                alt="Rospa Salon Logo"
                width={40}
                height={40}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            );
          } else {
            // Generic text logo for Beautyline or new branches
            logoContent = (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: accentColor, color: "white", fontSize: "20px", fontWeight: "bold", borderRadius: "50%" }}>
                {fallbackInitial}
              </div>
            );
          }

          return (
            <>
              <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${accentColor}50` }}>
                {logoContent}
              </div>
              <div>
                <h2 className="text-slate-800 text-base font-bold leading-tight tracking-wide">{companyName}</h2>
                <p className="text-xs text-gray-400 capitalize">{role} Portal</p>
              </div>
            </>
          );
        })()}
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all border-l-4 ${
                isActive
                  ? "font-bold"
                  : "border-transparent text-slate-500 hover:bg-gray-50 hover:text-slate-800"
              }`}
              style={{
                backgroundColor: isActive ? bgColor : undefined,
                color: isActive ? accentColor : undefined,
                borderColor: isActive ? accentColor : undefined,
              }}
            >
              <link.icon className={isActive ? "" : "text-gray-400"} style={{ color: isActive ? accentColor : undefined }} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-5 space-y-3">
        {(() => {
          const nameLower = companyName.toLowerCase();
          const isRospa = nameLower.includes('rospa');
          const isElan = nameLower.includes('elan');
          
          if (!isRospa && !isElan) return null;
          
          const liveUrl = isElan ? '/?branch=elan' : '/?branch=rospa';
          
          return (
            <Link
              href={liveUrl}
              target="_blank"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-gray-50 hover:text-slate-800 transition-all font-semibold"
            >
              <FaExternalLinkAlt />
              Live Site
            </Link>
          );
        })()}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all font-semibold"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
    </>
  );
}

