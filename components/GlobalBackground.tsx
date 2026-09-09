"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function GlobalBackground() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not render floating images on dashboard pages
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      
      {/* SVG Definitions for 3D Gradients */}
      <svg width="0" height="0" style={{ position: 'absolute', display: 'block' }} className="absolute">
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdf8e7"/>
            <stop offset="40%" stopColor="#e8d59b"/>
            <stop offset="100%" stopColor="#d1ba75"/>
          </linearGradient>
          <linearGradient id="olive" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8ba38d"/>
            <stop offset="50%" stopColor="#9bb59e"/>
            <stop offset="100%" stopColor="#7a917c"/>
          </linearGradient>
          <linearGradient id="olive-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#69806b"/>
            <stop offset="100%" stopColor="#586e59"/>
          </linearGradient>
        </defs>
      </svg>

    </div>
  );
}
