"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("customer");

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserRole(session.user.id);
      } else {
        setRole("customer");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  async function getUserRole(userId: string) {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      if (data?.role) {
        setRole(data.role);
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
      setRole("customer");
    }
  }

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    if (user) {
      getUserRole(user.id);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut(); // Clear local storage too
    setUser(null);
    setRole("customer");
    setIsMobileOpen(false);
    router.refresh();
    router.push("/login");
  }

  /* =========================
     PROTECTED BOOK NOW
  ========================= */
  const handleBookNow = () => {
    setIsMobileOpen(false);
    router.push(`/booking`);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className={styles.navbarWrapper}>
      {/* MAIN NAV */}
      <nav className={styles.nav}>
        
        {/* LOGO & HAMBURGER HEADER */}
        <div className={styles.navHeader}>
          <div className={styles.navLeft}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoCircle} style={{ position: 'relative', width: '100px', height: '100px', overflow: 'hidden', borderRadius: '50%' }}>
                <Image
                  src="/images/logo.jpeg"
                  alt="Luxury Salon Logo"
                  fill
                  sizes="100px"
                  className={styles.logoImg}
                />
              </div>
            </Link>
          </div>
          
          <button className={styles.hamburger} onClick={toggleMobileMenu} aria-label="Toggle Menu">
            <span className={`${styles.bar} ${isMobileOpen ? styles.barOpen1 : ""}`}></span>
            <span className={`${styles.bar} ${isMobileOpen ? styles.barOpen2 : ""}`}></span>
            <span className={`${styles.bar} ${isMobileOpen ? styles.barOpen3 : ""}`}></span>
          </button>
        </div>

        {/* COLLAPSIBLE MENU */}
        <div className={`${styles.navMenu} ${isMobileOpen ? styles.navMenuOpen : ""}`}>
          {/* CENTER LINKS */}
          <div className={styles.navCenter}>
            <Link href="/" className={pathname === "/" ? styles.active : ""}>
              Home
            </Link>
            
            <div className={styles.dropdownContainer}>
              <Link
                href="/services"
                className={`${styles.dropdownTrigger} ${
                  pathname.startsWith("/services") ? styles.active : ""
                }`}
              >
                Services <span className={styles.arrow}>▼</span>
              </Link>

              <div className={styles.dropdown}>
                <Link href="/services/hair-services">Hair</Link>
                <Link href="/services/nail-services">Nails</Link>
                <Link href="/services/facial-services">Facial</Link>
                <Link href="/services/massage-services">Massage</Link>
                <Link href="/services/lashes-services">Lashes</Link>
                <Link href="/services/spa-services">Spa</Link>
                <Link href="/services/moroccan-bath">Moroccan Bath</Link>
                <Link href="/services/waxing-services">Waxing</Link>
              </div>
            </div>

            <Link href="/gallery" className={pathname === "/gallery" ? styles.active : ""}>
              Gallery
            </Link>
            <Link href="/about" className={pathname === "/about" ? styles.active : ""}>
              About Us
            </Link>
            <Link href="/contact" className={pathname === "/contact" ? styles.active : ""}>
              Contact Us
            </Link>
            <Link href="/gift" className={pathname === "/gift" ? styles.active : ""}>
              Send a Gift 🎁
            </Link>
          </div>

          {/* RIGHT ACTIONS */}
          <div className={styles.navActions}>
            {/* ADMIN SHORTCUT */}
            <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-gold)] transition-colors p-1" title="Staff Portal">
              <svg width="16" height="16" className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </Link>
            
            {/* AUTH */}
            {!user ? (
              <div className={styles.authGroup}>
                <Link href="/login" className={styles.loginBtn}>
                  Login
                </Link>
              </div>
            ) : (
              <div className={styles.authGroup}>
                <Link href={role === "customer" ? "/profile" : "/dashboard"} className={styles.loginBtn}>
                  {role === "customer" ? "Profile" : "Dashboard"}
                </Link>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            )}

            {/* BOOK NOW */}
            <Link href="/booking" onClick={() => setIsMobileOpen(false)} className={styles.btn}>
              Book Now
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}