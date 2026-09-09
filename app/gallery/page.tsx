"use client";

import { useState } from "react";
import Image from "next/image";

const galleryImages = [
  { src: "/images/real_work_1.jpg", category: "Nails" },
  { src: "/images/real_work_2.jpg", category: "Nails" },
  { src: "/images/real_work_3.jpg", category: "Hair" },
  { src: "/images/real_work_4.jpg", category: "Nails" },
  { src: "/images/real_work_5.jpg", category: "Nails" },
  { src: "/images/real_work_6.jpg", category: "Nails" }
];

const categories = ["All", "Hair", "Massage", "Nails", "Facial", "Styling", "Interior"];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const filteredImages = selectedCategory === "All"
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-main)] pb-24 pt-36 px-5 min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="font-['Great_Vibes'] text-[var(--color-gold)] text-6xl md:text-7xl mb-6">
          Luxury Gallery
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
          Take a visual journey through our high-end luxury salon. Discover our modern interior design,
          precision hair stylings, relaxing therapy sessions, and pristine nail designs.
        </p>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex justify-center flex-wrap gap-4 mb-16 max-w-5xl mx-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-full border-2 transition-all duration-300 font-bold uppercase tracking-widest text-xs
              ${
                selectedCategory === category
                  ? "bg-[var(--color-gold)] border-[var(--color-gold)] text-white shadow-md"
                  : "bg-transparent border-[var(--color-gold)]/40 text-[var(--color-gold)] hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/10"
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {filteredImages.map((img, i) => (
          <div
            key={i}
            onClick={() => setLightboxImage(img.src)}
            className="group relative overflow-hidden rounded-3xl cursor-pointer h-[300px] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
          >
            <Image
              src={img.src}
              alt={`${img.category} Gallery Image`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transform group-hover:scale-105 transition-transform duration-500"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 text-center">
              <span className="text-[var(--color-text-main)] text-xs font-bold uppercase tracking-widest mb-2 border-b border-[var(--color-text-main)]/20 pb-1">
                {img.category}
              </span>
              <span className="text-[var(--color-gold)] font-['Great_Vibes'] text-3xl mt-2">
                Expand
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[9999] cursor-pointer p-5"
        >
          <div
            className="relative w-full max-w-5xl h-[80vh]"
            onClick={(e) => e.stopPropagation()} // Prevent close on clicking image
          >
            <Image
              src={lightboxImage}
              alt="Expanded Gallery View"
              fill
              className="object-contain"
            />

            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 bg-transparent border-none text-white hover:text-[var(--color-gold)] text-5xl cursor-pointer transition-colors"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
