import Image from "next/image";
import staffData from "@/components/staffData";

export const metadata = {
  title: "About Us | Luxury Salon & Spa",
  description:
    "Learn about our premium salon experience, professional team of stylists and spa therapists, and our commitment to elegance and relaxation.",
};

export default function AboutPage() {
  const specialties = Object.keys(staffData);

  return (
    <div className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-main)] pb-24 font-['Montserrat']">
      {/* HEADER TITLE */}
      <div className="w-full flex items-center justify-center pt-32 pb-16 mb-10 border-b border-[var(--color-gold)]/20">
        <h1 className="text-5xl md:text-6xl font-['Playfair_Display'] text-[var(--color-text-main)] drop-shadow-sm">
          About Us
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-5 relative z-10">
        {/* STORY SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-24 items-center">
          <div>
            <h2 className="font-['Playfair_Display'] text-[var(--color-text-main)] text-4xl md:text-5xl mb-6">
              Our Vision
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg leading-relaxed mb-6 font-light">
              Founded with the vision of offering a sanctuary of relaxation and world-class beauty services,
              Luxury Salon combines cutting-edge styling techniques with premium treatments. We believe that
              every guest deserves personalized care and an unforgettable experience.
            </p>
            <p className="text-[var(--color-text-muted)] text-lg leading-relaxed font-light">
              From professional hair design and bespoke skincare to therapeutic massages, our artists and
              therapists are dedicated to enhancing your natural charm and revitalizing your spirit in an
              atmosphere of pure indulgence.
            </p>
          </div>

          <div className="relative h-[450px] w-full rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(197,160,89,0.1)] border-4 border-white transform transition hover:scale-[1.02] duration-500">
            <Image
              src="/images/8.jpeg"
              alt="Luxury Treatment Room"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* WHY CHOOSE US */}
        <div className="mb-24">
          <h2 className="text-center font-['Playfair_Display'] text-[var(--color-text-main)] text-4xl md:text-5xl mb-12">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Expert Stylists",
                text: "Our certified team has years of international training to provide premium outcomes.",
              },
              {
                title: "Luxe Ambiance",
                text: "Step into our serene, beautifully styled space designed for your total comfort.",
              },
              {
                title: "Top Quality Products",
                text: "We use only clinically proven, high-end beauty products.",
              },
              {
                title: "Custom Care",
                text: "Every treatment starts with a consultation to match your specific wishes.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-[var(--color-border)] hover:shadow-[0_15px_30px_rgba(197,160,89,0.1)] hover:-translate-y-2 transition-all duration-500 text-center flex flex-col items-center group"
              >
                <h3 className="text-[var(--color-text-main)] font-['Montserrat'] font-semibold mb-4 uppercase tracking-wider text-[11px] group-hover:text-[var(--color-gold)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed font-light">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM/STAFF SECTION */}
        <div>
          <h2 className="text-center font-['Playfair_Display'] text-[var(--color-text-main)] text-4xl md:text-5xl mb-4">
            Our Experts & Stylists
          </h2>
          <p className="text-center text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto mb-16 font-light">
            Meet our highly trained and friendly professionals dedicated to your styling and relaxation.
          </p>

          <div className="flex flex-col gap-12">
            {[
              {
                name: "Jocelyn",
                photo: "",
                specialties: "Hair Styling, Waxing, Nails",
                nationality: "Filipina",
                experience: "A passionate 23-year-old professional offering a versatile skill set in modern hair styling, meticulous waxing, and precision nail care."
              },
              {
                name: "Feriel",
                photo: "/images/feriel.jpeg",
                specialties: "Manicure & Nail Art",
                nationality: "French",
                experience: "Highly creative nail technician with 8 years of experience in intricate nail artistry and premium hand care."
              },
              {
                name: "Reham",
                photo: "/images/reham.jpeg",
                specialties: "Spa & Massage Therapy",
                nationality: "Egyptian",
                experience: "A holistic therapist offering soothing full-body relaxation, combining traditional and modern spa techniques."
              },
              {
                name: "Ramsi",
                photo: "/images/ramsi.jpeg",
                specialties: "Advanced Facials",
                nationality: "Indian",
                experience: "Skincare specialist focusing on anti-aging treatments, HydraFacials, and glowing complexion therapies."
              },
              {
                name: "Zara",
                photo: "",
                specialties: "Pedicure & Manicure",
                nationality: "Lebanese",
                experience: "Dedicated to pristine nail care, providing detailed and luxurious hand and foot treatments."
              },
              {
                name: "Kopila",
                photo: "/images/kopila.jpeg",
                specialties: "Hair Spa Treatments",
                nationality: "Nepali",
                experience: "Expert in deep conditioning, scalp health, and luxurious hair revitalization therapies."
              },
              {
                name: "Maggy",
                photo: "/images/maggy.jpeg",
                specialties: "Massage Therapy",
                nationality: "Thai",
                experience: "Certified massage therapist with 15 years of experience in Deep Tissue, Thai, and holistic relaxation massages."
              },
              {
                name: "Rebecca",
                photo: "",
                specialties: "Haircut & Spa",
                nationality: "British",
                experience: "Precision stylist known for creating elegant, low-maintenance looks tailored to individual face shapes."
              },
              {
                name: "Nancy",
                photo: "",
                specialties: "Massage Therapy",
                nationality: "Filipino",
                experience: "Skilled massage therapist specializing in deep tissue and full body relaxation techniques."
              },
              {
                name: "Yashodha",
                photo: "",
                specialties: "Lash & Spa Specialist",
                nationality: "Indian",
                experience: "Expert in eyelash extensions, foot reflexology, and luxurious hair spa treatments."
              },
              {
                name: "Sajal",
                photo: "",
                specialties: "Hair Stylist",
                nationality: "Indian",
                experience: "Creative hair stylist dedicated to delivering personalized and vibrant hair transformations."
              }
            ].map((staff, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row items-start gap-10 md:gap-16 mb-24 last:mb-0"
              >
                {/* Photo */}
                <div className={`w-full md:w-1/4 lg:w-1/5 shrink-0 ${idx % 2 === 1 ? 'md:order-last' : ''}`}>
                  <div className="relative aspect-[3/4] bg-white p-1.5 border-[1px] border-gray-300 shadow-sm">
                    {staff.photo ? (
                      <Image
                        src={staff.photo}
                        alt={staff.name}
                        fill
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#faf6f0]">
                        <span className="text-4xl text-[var(--color-gold)] font-['Great_Vibes'] tracking-widest">{staff.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="w-full md:w-3/4 lg:w-4/5 flex flex-col pt-2 md:pt-4">
                  <h3 className="font-['Great_Vibes'] text-[#67827e] text-5xl md:text-6xl mb-8 capitalize tracking-wide">
                    {staff.name}
                  </h3>
                  <div className="text-[var(--color-text-main)] text-base md:text-[17px] leading-[1.8] font-light space-y-6">
                    <p>
                      <strong className="font-medium text-gray-800">Specializing in {staff.specialties}.</strong> {staff.experience}
                    </p>
                    <p>
                      Bringing a wealth of knowledge and a rich <strong className="font-medium text-gray-800">{staff.nationality}</strong> background, 
                      I am dedicated to ensuring every client leaves feeling completely rejuvenated, confident, and beautiful.
                    </p>
                    <p>
                      Being able to do what I love every day makes it incredibly rewarding. I take time to understand exactly 
                      what you're looking for, delivering tailored treatments that match your unique style and needs.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
