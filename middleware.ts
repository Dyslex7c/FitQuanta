import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/plans', '/progress', '/onboarding'];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected) {
    const token = req.cookies.get('fq_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/plans/:path*', '/progress/:path*', '/onboarding/:path*'],
};
