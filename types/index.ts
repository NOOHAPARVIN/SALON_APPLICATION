export interface Booking {
  id?: number | string;
  name: string;
  phone: string;
  category?: string;
  service_name?: string;
  staff_id?: number | string;
  staff_name?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  booking_source?: string;
  created_by?: string;
  service_id?: number | string;
  tips?: number;
  tipped_staff_id?: string;
  total?: number;
  price?: number;
  duration_minutes?: number;
  notes?: string;
  created_at?: string;
  company_id?: string;
  branch?: string;
  group_id?: string;
  relatedBookings?: Booking[];
}

export interface Service {
  id?: number | string;
  name: string;
  category?: string;
  price: number;
  duration_minutes?: number;
  is_active?: boolean;
  description?: string;
  company_id?: string;
  branch?: string;
}

export interface Staff {
  id: number | string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  branch?: string;
  company_id?: string;
  services?: string[];
  schedule?: Record<string, any>;
  image_url?: string;
}

export interface GiftCard {
  id?: number | string;
  code?: string;
  price?: number;
  value?: number;
  balance?: number;
  status?: string;
  created_at?: string;
  company_id?: string;
  branch?: string;
  service_name?: string;
  purchaser_name?: string;
  purchaser_phone?: string;
  recipient_name?: string;
  recipient_phone?: string;
  expiry_date?: string;
  payment_method?: string;
  message?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  settings?: Record<string, any>;
}

export interface Branch {
  id: string;
  company_id?: string;
  name: string;
  location?: string;
  contact_number?: string;
}

export interface DashboardData {
  totalClients: number;
  totalAppointments: number;
  totalServicesCount: number;
  totalRevenue: number;
  totalGiftCardsSold: number;
  monthlyData: MonthlyData[];
  topServices: { name: string; count: number; revenue: number; pct: number }[];
  topStylists: { name: string; bookings: number; revenue: number; rating: number }[];
  staffList: Staff[];
}

export interface MonthlyData {
  month: string;
  revenue: number;
  clients: number;
  bookings: number;
  confirmed: number;
  completed: number;
}
