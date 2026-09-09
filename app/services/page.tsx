import Services from "@/components/services";

export const metadata = {
  title: "Our Premium Services | Luxury Salon & Spa",
  description:
    "Explore our range of premium hair styling, spa massages, advanced facials, and nail art services at Luxury Salon.",
};

export default function ServicesPage() {
  return (
    <div
      id="services-page"
      className="min-h-screen pt-24 pb-16 px-6 relative z-10"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-main)",
      }}
    >
      <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
        <h1
          id="services-heading"
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{
            color: "var(--color-gold)",
            fontFamily: "var(--font-heading)",
          }}
        >
          Our Premium Services
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed font-light"
          style={{
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Indulge yourself with our wide range of world-class beauty, styling, and wellness services.
          Every treatment is custom-tailored to provide the ultimate luxury experience.
        </p>
      </div>

      <div className="relative z-10">
        <Services />
      </div>
    </div>
  );
}
