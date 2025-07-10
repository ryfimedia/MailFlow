
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/signin', '/signup', '/terms'];
  const isPublicPath = publicPaths.some(path => pathname === path) || pathname.startsWith('/form/');

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (token && (pathname === '/signin' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token.value}`);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
