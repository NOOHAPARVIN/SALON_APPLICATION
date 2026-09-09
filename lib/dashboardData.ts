import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { cache } from "react";
import { Booking, GiftCard, Service, Staff, DashboardData } from "@/types";

// Memoize core queries to prevent duplicate fetches per request
const fetchCoreData = cache(async (branch: string, companyId?: string | null) => {
  let bookingsQuery = supabase.from("bookings").select("*");
  let giftCardsQuery = supabase.from("gift_cards").select("*");
  let servicesQuery = supabase.from("services").select("*");
  let staffQuery = supabase.from("staff").select("*");

  if (companyId) {
    bookingsQuery = bookingsQuery.eq("company_id", companyId);
    giftCardsQuery = giftCardsQuery.eq("company_id", companyId);
    servicesQuery = servicesQuery.eq("company_id", companyId);
    staffQuery = staffQuery.eq("company_id", companyId);
  }

  if (branch && branch !== "all") {
    bookingsQuery = bookingsQuery.eq("branch", branch);
    giftCardsQuery = giftCardsQuery.eq("branch", branch);
    servicesQuery = servicesQuery.eq("branch", branch);
    staffQuery = staffQuery.eq("branch", branch);
  }

  const results = await Promise.allSettled([
    bookingsQuery,
    giftCardsQuery,
    servicesQuery,
    staffQuery,
  ]);

  const getResultData = <T>(result: PromiseSettledResult<{ data: T[] | null; error: any }>): T[] => 
    result.status === "fulfilled" && !result.value.error ? (result.value.data as T[]) || [] : [];

  return {
    rawBookings: getResultData<Booking>(results[0]),
    rawGiftCards: getResultData<GiftCard>(results[1]),
    services: getResultData<Service>(results[2]),
    staff: getResultData<Staff>(results[3]),
  };
});

