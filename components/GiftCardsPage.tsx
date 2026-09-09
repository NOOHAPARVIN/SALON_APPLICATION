"use client";

import { useEffect, useState } from "react";
import { FaGift, FaSearch, FaCheck } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

import { services as womensServices } from "@/components/serviceData";
import { services as mensServices } from "@/components/mensServiceData";

export default function GiftCardsPage({ role }: { role: string }) {
  const [giftcards, setGiftcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { currentCompanyId, currentBranch } = useBranch();
  const { showAlert, showConfirm } = useModal();
  
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbStaff, setDbStaff] = useState<any[]>([]);
  
  // Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueData, setIssueData] = useState({
    amount: "",
    isCustomAmount: false,
    purchaser_name: "",
    purchaser_phone: "",
    recipient_name: "",
    recipient_phone: "",
    message: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    services: [{ id: Date.now().toString(), name: "", staff_id: "", price: 0 }]
  });

  useEffect(() => {
    if (showIssueModal && currentBranch) {
      // Fetch services
      fetch(`/api/services?branch=${currentBranch}`)
        .then(res => res.json())
        .then(data => {
          let list = (data.services || []).filter((s: any) => s.is_active !== false);
          if (list.length === 0) {
            // Fallback to static services for this branch
            const staticCats = currentBranch === 'elan' ? mensServices : womensServices;
            list = staticCats.flatMap(cat => cat.items.map(item => ({
              id: item.name,
              name: item.name,
              price: item.price,
              category: cat.name
            })));
          }
          setDbServices(list);
        })
        .catch(() => {
          const staticCats = currentBranch === 'elan' ? mensServices : womensServices;
          const list = staticCats.flatMap(cat => cat.items.map(item => ({
            id: item.name,
            name: item.name,
            price: item.price,
            category: cat.name
          })));
          setDbServices(list);
        });

      // Fetch staff
      fetch(`/api/staff?branch=${currentBranch}`)
        .then(res => res.json())
        .then(data => {
          if (data.staff) {
            setDbStaff(data.staff.filter((s: any) => s.is_active !== false));
          }
        });
    }
  }, [showIssueModal, currentBranch]);

  // Recalculate total amount when services change (if not overridden)
  useEffect(() => {
    if (!issueData.isCustomAmount) {
      const total = issueData.services.reduce((sum, s) => sum + Number(s.price || 0), 0);
      setIssueData(prev => ({ ...prev, amount: total ? String(total) : "" }));
    }
  }, [issueData.services, issueData.isCustomAmount]);

  const addService = () => {
    setIssueData(prev => ({
      ...prev,
      services: [...prev.services, { id: Date.now().toString(), name: "", staff_id: "", price: 0 }]
    }));
  };

  const removeService = (id: string) => {
    setIssueData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const updateService = (id: string, field: string, value: string | number) => {
    setIssueData(prev => {
      const updated = prev.services.map(s => {
        if (s.id === id) {
          const newS = { ...s, [field]: value };
          if (field === "name") {
            const found = dbServices.find(db => db.name === value);
            if (found) newS.price = found.price;
          }
          return newS;
        }
        return s;
      });
      return { ...prev, services: updated };
    });
  };

  const fetchGiftcards = async () => {
    try {
      setLoading(true);
      const url = currentBranch && currentBranch !== 'all' ? `/api/giftcards?branch=${currentBranch}` : "/api/giftcards";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGiftcards(data.giftcards);
      } else {
        showAlert("Error", data.error || "Failed to load gift cards", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftcards();
  }, [currentCompanyId, currentBranch]); // Refetch if company or branch changes

  const handleIssueGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    try {
      const url = currentBranch && currentBranch !== 'all' ? `/api/giftcards?branch=${currentBranch}` : "/api/giftcards";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...issueData, branch: currentBranch })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "Gift card successfully issued and WhatsApp notification sent!", "success");
        setShowIssueModal(false);
        setIssueData({ 
          amount: "", isCustomAmount: false, purchaser_name: "", purchaser_phone: "", 
          recipient_name: "", recipient_phone: "", message: "", 
          date: new Date().toISOString().split("T")[0], time: "10:00", 
          services: [{ id: Date.now().toString(), name: "", staff_id: "", price: 0 }] 
        });
        fetchGiftcards();
      } else {
        showAlert("Error", data.error || "Failed to issue gift card", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRedeem = async (id: string, code: string) => {
    showConfirm(
      "Redeem Gift Card",
      `Are you sure you want to mark gift card ${code} as redeemed?`,
      async () => {
        try {
          const res = await fetch(`/api/giftcards/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "redeemed" })
          });
          const data = await res.json();
          if (data.success) {
            showAlert("Success", "Gift card successfully marked as redeemed!", "success");
            fetchGiftcards();
          } else {
            showAlert("Error", data.error || "Failed to redeem gift card", "error");
          }
        } catch (err: any) {
          showAlert("Error", err.message, "error");
        }
      },
      "success"
    );
  };

  const handleAssignStaff = async (id: string, staff_id: string) => {
    try {
      const res = await fetch(`/api/giftcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id })
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "Staff assigned successfully!", "success");
        fetchGiftcards();
      } else {
        showAlert("Error", data.error || "Failed to assign staff", "error");
      }
    } catch (err: any) {
      showAlert("Error", err.message, "error");
    }
  };

  const filteredCards = giftcards.filter(g => 
    g.coupon_code?.toLowerCase().includes(search.toLowerCase()) ||
    g.purchaser_phone?.includes(search) ||
    g.recipient_phone?.includes(search) ||
    g.purchaser_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.recipient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f4f7f6] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FaGift className="text-purple-500" />
              Gift Cards Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Verify purchases, track usage, and redeem gift cards for customers.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by code, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-full md:w-80 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowIssueModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shadow-sm transition-colors"
            >
              Issue Gift Card
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Code & Date</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider w-1/6">Service</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider w-1/6">Purchaser</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider w-1/6">Recipient</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider w-1/6">Staff</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider w-1/6">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      Loading gift cards...
                    </td>
                  </tr>
                ) : filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {search ? "No gift cards found matching your search." : "No gift cards purchased yet."}
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-bold text-slate-800">{card.coupon_code}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{new Date(card.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">{card.service_name}</div>
                        <div className="text-[11px] font-bold text-emerald-600 mt-1">QR {card.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{card.purchaser_name}</div>
                        <div className="text-[11px] text-slate-500">{card.purchaser_phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{card.recipient_name}</div>
                        <div className="text-[11px] text-slate-500">{card.recipient_phone}</div>
                        {card.message && (
                          <div className="text-[10px] text-slate-400 italic mt-1 line-clamp-1 max-w-[150px]" title={card.message}>
                            "{card.message}"
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="w-full text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-md p-1.5 focus:outline-none focus:border-purple-500 hover:border-gray-300 transition-colors"
                          value={card.staff_id || ""}
                          onChange={(e) => handleAssignStaff(card.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {(() => {
                            const qualifiedStylists = dbStaff.filter((s: any) => {
                              if (!card.service_name) return true;
                              if (!s.services || !Array.isArray(s.services) || s.services.length === 0) return true;
                              const serviceNameLower = card.service_name.trim().toLowerCase();
                              const categoryLower = dbServices.find(ds => ds.name === card.service_name)?.category?.trim().toLowerCase() || "";
                              return s.services.some((serv: string) => {
                                if (typeof serv !== 'string') return false;
                                const servLower = serv.trim().toLowerCase();
                                if (servLower === serviceNameLower) return true;
                                if (categoryLower) {
                                  if (servLower === categoryLower) return true;
                                  if ((categoryLower === "hair care" || categoryLower === "hair") && (servLower === "hair care" || servLower === "hair")) return true;
                                  if ((categoryLower === "nails & spa" || categoryLower === "nails") && (servLower === "nails & spa" || servLower === "nails")) return true;
                                }
                                return false;
                              });
                            });
                            const finalStylists = qualifiedStylists.length > 0 ? qualifiedStylists : dbStaff;
                            return finalStylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>);
                          })()}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          card.status === 'redeemed' ? 'bg-gray-100 text-gray-500' : 
                          card.status === 'paid' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {card.status === 'active' ? (
                          <button
                            onClick={() => handleRedeem(card.id, card.coupon_code)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          >
                            <FaCheck size={10} />
                            Redeem
                          </button>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                          >
                            <FaCheck size={10} />
                            Redeemed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Issue Gift Card</h2>
            <form onSubmit={handleIssueGiftCard} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date (Optional)</label>
                  <input type="date" value={issueData.date} onChange={e => setIssueData({...issueData, date: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Time (Optional)</label>
                  <select 
                    value={issueData.time} 
                    onChange={e => setIssueData({...issueData, time: e.target.value})} 
                    className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500 bg-white"
                  >
                    <option value="">Select Time</option>
                    {Array.from({ length: (22 - 9) * 4 + 1 }).map((_, i) => {
                      const h = 9 + Math.floor(i / 4);
                      const m = (i % 4) * 15;
                      const val = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Services & Staff</label>
                {issueData.services.map((svc, idx) => {
                  const qualifiedStylists = dbStaff.filter((s: any) => {
                    if (!svc.name) return true;
                    if (!s.services || !Array.isArray(s.services) || s.services.length === 0) return true;
                    const serviceNameLower = svc.name.trim().toLowerCase();
                    const categoryLower = dbServices.find(ds => ds.name === svc.name)?.category?.trim().toLowerCase() || "";
                    return s.services.some((serv: string) => {
                      if (typeof serv !== 'string') return false;
                      const servLower = serv.trim().toLowerCase();
                      if (servLower === serviceNameLower) return true;
                      if (categoryLower) {
                        if (servLower === categoryLower) return true;
                        if ((categoryLower === "hair care" || categoryLower === "hair") && (servLower === "hair care" || servLower === "hair")) return true;
                        if ((categoryLower === "nails & spa" || categoryLower === "nails") && (servLower === "nails & spa" || servLower === "nails")) return true;
                      }
                      return false;
                    });
                  });
                  const finalStylists = qualifiedStylists.length > 0 ? qualifiedStylists : dbStaff;

                  return (
                    <div key={svc.id} className="flex gap-2 mb-2 w-full items-start">
                      <select value={svc.name} onChange={e => updateService(svc.id, "name", e.target.value)} className="w-[60%] border rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500">
                        <option value="">Select Service...</option>
                        {dbServices.map(s => <option key={s.id} value={s.name}>{s.name} (QR {s.price})</option>)}
                      </select>
                      <select value={svc.staff_id} onChange={e => updateService(svc.id, "staff_id", e.target.value)} className="w-[40%] border rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500">
                        <option value="">No Staff</option>
                        {finalStylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {issueData.services.length > 1 && (
                        <button type="button" onClick={() => removeService(svc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">✕</button>
                      )}
                    </div>
                  );
                })}
                <button type="button" onClick={addService} className="text-sm text-purple-600 font-semibold hover:underline mt-1">+ Add another service</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Total Amount (QR) *</label>
                <input required type="number" min="1" value={issueData.amount} onChange={e => setIssueData({...issueData, amount: e.target.value, isCustomAmount: true})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" placeholder="e.g. 500" />
                <p className="text-xs text-slate-400 mt-1">Amount is auto-calculated from selected services, but you can override it.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Purchaser Name *</label>
                  <input required type="text" value={issueData.purchaser_name} onChange={e => setIssueData({...issueData, purchaser_name: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Purchaser Phone *</label>
                  <input required type="tel" value={issueData.purchaser_phone} onChange={e => setIssueData({...issueData, purchaser_phone: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" placeholder="+974..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Recipient Name *</label>
                  <input required type="text" value={issueData.recipient_name} onChange={e => setIssueData({...issueData, recipient_name: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Recipient Phone *</label>
                  <input required type="tel" value={issueData.recipient_phone} onChange={e => setIssueData({...issueData, recipient_phone: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" placeholder="+974..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Message (Optional)</label>
                <textarea rows={3} value={issueData.message} onChange={e => setIssueData({...issueData, message: e.target.value})} className="w-full border rounded-xl p-3 focus:outline-none focus:border-purple-500" placeholder="Happy Birthday!" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={isIssuing} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
                  {isIssuing ? "Issuing..." : "Issue Gift Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
