"use client";

import { useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API request delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-main)] font-['Montserrat'] pt-32 pb-24 px-5">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER */}
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-5xl md:text-6xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-6 drop-shadow-sm">
              Contact Us
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed font-light">
              Have questions about our services or need assistance booking an exclusive package? 
              Get in touch with us today, and our concierge team will reach back to you shortly.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT COLUMN: CONTACT DETAILS & HOURS */}
          <AnimatedSection>
            <div className="flex flex-col gap-10">
              <div>
                <h2 className="text-3xl font-['Playfair_Display'] text-[var(--color-text-main)] mb-4">
                  Get In Touch
                </h2>
                <p className="text-[var(--color-text-muted)] leading-relaxed font-light">
                  Experience hospitality at its finest. Drop by or reach out using any of the channels below.
                </p>
              </div>

              {/* CONTACT LIST */}
              <div className="flex flex-col gap-6">
                {[
                  {
                    icon: "📍",
                    label: "Address",
                    val: (
                      <>
                        Rospa saloon<br />
                        Mirqab mall (Inside mirqab mall)<br />
                        E block<br />
                        Third floor<br />
                        <a href="https://maps.app.goo.gl/he22Qy3vpvP5BS188" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:underline mt-1 inline-block">
                          View on Google Maps
                        </a>
                      </>
                    ),
                  },
                  {
                    icon: "📞",
                    label: "Phone",
                    val: "+974 7158 9464 / +974 5546 4490",
                  },
                  {
                    icon: "✉️",
                    label: "Email",
                    val: "reservations@luxurysalon.com",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-5 items-start bg-[var(--color-bg-secondary)] p-6 rounded-3xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <h4 className="text-[var(--color-gold)] font-['Playfair_Display'] text-xl mb-1 font-semibold">
                        {item.label}
                      </h4>
                      <p className="text-[var(--color-text-muted)] text-sm">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* HOURS */}
              <div className="bg-[var(--color-bg-secondary)] p-8 rounded-3xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-[var(--color-text-main)] font-['Playfair_Display'] text-2xl mb-6 font-semibold">
                  Opening Hours
                </h3>
                <div className="flex flex-col gap-4">
                  {[
                    { days: "Saturday - Thursday", time: "9:00 AM - 10:00 PM" },
                    { days: "Friday", time: "2:00 PM - 10:00 PM" },
                  ].map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                      <span className="text-[var(--color-text-muted)]">{h.days}</span>
                      <span className="text-[var(--color-gold)] font-bold">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <AnimatedSection>
            <div className="bg-white/60 backdrop-blur-md p-10 md:p-12 rounded-[3rem] border border-[var(--color-border)] shadow-xl relative min-h-[500px] flex flex-col justify-center">
              {isSubmitted ? (
                <div className="text-center animate-[fadeIn_0.5s_ease]">
                  <div className="w-20 h-20 rounded-full border-4 border-[var(--color-gold)] flex items-center justify-center mx-auto mb-6 text-[var(--color-gold)] text-4xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-[var(--color-text-main)] font-['Playfair_Display'] text-3xl mb-4">
                    Thank You!
                  </h3>
                  <p className="text-[var(--color-text-muted)] leading-relaxed font-light mb-8">
                    Your message has been sent successfully. Our guest relations team will contact you shortly
                    to assist with your inquiries.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-8 py-3 rounded-full bg-[var(--color-text-main)] text-white font-['Montserrat'] font-semibold text-sm tracking-widest uppercase hover:bg-[var(--color-gold)] transition-all duration-300 shadow-md"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <h2 className="text-[var(--color-text-main)] font-['Playfair_Display'] text-3xl mb-4">
                    Send Us A Message
                  </h2>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--color-text-muted)] text-sm font-semibold uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-white/50 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--color-text-muted)] text-sm font-semibold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-white/50 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--color-text-muted)] text-sm font-semibold uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-white/50 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--color-text-muted)] text-sm font-semibold uppercase tracking-wider">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      className="p-4 rounded-xl border border-[var(--color-border)] bg-white/50 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`mt-4 py-4 rounded-full font-['Montserrat'] font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-md ${
                      isSubmitting 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-[var(--color-text-main)] text-white hover:bg-[var(--color-gold)] cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    }`}
                  >
                    {isSubmitting ? "Sending..." : "Submit Message"}
                  </button>
                </form>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
