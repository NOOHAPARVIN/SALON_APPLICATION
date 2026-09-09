import Image from "next/image";
import Link from "next/link";

export default function Gallery() {
  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-12 lg:gap-20 bg-white rounded-[2rem] p-8 lg:p-16 shadow-[0_10px_40px_rgba(197,160,89,0.05)] border border-[var(--color-border)]">
      {/* Left side Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }} className="w-full md:w-1/2 relative h-[600px] lg:h-[800px] rounded-[2rem] overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-500 bg-[#faf6f0]">
        <Image
          src="/images/rospa-massage-prices.jpg"
          alt="Massage Services Prices"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transform transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 border-[12px] border-white/30 rounded-[2rem] pointer-events-none transition-all duration-700 group-hover:border-white/10" />
      </div>

      {/* Right side Text */}
      <div className="w-full md:w-1/2 flex flex-col items-start text-left">
        <h3 className="font-['Great_Vibes'] text-[var(--color-gold)] text-4xl mb-2">
          Experience
        </h3>
        <h2 className="font-['Playfair_Display'] text-[var(--color-text-main)] font-normal text-3xl md:text-5xl mb-6 tracking-wide">
          A Place to<br />Relax & Unwind
        </h2>
        
        <p className="font-['Montserrat'] text-[var(--color-text-muted)] text-lg leading-relaxed mb-10 max-w-lg">
          Step into our sanctuary of beauty and wellness. Our modern facilities are designed to provide the ultimate comfort and luxury while our experts take care of your every need.
        </p>

        <Link href="/gallery">
          <button className="px-10 py-4 rounded-full border border-[var(--color-gold)] text-[var(--color-text-main)] font-['Montserrat'] font-semibold text-xs tracking-widest uppercase hover:bg-[var(--color-gold)] hover:text-white transition-all duration-300 shadow-sm">
            View Full Gallery
          </button>
        </Link>
      </div>
    </div>
  );
}