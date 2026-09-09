"use client";

import Image from "next/image";
import Link from "next/link";
import { services } from "@/components/serviceData";

export default function Services() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {services.map((service) => (
          <div
            key={service.slug}
            className="relative rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group border max-w-[320px] mx-auto w-full bg-[#f8f9f5] border-[var(--color-border)]"
          >
            {/* Top Image Half */}
            <div style={{ position: 'relative', overflow: 'hidden' }} className="relative w-full h-40 overflow-hidden">
              <Image
                src={service.image}
                alt={service.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Bottom Text Half */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-[var(--color-text-main)] font-['Playfair_Display'] font-semibold text-xl mb-2">
                {service.name}
              </h3>

              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-5 font-['Montserrat'] font-light flex-1">
                Luxury {service.name.toLowerCase()} service with premium care and expert professionals.
              </p>

              <Link href={`/services/${service.slug}`} className="w-full">
                <button className="w-full py-3 rounded-full font-['Montserrat'] font-bold text-xs tracking-[0.15em] uppercase hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#d4af37] via-[#f5e6a8] to-[#d4af37] text-[var(--color-text-main)] shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_30px_rgba(212,175,55,0.3)]">
                  View Service
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
