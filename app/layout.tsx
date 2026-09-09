import ConditionalLayout from "@/components/ConditionalLayout";
import GlobalBackground from "@/components/GlobalBackground";
import { ModalProvider } from "@/components/ModalContext";
import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Salon Management",
    default: "Salon Management System",
  },
  description: "Experience the ultimate in luxury at Rospa Salon. We offer premium haircuts, expert coloring, relaxing massages, rejuvenating facials, and high-end nail care.",
  keywords: ["salon", "spa", "haircut", "massage", "facial", "nails", "luxury", "beauty"],
  openGraph: {
    title: "Rospa Salon | Premium Hair, Beauty & Spa Services",
    description: "Experience the ultimate in luxury at Rospa Salon.",
    url: "https://rospa-salon.com",
    siteName: "Rospa Salon",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rospa Salon Interior",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rospa Salon",
  },
};

export const viewport: Viewport = {
  themeColor: "#5c54b6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Critical CSS to prevent FOUC – loads synchronously before any external CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          img { max-width: 100%; height: auto; display: block; }
          svg { max-width: 100%; overflow: hidden; }
          svg:not([width]) { max-width: 2rem; max-height: 2rem; }
          img[data-nimg="fill"] { max-width: 100% !important; max-height: 100% !important; }
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f3ebdf',
          color: '#3a4a35',
          fontFamily: "'Montserrat', 'Inter', sans-serif",
          overflowX: 'hidden',
        }}
      >
        <ModalProvider>
          <GlobalBackground />
          <ConditionalLayout>{children}</ConditionalLayout>
        </ModalProvider>
      </body>
    </html>
  );
}