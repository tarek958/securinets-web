import { jwtVerify, SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Public paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/',
  '/challenges',
  '/leaderboard',
  '/forum',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/admin/settings'
];

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

export async function middleware(request) {
  console.log('Middleware - Request path:', request.nextUrl.pathname);
  
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    console.log('Middleware - Public path, allowing access');
    return NextResponse.next();
  }

  // Get token from request cookies instead of using cookies() API
  const token = request.cookies.get('auth-token')?.value;
  console.log('Middleware - Token present:', !!token);

  // Check if we have a token
  if (!token) {
    console.log('Middleware - No token provided');
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    console.log('Middleware - Token verified:', payload);

    // Add user data to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-data', JSON.stringify(payload));

    // Create response with refreshed token
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Refresh token if it's close to expiring
    if (payload.exp && Date.now() >= (payload.exp * 1000) - (7 * 24 * 60 * 60 * 1000)) {
      const newToken = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(secret);

      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Middleware - Token verification error:', error);
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
