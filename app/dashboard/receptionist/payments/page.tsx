"use client";

import InvoicesManager from "@/components/invoices/InvoicesManager";

export default function ReceptionistPayments() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Invoices & Payments Management</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Store, view, search by invoice # or customer name, print receipts, and issue new sale invoices across all company branches.
          </p>
        </div>
      </div>

      <InvoicesManager />
    </div>
  );
}
