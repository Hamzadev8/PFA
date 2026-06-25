import { NextResponse } from 'next/server';

const ROLE_ROUTES = {
  medecin: ['/predict', '/patient', '/dashboard'],
  admin:   ['/dashboard'],
  patient: ['/patient'],
};

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('pfa_role')?.value;

  const isProtected = Object.values(ROLE_ROUTES).flat()
    .some(r => pathname.startsWith(r));

  if (!isProtected) return NextResponse.next();

  // Non connecté → login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Mauvais rôle → accueil
  const allowed = ROLE_ROUTES[token] ?? [];
  const hasAccess = allowed.some(r => pathname.startsWith(r));
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/patient/:path*', '/predict/:path*'],
};