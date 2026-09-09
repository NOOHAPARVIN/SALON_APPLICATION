import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') ||
    pathname.startsWith('/booking/payment') ||
    pathname.startsWith('/booking/success');

  const isLoginPage = 
    pathname === '/login' || 
    pathname === '/portal/login' ||
    pathname === '/admin/login';

  // Allow static assets, images, API routes (we protect API routes inside the route handlers)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/images')
  ) {
    return supabaseResponse;
  }

  // If no user and trying to access a protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/dashboard')) {
      url.pathname = '/portal/login';
    } else {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // If user is logged in
  if (user) {
    // Fetch user profile to get role bypassing RLS
    let role = (user.user_metadata?.role || user.app_metadata?.role || "customer").toLowerCase();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
          },
          cache: "no-store"
        }
      );
      const profiles = await res.json();
      if (profiles && profiles.length > 0 && profiles[0].role) {
        role = profiles[0].role.toLowerCase();
      }
    } catch (err) {
      console.error("Error fetching role in middleware:", err);
    }

    // If trying to access login page while already logged in
    if (isLoginPage) {
      const dest = role === "customer" ? "/" : `/dashboard/${role === 'super_admin' ? 'owner' : role}`;
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Role-based route protection for dashboards
    if (pathname.startsWith('/dashboard/owner') && role !== 'owner' && role !== 'super_admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
    
    // Allow owners, super_admins, and receptionists to access receptionist dashboard
    if (pathname.startsWith('/dashboard/receptionist') && role !== 'receptionist' && role !== 'owner' && role !== 'super_admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname.startsWith('/dashboard/stylist') && role !== 'stylist' && role !== 'owner' && role !== 'super_admin') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname.startsWith('/dashboard/customer')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Default dashboard redirect if they just go to /dashboard
    if (pathname === '/dashboard') {
      const dest = role === "customer" ? "/" : `/dashboard/${role}`;
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
