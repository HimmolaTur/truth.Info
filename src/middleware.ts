import createMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const res = intlMiddleware(req);
  
  if (!req.cookies.has('anon_session')) {
    const uuid = crypto.randomUUID();
    res.cookies.set('anon_session', uuid, { 
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }
  
  return res;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ru|en|uk|de)/:path*']
};
