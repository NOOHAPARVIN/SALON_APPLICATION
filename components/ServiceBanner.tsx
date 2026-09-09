"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ServiceBannerProps {
  title: string;
  primaryImage: string;
}

export default function ServiceBanner({ title, primaryImage }: ServiceBannerProps) {
  // Only use the primary image passed to the banner so unrelated images don't appear
  const images = [primaryImage];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Change image every 2 seconds for a fast, dynamic feel
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 2000); 

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }} className="relative max-w-5xl mx-auto h-64 md:h-80 rounded-[3rem] overflow-hidden mb-16 shadow-xl flex items-center justify-center">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        >
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}
      
      {/* Dark overlay to ensure text is always readable regardless of the changing images */}
      <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
      
      {/* Title */}
      <h1 className="relative z-20 font-['Playfair_Display'] text-white text-5xl md:text-7xl font-normal drop-shadow-lg tracking-wide text-center px-4">
        {title}
      </h1>
    </div>
  );
}
