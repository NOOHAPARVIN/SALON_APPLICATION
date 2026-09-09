import { FaSpa } from "react-icons/fa";

export default function TreatmentsPage() {
  const treatments = [
    { name: "Any Facial", category: "Facial", duration: "60 min", price: "QR 99", status: "Active" },
    { name: "Anti-aging Hydra Facial", category: "Facial", duration: "75 min", price: "QR 150", status: "Active" },
    { name: "Premium Hydra Facial", category: "Facial", duration: "90 min", price: "QR 249", status: "Active" },
    { name: "Kanpeki Korean Facial", category: "Facial", duration: "90 min", price: "QR 399", status: "Active" },
    { name: "Full Body Relaxing Massage", category: "Massage", duration: "90 min", price: "QR 90", status: "Active" },
    { name: "Thai Massage", category: "Massage", duration: "60 min", price: "QR 100", status: "Active" },
    { name: "Hot Oil Massage", category: "Massage", duration: "60 min", price: "QR 100", status: "Active" },
    { name: "Deep Tissue Massage", category: "Massage", duration: "90 min", price: "QR 120", status: "Active" },
    { name: "Footspa", category: "Spa", duration: "45 min", price: "QR 60", status: "Active" },
    { name: "Detox Mud Bath & Polish", category: "Spa", duration: "90 min", price: "QR 320", status: "Active" },
    { name: "Aromatherapy Wellness Spa", category: "Spa", duration: "75 min", price: "QR 300", status: "Active" },
    { name: "Organic Honey Body Scrub", category: "Spa", duration: "60 min", price: "QR 220", status: "Active" },
  ];

  const categoryColors: Record<string, string> = {
    Facial: "#00d284",
    Massage: "#f472b6",
    Spa: "#06b6d4",
  };

  return (
    <div className="p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#ff6b35]/10 p-3 rounded-xl">
              <FaSpa className="text-[#ff6b35] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Treatments</h1>
              <p className="text-gray-400 text-sm">Manage facial, massage & spa treatments</p>
            </div>
          </div>
          <button className="bg-[#ff6b35] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20">
            + Add Treatment
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {["Facial", "Massage", "Spa"].map((cat) => {
            const count = treatments.filter((t) => t.category === cat).length;
            const color = categoryColors[cat];
            return (
              <div key={cat} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <FaSpa style={{ color }} className="text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-sm text-gray-400">{cat} Treatments</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Treatments List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-slate-800">All Treatments</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Treatment</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Duration</th>
                <th className="text-left px-6 py-3">Price</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {treatments.map((t) => (
                <tr key={t.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 text-sm">{t.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${categoryColors[t.category]}15`, color: categoryColors[t.category] }}
                    >
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.duration}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{t.price}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">{t.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-[#ff6b35] hover:underline font-semibold">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
