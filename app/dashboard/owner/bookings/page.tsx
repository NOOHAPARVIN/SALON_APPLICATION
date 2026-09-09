"use client";

import BookingsTable from "@/components/BookingsTable";
import { useBranch } from "@/lib/BranchContext";

export default function OwnerBookings() {
  const { currentBranch } = useBranch();
  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Bookings Management</h1>
      <p className="text-gray-500 mb-8">View and manage all salon bookings, filter by date, staff, or service.</p>

      <div className="flex-1 min-h-0 bg-transparent rounded-lg">
        <BookingsTable branch={currentBranch as any} />
      </div>
    </div>
  );
}
