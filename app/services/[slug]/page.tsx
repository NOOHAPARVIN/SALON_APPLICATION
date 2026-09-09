import { services } from "@/components/serviceData";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceBanner from "@/components/ServiceBanner";
import ServiceReviews from "@/components/ServiceReviews";

type Props = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: Props) {
  const service = services.find((s) => s.slug === params.slug);

  return {
    title: service
      ? `${service.name} | Rospa Salon`
      : "Service Details | Rospa Salon",
    description: service
      ? `Explore our premium list of ${service.name.toLowerCase()} for the ultimate beauty and styling experience.`
      : "Premium salon services.",
  };
}

import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export default async function ServicePage({ params }: Props) {
  const service = services.find((s) => s.slug === params.slug);

  if (!service) {
    return notFound();
  }

  // Fetch live items from Supabase
  const { data: dbItems } = await supabase
    .from('services')
    .select('*')
    .eq('category', service.name)
    .eq('branch', 'rospa')
    .eq('is_active', true);

  const displayItems = dbItems && dbItems.length > 0 
    ? dbItems.map((dbItem: any) => {
        const staticItem = service.items.find(si => si.name === dbItem.name || si.bookingName === dbItem.name);
        return {
          name: dbItem.name,
          price: dbItem.price,
          description: dbItem.description || (staticItem ? staticItem.description : ""),
          image: staticItem ? staticItem.image : "/images/placeholder.png",
          bookingName: dbItem.name
        };
      })
    : service.items;

  /* =========================
     CATEGORY MATCHING
  ========================= */
  const categoryMap: Record<string, string> = {
    "hair-services": "Hair Care",
    "massage-services": "Massage",
    "nail-services": "Nails & Spa",
    "facial-services": "Facials",
    "lashes-services": "Eye Lashes",
    "spa-services": "Spa",
  };

  const bookingCategory = categoryMap[service.slug.toLowerCase()] || service.slug;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pt-32 pb-24 px-5">
      {/* BANNER */}
      <ServiceBanner title={service.name} primaryImage={service.image} />

      {/* SERVICES GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayItems.map((item: any, index: number) => (
          <div
            key={index}
            className="bg-[#f8f9f5] border border-[var(--color-border)] rounded-[3rem] p-8 flex flex-col items-center text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            {/* ROUND IMAGE */}
            <div className="relative w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-1 w-full items-center justify-between">
              <div className="flex flex-col items-center w-full">
                <span className="inline-block bg-[var(--color-gold)] text-white px-5 py-1.5 rounded-full text-sm font-bold tracking-widest mb-4 shadow-sm">
                  {(service.name === "Hair" || service.name === "Hair Care") ? "Starting from " : ""}QR {item.price}
                </span>
                
                <h3 className="font-['Playfair_Display'] text-[var(--color-text-main)] text-2xl font-semibold mb-4 w-full">
                  {item.name}
                </h3>

                <p className="font-['Montserrat'] text-[var(--color-text-muted)] text-sm leading-relaxed mb-8 font-medium">
                  {item.description}
                </p>
              </div>

              {/* BOOK BUTTON */}
              <Link
                href={`/booking?category=${encodeURIComponent(bookingCategory)}&service=${encodeURIComponent(item.bookingName || item.name)}`}
                className="w-full"
              >
                <button className="w-full py-4 rounded-full bg-transparent border-2 border-[var(--color-text-main)] text-[var(--color-text-main)] font-['Montserrat'] font-bold text-xs md:text-sm tracking-[0.15em] uppercase hover:bg-[var(--color-text-main)] hover:text-white transition-colors duration-300">
                  Book Appointment
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* VIDEO SECTION */}
      {service.videoUrl && (
        <div className="max-w-4xl mx-auto mt-20 px-4">
          <h3 className="text-center font-['Playfair_Display'] text-3xl md:text-4xl text-[var(--color-text-main)] mb-12 relative pb-4">
            See Our Process
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[var(--color-gold)] rounded-full"></div>
          </h3>
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            {service.videoUrl.includes("youtube") || service.videoUrl.includes("vimeo") ? (
              <iframe
                className="w-full h-full object-cover"
                src={service.videoUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video 
                className="w-full h-full object-cover" 
                controls 
                autoPlay 
                muted 
                loop
                playsInline
              >
                <source src={service.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}

      {/* GALLERY SECTION */}
      {service.galleryImages && service.galleryImages.length > 0 && (
        <div className="max-w-5xl mx-auto mt-20 px-4">
          <h3 className="text-center font-['Playfair_Display'] text-3xl md:text-4xl text-[var(--color-text-main)] mb-12 relative pb-4">
            Our Work
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[var(--color-gold)] rounded-full"></div>
          </h3>
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {service.galleryImages.map((img, idx) => (
              <div key={idx} className="break-inside-avoid overflow-hidden rounded-2xl shadow-lg border-2 border-white hover:scale-[1.02] transition-transform duration-300">
                <img src={img} alt={`Gallery image ${idx + 1}`} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS SECTION */}
      {service.reviews && service.reviews.length > 0 && (
        <ServiceReviews reviewImages={service.reviews} />
      )}
    </div>
  );
}