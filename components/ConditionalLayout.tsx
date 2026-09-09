"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isDashboard = pathname.startsWith("/dashboard");
  const isPortal = pathname.startsWith("/portal") || pathname.startsWith("/admin");

  if (isDashboard || isPortal) {
    // Dashboard & Portal: clean layout without website headers/footers
    return (
      <div
        style={{
          background: isPortal ? "#0f172a" : "#f4f7f6",
          color: isPortal ? "#ffffff" : "#1e293b",
          minHeight: "100vh",
          fontFamily: "'Inter', 'Montserrat', sans-serif",
        }}
      >
        {children}
      </div>
    );
  }

  // Public site: dark salon theme + Navbar + Footer + Floating WhatsApp button
  return (
    <div
      style={{
        background: "var(--color-bg-primary)",
        color: "var(--color-text-main)",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <main>{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
