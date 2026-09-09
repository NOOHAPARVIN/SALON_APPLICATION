"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar, FaQuoteLeft, FaSpinner } from "react-icons/fa";
import { useBranch } from "@/lib/BranchContext";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <FaStar key={i} className="text-yellow-400 text-xs" />
        ) : (
          <FaRegStar key={i} className="text-gray-200 text-xs" />
        )
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentBranch } = useBranch();

  useEffect(() => {
    fetchReviews();
  }, [currentBranch]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = currentBranch && currentBranch !== 'all' ? `/api/reviews?branch=${currentBranch}` : "/api/reviews";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";
    
  const fiveStars = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="p-6 xl:p-8 bg-[#f4f7f6] min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#ffc107]/15 p-3 rounded-xl">
            <FaStar className="text-[#ffc107] text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Customer Reviews</h1>
            <p className="text-gray-400 text-sm">What your clients are saying</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaSpinner className="animate-spin text-4xl text-[#d4af37] mb-4" />
            <p>Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <FaStar className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Reviews Yet</h3>
            <p className="text-gray-500">When customers submit reviews on the website, they will appear here.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-5xl font-bold text-slate-800">{avgRating}</p>
                <div className="flex justify-center mt-2 mb-1">
                  <StarRating rating={Math.round(Number(avgRating))} />
                </div>
                <p className="text-xs text-gray-400">Average Rating</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-5xl font-bold text-slate-800">{reviews.length}</p>
                <p className="text-xs text-gray-400 mt-3">Total Reviews</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-5xl font-bold text-[#ffc107]">{fiveStars}</p>
                <p className="text-xs text-gray-400 mt-3">5-Star Reviews</p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-slate-800 mb-4">Rating Breakdown</h2>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = Math.round((count / reviews.length) * 100);
                return (
                  <div key={star} className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-xs text-gray-500 font-semibold">{star}</span>
                      <FaStar className="text-yellow-400 text-[10px]" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff6b35]/10 flex items-center justify-center text-[#ff6b35] font-bold text-sm flex-shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {r.service && <span>{r.service}</span>}
                          {r.service && r.stylist && <span> · </span>}
                          {r.stylist && <span>{r.stylist}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={r.rating} />
                      <p className="text-[10px] text-gray-300 mt-1">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  {r.comment && (
                    <div className="relative pl-4 mt-2">
                      <FaQuoteLeft className="absolute left-0 top-0 text-gray-100 text-lg" />
                      <p className="text-sm text-gray-500 italic leading-relaxed">{r.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
