"use client";

import CustomersTable from "@/components/CustomersTable";
import { useBranch } from "@/lib/BranchContext";

export default function ReceptionistCustomers() {
  const { currentBranch } = useBranch();
  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Customer Database</h1>
      <p className="text-gray-500 mb-8">Manage customer profiles, view booking history, and track loyalty.</p>

      <div className="flex-1 min-h-0 bg-transparent rounded-lg">
        <CustomersTable branch={currentBranch as any} />
      </div>
    </div>
  );
}
