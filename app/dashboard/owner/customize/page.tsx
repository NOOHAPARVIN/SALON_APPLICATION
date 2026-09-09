import { FaCog, FaPalette, FaBell, FaGlobe, FaShieldAlt } from "react-icons/fa";

export default function CustomizePage() {
  return (
    <div className="p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#ff6b35]/10 p-3 rounded-xl">
            <FaPalette className="text-[#ff6b35] text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Customize</h1>
            <p className="text-gray-400 text-sm">Personalize your salon's branding and appearance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Branding */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaPalette className="text-[#ff6b35]" />
              <h2 className="font-bold text-slate-800">Branding</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Salon Name</label>
                <input
                  type="text"
                  defaultValue="Rospa Salon"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tagline</label>
                <input
                  type="text"
                  defaultValue="Premium Salon & Spa Experience"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" defaultValue="#ff6b35" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input
                    type="text"
                    defaultValue="#ff6b35"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#ff6b35] transition-colors">
                  <p className="text-sm text-gray-400">Click to upload logo</p>
                  <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Page */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaGlobe className="text-[#2972ff]" />
              <h2 className="font-bold text-slate-800">Booking Page</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Working Hours Start</label>
                <input type="time" defaultValue="09:00" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Working Hours End</label>
                <input type="time" defaultValue="21:00" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Slot Duration</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors">
                  <option>15 minutes</option>
                  <option selected>30 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Advance Booking Limit</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#ff6b35] transition-colors">
                  <option>1 week</option>
                  <option selected>1 month</option>
                  <option>3 months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaBell className="text-[#ffc107]" />
              <h2 className="font-bold text-slate-800">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Email confirmation on booking", desc: "Send booking confirmation emails to customers" },
                { label: "SMS reminders", desc: "Send SMS reminders 24 hours before appointments" },
                { label: "New booking alert to staff", desc: "Notify stylists when they receive a new booking" },
                { label: "Cancellation notifications", desc: "Notify owner when a booking is cancelled" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff6b35]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="bg-[#ff6b35] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#e85b24] transition-colors shadow-md shadow-[#ff6b35]/20">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
