import { POST as handleBookingPost } from "../../bookings/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // We reuse the core booking validation and insertion logic
  // The bookings/route.ts POST logic already relies on getCompanyIdFromRequest
  // which securely handles the branch/companyId fallback for unauthenticated POSTs.
  return handleBookingPost(req);
}
