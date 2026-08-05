import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Development için localhost kontrolü
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  // Subdomain'i çıkar (admin.blogproduce.com -> admin)
  // Localhost'ta subdomain yok
  let subdomain: string | null = null;
  if (!isLocalhost) {
    const parts = hostname.split('.');
    // Eğer 3 veya daha fazla parça varsa, ilk parça subdomain'dir
    // Örnek: admin.blogproduce.com -> ['admin', 'blogproduce', 'com']
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }
  
  // Production domain kontrolü
  const isAdminSubdomain = subdomain === 'admin';
  const isMainDomain = subdomain === null || subdomain === 'www';
  
  const isAdminPath = pathname.startsWith('/admin');
  const isDashboardPath = pathname.startsWith('/dashboard');
  const isPublicPath = !isAdminPath && !isDashboardPath;

  // ============================================
  // ADMIN SUBDOMAIN İŞLEMLERİ
  // ============================================
  if (isAdminSubdomain) {
    // Admin subdomain'de /dashboard path'lerine direkt erişimi engelle
    // (Sadece /admin/* path'lerine izin veriyoruz)
    if (isDashboardPath && !isAdminPath) {
      const isRscRequest = request.nextUrl.searchParams.has('_rsc');
      
      // RSC request'leri için redirect yapma, direkt not-found döndür
      if (isRscRequest) {
        return new NextResponse(null, { status: 404 });
      }
      
      // Normal request'ler için admin login'e yönlendir
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Admin subdomain'de /admin/* path'lerini koru, rewrite yapma
    // Next.js'in doğal routing'i kullanılacak
    // /admin/login -> /app/admin/login/page.tsx
    // /admin/dashboard -> /app/admin/dashboard/page.tsx
    // Bu sayede rewrite sonrası RSC request'lerde sorun çıkmaz

    // Admin subdomain'de /login path'ini /admin/login olarak rewrite et
    // Böylece admin login sayfasına gider, kullanıcı login sayfasına değil
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }

    // Admin subdomain'de root path'i login'e yönlendir
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin subdomain'de diğer public path'leri (register, vb.) admin login'e yönlendir
    // Çünkü admin subdomain'de sadece admin sayfaları olmalı
    if (isPublicPath && pathname !== '/') {
      // Eğer /admin/* ile başlamıyorsa ve public path ise, admin login'e yönlendir
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ============================================
  // ANA DOMAIN İŞLEMLERİ
  // ============================================
  if (isMainDomain || isLocalhost) {
    // Ana domain'de /admin/* path'lerini admin subdomain'ine redirect et
    if (isAdminPath) {
      const isProduction = process.env.NODE_ENV === 'production';
      const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.blogproduce.com';
      
      if (isProduction && !isLocalhost) {
        // Keep the /admin prefix: on the admin subdomain the pages live at
        // /admin/* via natural Next routing, so stripping it would land on a
        // public path and bounce the user to /login.
        const url = new URL(pathname === '/admin' ? '/admin/login' : pathname, `https://${adminDomain}`);
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
      }
      // On localhost there is no admin subdomain — serve /admin/* directly.
      if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      return NextResponse.next();
    }
  }

  // Response'u oluştur
  const response = NextResponse.next();

  // Cookie domain ayarları (cross-subdomain için)
  if (process.env.NODE_ENV === 'production') {
    const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.blogproduce.com';
    
    // Set-Cookie header'larını güncelle
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      response.headers.set(
        'set-cookie',
        cookies
          .split(',')
          .map((cookie) => {
            // Domain ekle (eğer yoksa)
            if (!cookie.includes('Domain=')) {
              return `${cookie}; Domain=${cookieDomain}; Path=/; SameSite=Lax; Secure`;
            }
            return cookie;
          })
          .join(', ')
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

