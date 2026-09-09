"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Hero() {
  const slides = [
    {
      src: "/images/hero-lobby-restyled.png",
      title: "Luxury Salon Experience",
      subtitle: "Unwind in our serene environment tailored for your absolute comfort.",
    },
    {
      src: "/images/hairhero.png",
      title: "Perfect Hair Styling",
      subtitle: "Modern cuts, coloring and styling tailored to your unique look.",
    },
    {
      src: "/images/herofacial.png",
      title: "Glow & Refresh",
      subtitle: "Luxury facial treatments designed for radiant, healthy skin.",
    },
    {
      src: "/images/msghero.png",
      title: "Ultimate Relaxation",
      subtitle: "Rejuvenating massages to melt away stress and tension.",
    },
    {
      src: "/images/heromani.png",
      title: "Pristine Nail Care",
      subtitle: "Elegant manicures and pedicures for a flawless finish.",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '95vh' }} className="relative w-full min-h-[95vh] flex flex-col justify-center items-center overflow-hidden pt-20 pb-10">
      
      {/* Background Image Slider */}
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          style={{ position: 'absolute', inset: 0 }}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            sizes="100vw"
            className={`object-cover object-center ${index === current ? "animate-ken-burns" : ""}`}
            priority={index === 0}
            style={{ animation: index === current ? 'kenBurns 10s linear forwards' : 'none' }}
          />
        </div>
      ))}

      {/* Dark Olive Overlay for Text Readability */}
      <div className="absolute inset-0 z-[5] bg-[#1a291c]/45 mix-blend-multiply" />
      <div className="absolute inset-0 z-[5] bg-black/20" />

      {/* Fade out to background color at the bottom to blend with next section */}
      <div className="absolute inset-x-0 bottom-0 h-[300px] z-[6] bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/70 to-transparent" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-5 w-full flex-1">
        
        {/* Dynamic Text Content */}
        <div className="relative w-full h-48 flex items-center justify-center z-10">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute flex flex-col items-center justify-center w-full transition-all duration-1000 ease-in-out ${
                index === current 
                  ? "opacity-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <h1 className="font-['Playfair_Display'] text-transparent bg-clip-text bg-gradient-to-r from-[#e6c200] via-[#ffdf59] to-[#e6c200] text-5xl md:text-7xl lg:text-8xl tracking-wide font-normal drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] mb-6">
                {slide.title}
              </h1>
              <p className="font-['Montserrat'] text-[#E8E6D9] text-lg md:text-2xl max-w-2xl font-light mb-12 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {slide.subtitle}
              </p>
            </div>
          ))}
        </div>

      </div>
      
      {/* Buttons positioned at the bottom, just above the next section */}
      <div className="absolute bottom-16 z-20 flex flex-col sm:flex-row items-center gap-6" style={{ animation: 'slideUpFade 0.8s ease-out 0.8s forwards' }}>
        <Link href="/booking">
          <button className="px-10 py-4 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5e6a8] to-[#d4af37] text-[var(--color-text-main)] font-['Montserrat'] font-bold text-xs md:text-sm tracking-[0.2em] uppercase hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-none hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)]">
            Book Appointment
          </button>
        </Link>
        <Link href="/services">
          <button className="px-10 py-4 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5e6a8] to-[#d4af37] text-[var(--color-text-main)] font-['Montserrat'] font-bold text-xs md:text-sm tracking-[0.2em] uppercase hover:scale-105 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-none hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)]">
            Explore Services
          </button>
        </Link>
      </div>
    </section>
  );
}