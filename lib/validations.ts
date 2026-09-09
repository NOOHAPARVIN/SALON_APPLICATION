import { z } from "zod";

// ============================================================
// BOOKINGS
// ============================================================

/** Schema for a single service entry inside a booking request */
export const bookingServiceSchema = z.object({
  category: z.string().optional(),
  service: z.string().min(1, "Service name is required"),
  staff: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  duration_minutes: z.union([z.number(), z.string()]).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.union([z.string(), z.number()]).optional(),
    email: z.string().optional(),
  }),
  services: z
    .array(bookingServiceSchema)
    .min(1, "At least one service must be selected"),
  date: z.string().min(1, "Appointment date is required"),
  time: z.string().min(1, "Appointment time is required"),
  payment: z.string().optional(),
  payment_status: z.string().optional(),
  total: z.union([z.number(), z.string()]).optional(),
  note: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  booking_source: z.string().optional(),
  created_by: z.string().optional(),
  service_id: z.union([z.number(), z.string(), z.null()]).optional(),
  tips: z.union([z.number(), z.string()]).optional(),
  branch: z.string().optional(),
});

export const updateBookingSchema = z.object({
  status: z.string().optional(),
  name: z.string().optional(),
  customer_name: z.string().optional(),
  phone: z.union([z.string(), z.number(), z.null()]).optional(),
  appointment_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  staff_id: z.union([z.number(), z.string(), z.null()]).optional(),
  service_id: z.union([z.number(), z.string(), z.null()]).optional(),
  category: z.string().optional(),
  service_name: z.string().optional(),
  notes: z.union([z.string(), z.null()]).optional(),
  duration_minutes: z.union([z.number(), z.string(), z.null()]).optional(),
  total: z.union([z.number(), z.string(), z.null()]).optional(),
  payment_method: z.string().optional(),
  payment_status: z.string().optional(),
  booking_source: z.string().optional(),
  created_by: z.string().optional(),
  tips: z.union([z.number(), z.string()]).optional(),
  cancel_reason: z.union([z.string(), z.null()]).optional(),
  refund_amount: z.union([z.number(), z.string(), z.null()]).optional(),
  refund_reason: z.union([z.string(), z.null()]).optional(),
  branch: z.string().optional(),
});

// ============================================================
// STAFF
// ============================================================

export const createStaffSchema = z.object({
  name: z.string().min(1, "Staff name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.union([z.string(), z.number(), z.null()]).optional(),
  role: z.string().optional(),
  services: z
    .union([z.array(z.string()), z.string()])
    .optional(),
  is_active: z.boolean().optional(),
  branch: z.string().optional(),
  working_start: z.string().optional(),
  working_end: z.string().optional(),
  working_days: z.union([z.array(z.number()), z.array(z.string()), z.string()]).optional(),
  color: z.string().optional(),
});

export const updateStaffSchema = z.object({
  id: z.union([z.number(), z.string()]).refine((v) => v !== "" && v !== null && v !== undefined, {
    message: "Staff ID is required",
  }),
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.union([z.string(), z.number(), z.null()]).optional(),
  role: z.string().optional(),
  services: z
    .union([z.array(z.string()), z.string()])
    .optional(),
  is_active: z.boolean().optional(),
  branch: z.string().optional(),
  working_start: z.string().optional(),
  working_end: z.string().optional(),
  working_days: z.union([z.array(z.number()), z.array(z.string()), z.string()]).optional(),
  color: z.string().optional(),
});

// ============================================================
// SERVICES
// ============================================================

export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  category: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  duration_minutes: z.union([z.number(), z.string()]).optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional().nullable(),
  name_ar: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
});

export const updateServiceSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  duration_minutes: z.union([z.number(), z.string()]).optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional().nullable(),
  name_ar: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
});

// ============================================================
// INVENTORY
// ============================================================

export const createInventorySchema = z.object({
  name: z.string().min(1, "Item name is required"),
  variant: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  stock: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional(),
  threshold: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  branch: z.string().optional(),
});

export const updateInventorySchema = z.object({
  name: z.string().optional(),
  variant: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  stock: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional(),
  threshold: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  branch: z.string().optional(),
});

// ============================================================
// PAYMENTS
// ============================================================

export const confirmPaymentSchema = z.object({
  bookingId: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
    message: "Booking ID is required",
  }),
  sessionId: z.string().min(1, "Session ID is required"),
});

// ============================================================
// AUTH
// ============================================================

export const forgotPasswordSchema = z
  .object({
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    phone: z.union([z.string(), z.number()]).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email or phone number is required",
  });

// ============================================================
// WHATSAPP
// ============================================================

export const sendWhatsAppSchema = z.object({
  phone: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
    message: "Phone number is required",
  }),
  message: z.string().min(1, "Message body is required"),
});

// ============================================================
// HELPER: Format Zod errors into a user-friendly string
// ============================================================

export function formatZodError(error: z.ZodError<any>): string {
  return error.issues
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
      return `${path}${e.message}`;
    })
    .join("; ");
}

// ============================================================
// REVIEWS
// ============================================================

export const createReviewSchema = z.object({
  name: z.string().min(1, "Name is required"),
  service: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  stylist: z.string().optional(),
});
