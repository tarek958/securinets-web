import { jwtVerify, SignJWT } from 'jose';
import { NextResponse } from 'next/server';

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
];

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

export async function middleware(request) {
  console.log('Middleware - Request path:', request.nextUrl.pathname);
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    console.log('Middleware - Public path, allowing access');
    return NextResponse.next();
  }

  console.log('Middleware - Token present:', !!token);

  // Check if we have a token
  if (!token) {
    console.log('Middleware - No token provided');
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'No token provided' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token.value, secret);
    console.log('Middleware - Decoded token:', payload);
    
    // Check token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('Middleware - Token expired');
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Token expired' }),
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

    // Clone the request and add user data
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-data', JSON.stringify(payload));

    // Create a new response with the modified request
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    console.log('Middleware - Set x-user-data header:', payload);

    // Extend token expiration
    const newToken = await new SignJWT(payload)
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

    return response;
  } catch (error) {
    console.error('Middleware - Token verification error:', error);
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token', details: error.message }),
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
