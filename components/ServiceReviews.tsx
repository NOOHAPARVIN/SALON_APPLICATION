"use client";

import Image from "next/image";

export default function ServiceReviews({ reviewImages }: { reviewImages?: string[] }) {
  if (!reviewImages || reviewImages.length === 0) return null;

  return (
    <div className="mt-20 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <span className="inline-block bg-[var(--color-gold)] text-white px-6 py-2 text-2xl md:text-3xl font-black italic uppercase tracking-wider transform -rotate-2 shadow-md">
          Client Love
        </span>
      </div>
      
      <div className="flex flex-wrap justify-center items-center pb-16 pt-4 gap-6 md:gap-4">
        {reviewImages.map((src, idx) => {
          const rotations = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2"];
          const rotClass = rotations[idx % rotations.length];
          const zIndex = (idx % 3) === 0 ? "z-20" : (idx % 2) === 0 ? "z-10" : "z-30";
          
          return (
            <div 
              key={idx} 
              className={`relative bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] border-4 border-[var(--color-gold)]/80 w-[300px] sm:w-[350px] md:w-[450px] m-2 md:-m-4 hover:z-50 transition-all duration-300 transform hover:scale-[1.05] overflow-hidden rounded-md ${rotClass} ${zIndex}`}
            >
              {/* Using standard img for simplicity with external or unoptimized paths */}
              <img src={src} alt={`Client Review ${idx + 1}`} className="w-full h-auto object-cover block" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
