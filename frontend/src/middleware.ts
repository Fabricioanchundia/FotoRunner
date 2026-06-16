import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const role = req.cookies.get('role')?.value;
  const path = req.nextUrl.pathname;

  // Proteger rutas admin
  if (path.startsWith('/admin')) {
    if (!token || (role !== 'ADMIN' && role !== 'HELPER')) {
      return NextResponse.redirect(new URL('/login?redirect=' + path, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};