export async function getDashboardData(branch = "all", year = new Date().getFullYear(), staffId = "all", companyId?: string | null): Promise<DashboardData> {
  const { rawBookings, rawGiftCards, services, staff } = await fetchCoreData(branch, companyId);

  const bookings = (staffId && staffId !== "all")
    ? rawBookings.filter((b: Booking) => String(b.staff_id) === String(staffId) || b.staff_name === staffId)
    : rawBookings;

  const giftCards = (staffId && staffId !== "all")
    ? []
    : rawGiftCards;

  // 1. Total clients (unique phones in bookings)
  const clientsSet = new Set<string>();
  bookings.forEach((b: Booking) => {
    if (b.phone) clientsSet.add(String(b.phone));
  });
  const totalClients = clientsSet.size;

  // 2. Total appointments
  const totalAppointments = bookings.length;
  
  // 3. Total active services
  const totalServicesCount = services.filter((s: Service) => s.is_active).length;

  // 4. Monthly Revenue (Bookings + Gift Cards) for the given year
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2000, i, 1).toLocaleString('en', { month: 'short' }),
    revenue: 0,
    bookings: 0,
    confirmed: 0,
    completed: 0,
    clients: new Set<string>(),
  }));

  let totalRevenue = 0;

  bookings.forEach((b: Booking) => {
    const isPaid = b.status === "completed" || b.payment_status === "paid" || b.payment_status === "completed";
    const date = new Date(b.appointment_date || b.created_at || "");
    
    if (date.getFullYear() === year) {
      const m = date.getMonth();
      monthlyData[m].bookings += 1;
      if (b.phone) monthlyData[m].clients.add(String(b.phone));
      
      if (b.status === "confirmed") {
        monthlyData[m].confirmed += 1;
      }
      if (isPaid || b.status === "completed") {
        monthlyData[m].completed += 1;
      }
      
      if (isPaid) {
        monthlyData[m].revenue += Number(b.total || b.price || 0);
        totalRevenue += Number(b.total || b.price || 0);
      }
    }
  });

  giftCards.forEach((g: GiftCard) => {
    if (g.status === "paid" || g.status === "redeemed") {
      const date = new Date(g.created_at || "");
      if (date.getFullYear() === year) {
        const m = date.getMonth();
        monthlyData[m].revenue += Number(g.price || 0);
        totalRevenue += Number(g.price || 0);
      }
    }
  });

  const formattedMonthlyData = monthlyData.map(d => ({
    ...d,
    clients: d.clients.size,
  }));

  // 5. Top Services
  const serviceStats: Record<string, { count: number, revenue: number }> = {};
  
  bookings.forEach((b: Booking) => {
    if (b.status !== "cancelled") {
      const sName = b.service_name || "Unknown";
      if (!serviceStats[sName]) serviceStats[sName] = { count: 0, revenue: 0 };
      serviceStats[sName].count += 1;
      if (b.status === "completed" || b.payment_status === "paid") {
         serviceStats[sName].revenue += Number(b.total || b.price || 0);
      }
    }
  });

  giftCards.forEach((g: GiftCard) => {
    if (g.status === "paid" || g.status === "redeemed") {
      const sName = g.service_name || "Unknown";
      if (!serviceStats[sName]) serviceStats[sName] = { count: 0, revenue: 0 };
      serviceStats[sName].count += 1;
      serviceStats[sName].revenue += Number(g.price || 0);
    }
  });

  const topServices = Object.entries(serviceStats)
    .map(([name, stats]) => ({ name, ...stats, pct: 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxServiceRevenue = Math.max(...topServices.map(s => s.revenue), 1);
  topServices.forEach(s => {
    s.pct = Math.round((s.revenue / maxServiceRevenue) * 100);
  });

  // 6. Top Stylists
  const stylistStats: Record<string, { name: string, bookings: number, revenue: number }> = {};
  staff.forEach((s: Staff) => {
    stylistStats[String(s.id)] = { name: s.name, bookings: 0, revenue: 0 };
  });

  bookings.forEach((b: Booking) => {
    if (b.status !== "cancelled" && b.staff_id) {
       const sid = String(b.staff_id);
       if (!stylistStats[sid]) {
         stylistStats[sid] = { name: "Unknown", bookings: 0, revenue: 0 };
       }
       stylistStats[sid].bookings += 1;
       if (b.status === "completed" || b.payment_status === "paid") {
         stylistStats[sid].revenue += Number(b.total || b.price || 0);
       }
    }
  });

  const topStylists = Object.values(stylistStats)
    .filter(s => s.bookings > 0 || s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(s => ({
      ...s,
      rating: 4.8 // Placeholder rating
    }));

  const totalGiftCardsSold = giftCards.filter((g: GiftCard) => {
    const s = (g.status || "").toLowerCase();
    return s === "active" || s === "redeemed" || s === "paid";
  }).length;

  return {
    totalClients,
    totalAppointments,
    totalServicesCount,
    totalRevenue,
    totalGiftCardsSold,
    monthlyData: formattedMonthlyData,
    topServices,
    topStylists,
    staffList: staff,
  };
}

export interface ReportingBucket {
  date: string;
  label: string;
  sales: number;
  cashSales?: number;
  cardSales?: number;
  reductions: number;
  services: number;
  products: number;
  bookings: number;
  pencilled: number;
  confirmed: number;
  completed: number;
  pencilledBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  bookedHours: number;
  completedHours: number;
  busyHours: number;
  noShowHours: number;
  availableHours: number;
}

export function isDateInTargetPeriod(dateInput: Date | string, viewMode: string, referenceDate = new Date()): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  if (viewMode === "day") {
    return target.getTime() === ref.getTime();
  }

  if (viewMode === "week") {
    const dayOfWeek = ref.getDay(); // 0 = Sun
    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return target >= startOfWeek && target <= endOfWeek;
  }

  if (viewMode === "month") {
    return target.getFullYear() === ref.getFullYear() && target.getMonth() === ref.getMonth();
  }

  if (viewMode === "year") {
    return target.getFullYear() === ref.getFullYear();
  }

  return true;
}

export function computeReportingFromBookings(allBookings: Booking[], allGiftCards: GiftCard[] = [], viewMode = "day") {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const getBucketKey = (d: Date, mode: string) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    if (mode === 'day') return `${yyyy}-${mm}-${dd}`;
    if (mode === 'month') return `${yyyy}-${mm}`;
    if (mode === 'year') return `${yyyy}`;
    if (mode === 'week') {
      const dCopy = new Date(d);
      dCopy.setHours(0,0,0,0);
      dCopy.setDate(dCopy.getDate() - dCopy.getDay()); 
      return `${dCopy.getFullYear()}-${String(dCopy.getMonth()+1).padStart(2,'0')}-${String(dCopy.getDate()).padStart(2,'0')}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  const getBucketLabel = (d: Date, mode: string) => {
    if (mode === 'day') return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
    if (mode === 'month') return `${d.toLocaleString('default', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;
    if (mode === 'year') return `${d.getFullYear()}`;
    if (mode === 'week') return `Wk ${d.getDate()} ${d.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
    return '';
  }

  const bucketData: Record<string, ReportingBucket> = {};
  
  const iterateDate = new Date(today);
  if (viewMode === 'day') iterateDate.setDate(today.getDate() - 30);
  else if (viewMode === 'week') iterateDate.setDate(today.getDate() - (12 * 7));
  else if (viewMode === 'month') {
    iterateDate.setMonth(0);
    iterateDate.setDate(1);
  }
  else if (viewMode === 'year') iterateDate.setFullYear(today.getFullYear() - 5);

  const endDate = new Date(today);
  if (viewMode === 'day') endDate.setDate(today.getDate() + 7);
  else if (viewMode === 'week') endDate.setDate(today.getDate() + (4 * 7));
  else if (viewMode === 'month') {
    endDate.setMonth(11);
    endDate.setDate(31);
  }
  else if (viewMode === 'year') endDate.setFullYear(today.getFullYear() + 1);

  while (iterateDate <= endDate) {
    const key = getBucketKey(iterateDate, viewMode);
    if (!bucketData[key]) {
      bucketData[key] = {
        date: key,
        label: getBucketLabel(iterateDate, viewMode),
        sales: 0, cashSales: 0, cardSales: 0, reductions: 0, services: 0, products: 0, bookings: 0,
        pencilled: 0, confirmed: 0, completed: 0,
        pencilledBookings: 0, confirmedBookings: 0, completedBookings: 0,
        bookedHours: 0, completedHours: 0,
        busyHours: 0, noShowHours: 0,
        availableHours: viewMode === 'day' ? 60 : viewMode === 'week' ? 420 : viewMode === 'month' ? 1800 : 21600, 
      };
    }
    if (viewMode === 'day') iterateDate.setDate(iterateDate.getDate() + 1);
    else if (viewMode === 'week') iterateDate.setDate(iterateDate.getDate() + 7);
    else if (viewMode === 'month') iterateDate.setMonth(iterateDate.getMonth() + 1);
    else if (viewMode === 'year') iterateDate.setFullYear(iterateDate.getFullYear() + 1);
  }

  let totalSales = 0;
  let cashSales = 0;
  let cardSales = 0;
  const totalReductions = 0;
  let totalAppointments = 0;
  let giftCardsSold = 0;
  const totalClientsSet = new Set<string>();
  const retainedClientsSet = new Set<string>();
  const newClientsSet = new Set<string>();
  const clientBookingCounts: Record<string, number> = {};
  const cancelledBookings: Booking[] = [];
  const noShowBookings: Booking[] = [];
  const completedBookings: Booking[] = [];
  const serviceStats: Record<string, { count: number, revenue: number }> = {};
  const stylistStats: Record<string, { name: string, bookings: number, revenue: number }> = {};

  // Process Gift Cards sold for the selected timeframe
  allGiftCards.forEach((g: GiftCard) => {
    const status = (g.status || "").toLowerCase();
    const isPaid = status === "paid" || status === "redeemed" || status === "active";
    const gDate = g.created_at || "";
    if (isPaid && isDateInTargetPeriod(gDate, viewMode)) {
      giftCardsSold++;
      const val = Number(g.price || 0);
      totalSales += val;
      if (g.payment_method === "card") cardSales += val;
      else cashSales += val;

      const sName = g.service_name || "Gift Card";
      if (!serviceStats[sName]) serviceStats[sName] = { count: 0, revenue: 0 };
      serviceStats[sName].count += 1;
      serviceStats[sName].revenue += val;
    }
  });

  let totalTips = 0;

  allBookings.forEach((b: Booking) => {
    const apptDateStr = b.appointment_date || b.created_at;
    const inPeriod = isDateInTargetPeriod(apptDateStr || "", viewMode);

    if (inPeriod && b.status !== "cancelled") {
      totalTips += Number(b.tips || 0);
    }

    if (inPeriod && b.phone) {
      clientBookingCounts[b.phone] = (clientBookingCounts[b.phone] || 0) + 1;
      if (clientBookingCounts[b.phone] > 1) retainedClientsSet.add(b.phone);
      else newClientsSet.add(b.phone);
      totalClientsSet.add(b.phone);
    }

    if (b.status === "cancelled") {
      if (inPeriod) cancelledBookings.push(b);
      return; 
    }
    if (b.status === "no-show") {
      if (inPeriod) noShowBookings.push(b);
    }
    const isCompleted = b.status === "completed" || b.payment_status === "paid";
    if (isCompleted && inPeriod) {
      completedBookings.push(b);
    }

    if (apptDateStr) {
      const apptDate = new Date(apptDateStr);
      const key = getBucketKey(apptDate, viewMode);
      
      if (bucketData[key]) {
        bucketData[key].bookings = (bucketData[key].bookings || 0) + 1;
        const val = Number(b.total || b.price || 0);
        const isConfirmedOnly = b.status === "confirmed" && !isCompleted;
        const isPending = b.status === "pending" || (!isCompleted && !isConfirmedOnly && b.status !== "no-show");
        const dur = Number(b.duration_minutes || 60) / 60;
        
        bucketData[key].sales += val;
        bucketData[key].services += val;
        if (b.payment_method === 'card') {
          bucketData[key].cardSales = (bucketData[key].cardSales || 0) + val;
        } else {
          bucketData[key].cashSales = (bucketData[key].cashSales || 0) + val;
        }

        if (isCompleted) {
          bucketData[key].completed += val;
          bucketData[key].completedBookings = (bucketData[key].completedBookings || 0) + 1;
          bucketData[key].completedHours += dur;
        } else if (isConfirmedOnly) {
          bucketData[key].confirmed += val;
          bucketData[key].confirmedBookings = (bucketData[key].confirmedBookings || 0) + 1;
          bucketData[key].bookedHours += dur;
        } else if (isPending) {
          bucketData[key].pencilled += val;
          bucketData[key].pencilledBookings = (bucketData[key].pencilledBookings || 0) + 1;
          bucketData[key].bookedHours += dur;
        } else if (b.status === "no-show") {
          bucketData[key].noShowHours += dur;
        }
        
        if (b.category === "Busy") {
          bucketData[key].busyHours += dur;
        }
      }

      // ONLY accumulate KPI summary totals if booking falls in selected timeframe period!
      if (inPeriod) {
        totalAppointments++;
        const val = Number(b.total || b.price || 0);
        const isNotCancelledOrNoShow = b.status !== "cancelled" && b.status !== "no-show";

        if (isNotCancelledOrNoShow) {
          totalSales += val;
          if (b.payment_method === 'card') cardSales += val;
          else cashSales += val;
        }

        // Track Top Services for this timeframe
        const sName = b.service_name || "Unknown";
        if (!serviceStats[sName]) serviceStats[sName] = { count: 0, revenue: 0 };
        serviceStats[sName].count += 1;
        if (isNotCancelledOrNoShow) {
           serviceStats[sName].revenue += val;
        }

        // Track Top Stylists for this timeframe
        const stId = String(b.staff_id || "unknown");
        const stName = b.staff_name || "Unknown Stylist";
        if (!stylistStats[stId]) stylistStats[stId] = { name: stName, bookings: 0, revenue: 0 };
        stylistStats[stId].bookings += 1;
        if (isNotCancelledOrNoShow) {
          stylistStats[stId].revenue += val;
        }
      }
    }
  });

  const dailyArray = Object.values(bucketData).sort((a: ReportingBucket, b: ReportingBucket) => a.date.localeCompare(b.date));
  const retainedPct = totalClientsSet.size ? Math.round((retainedClientsSet.size / totalClientsSet.size) * 100) : 0;
  const rebookedPct = retainedPct > 0 ? Math.max(0, retainedPct - 5) : 0; 

  const topServices = Object.entries(serviceStats)
    .map(([name, stats]) => ({ name, ...stats, pct: 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxServiceRevenue = Math.max(...topServices.map(s => s.revenue), 1);
  topServices.forEach(s => {
    s.pct = Math.round((s.revenue / maxServiceRevenue) * 100);
  });

  const topStylists = Object.values(stylistStats)
    .filter(s => s.bookings > 0 || s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(s => ({
      ...s,
      rating: 4.8
    }));

  return {
    viewMode,
    topServices,
    topStylists,
    business: {
      sales: totalSales,
      cashSales,
      cardSales,
      giftCardsSold,
      tipsLiability: totalTips,
      accountTypeTips: "Liability",
      accountNameTips: "Staff Tips Payable (Current Liabilities)",
      reductions: totalReductions,
      total: totalSales - totalReductions,
      chartData: dailyArray
    },
    activity: {
      appointments: totalAppointments,
      clients: totalClientsSet.size,
      newClients: newClientsSet.size,
      retainedPct,
      rebookedPct,
      chartData: dailyArray
    },
    cancelled: cancelledBookings.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()),
    noShow: noShowBookings.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()),
    completed: completedBookings.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()),
    allBookings,
    allGiftCards,
  };
}

export async function getAdvancedReportingData(branch = "all", viewMode = "day", staffId = "all", companyId?: string | null, serviceName = "all") {
  const { rawBookings, rawGiftCards, services } = await fetchCoreData(branch, companyId);
  let allBookings = rawBookings;
  let allGiftCards = rawGiftCards;

  if (staffId && staffId !== "all") {
    allBookings = allBookings.filter((b: Booking) => String(b.staff_id) === String(staffId) || b.staff_name === staffId);
    allGiftCards = [];
  }

  if (serviceName && serviceName !== "all") {
    allBookings = allBookings.filter((b: Booking) => {
      const bAny = b as any;
      if (b.service_name === serviceName) return true;
      if (typeof bAny.services === "string" && bAny.services.includes(serviceName)) return true;
      if (Array.isArray(bAny.services) && bAny.services.some((s: any) => s.service === serviceName || s.name === serviceName)) return true;
      return false;
    });
    allGiftCards = allGiftCards.filter((g: GiftCard) => g.service_name === serviceName);
  }

  const computed = computeReportingFromBookings(allBookings, allGiftCards, viewMode);
  return {
    ...computed,
    servicesList: services || [],
  };
}

export async function getAllReportingTimeframes(branch = "all", staffId = "all", companyId?: string | null, serviceName = "all") {
  const { rawBookings, rawGiftCards } = await fetchCoreData(branch, companyId);
  let allBookings = rawBookings;
  let allGiftCards = rawGiftCards;

  if (staffId && staffId !== "all") {
    allBookings = allBookings.filter((b: Booking) => String(b.staff_id) === String(staffId) || b.staff_name === staffId);
    allGiftCards = [];
  }

  if (serviceName && serviceName !== "all") {
    allBookings = allBookings.filter((b: Booking) => {
      const bAny = b as any;
      if (b.service_name === serviceName) return true;
      if (typeof bAny.services === "string" && bAny.services.includes(serviceName)) return true;
      if (Array.isArray(bAny.services) && bAny.services.some((s: any) => s.service === serviceName || s.name === serviceName)) return true;
      return false;
    });
    allGiftCards = allGiftCards.filter((g: GiftCard) => g.service_name === serviceName);
  }

  return {
    day: computeReportingFromBookings(allBookings, allGiftCards, "day"),
    week: computeReportingFromBookings(allBookings, allGiftCards, "week"),
    month: computeReportingFromBookings(allBookings, allGiftCards, "month"),
    year: computeReportingFromBookings(allBookings, allGiftCards, "year"),
  };
}
