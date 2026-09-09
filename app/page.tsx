import Hero from "@/components/Hero";
import Services from "@/components/services";
import Gallery from "@/components/Gallery";

import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import Image from "next/image";
import ReviewForm from "@/components/ReviewForm";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-main)] font-['Montserrat']">
      
      {/* HERO */}
      <Hero />



      {/* SERVICES */}
      <section id="services" className="pt-32 pb-16 px-5 max-w-[1400px] mx-auto">
        <h1 className="text-center text-4xl md:text-5xl lg:text-[55px] font-['Playfair_Display'] font-normal tracking-wide text-[var(--color-text-main)] mb-16 drop-shadow-sm">
          Our Premium Services
        </h1>
        <AnimatedSection>
          <Services />
        </AnimatedSection>
      </section>

      {/* OFFERS */}

      {/* GALLERY */}
      <section className="pt-24 pb-32 px-5 max-w-[1400px] mx-auto">
        <h1 className="text-center text-4xl md:text-5xl lg:text-[55px] font-['Playfair_Display'] font-normal tracking-wide text-[var(--color-text-main)] mb-16 drop-shadow-sm">
          Gallery
        </h1>
        <AnimatedSection>
          <Gallery />
        </AnimatedSection>
      </section>

      {/* REVIEWS FORM */}
      <section className="py-24 px-5 bg-[var(--color-gold-light)]/20 border-y border-[var(--color-gold)]/20">
        <div className="max-w-[1400px] mx-auto">
          <AnimatedSection>
            <ReviewForm />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-b from-white/40 to-white/90 border-t border-[var(--color-gold)]/20 py-32 px-5 text-center relative overflow-hidden">
        {/* Decorative corner leaves */}
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-30 pointer-events-none transform -rotate-90 -mb-16 -ml-16">
          <svg width="192" height="192" viewBox="0 0 100 100" className="w-full h-full fill-[var(--color-gold-light)]">
            <path d="M0,0 L100,0 C100,0 70,20 50,50 C30,80 0,100 0,100 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="font-['Playfair_Display'] text-[var(--color-text-main)] text-4xl md:text-5xl mb-6 font-normal drop-shadow-sm">
            Experience Luxury & Relaxation
          </h2>

          <p className="font-['Montserrat'] text-[var(--color-text-muted)] max-w-[700px] mx-auto mb-12 text-lg leading-relaxed font-light">
            Indulge in premium beauty treatments, expert hairstyling,
            rejuvenating facials, nail care, and wellness experiences designed
            to leave you feeling confident and refreshed.
          </p>

          <Link href="/booking">
            <button className="px-10 py-4 rounded-full bg-[var(--color-text-main)] text-white font-['Montserrat'] font-semibold text-sm tracking-widest uppercase hover:bg-[var(--color-gold)] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
              Book Your Appointment
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}