/**
 * Subdomain ve domain yönetimi için utility fonksiyonlar
 */

export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Localhost kontrolü
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Subdomain'i çıkar (admin.blogproduce.com -> admin)
  const parts = hostname.split('.');
  
  // Eğer 3 veya daha fazla parça varsa, ilk parça subdomain'dir
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

export function isAdminSubdomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === 'admin';
}

export function isMainDomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === null || subdomain === 'www';
}

export function getCookieDomain(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.blogproduce.com';
  }
  
  const hostname = window.location.hostname;
  
  // Development için localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  // Production için domain
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (cookieDomain) {
    return cookieDomain;
  }
  
  // Otomatik domain çıkarımı
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // .blogproduce.com formatında döndür
    return `.${parts.slice(-2).join('.')}`;
  }
  
  return hostname;
}

export function redirectToAdminSubdomain(path: string = ''): void {
  if (typeof window === 'undefined') return;
  
  const adminDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.blogproduce.com';
  const protocol = window.location.protocol;
  const url = `${protocol}//${adminDomain}${path}`;
  
  window.location.href = url;
}

export function redirectToMainDomain(path: string = ''): void {
  if (typeof window === 'undefined') return;
  
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'blogproduce.com';
  const protocol = window.location.protocol;
  const url = `${protocol}//${mainDomain}${path}`;
  
  window.location.href = url;
}

