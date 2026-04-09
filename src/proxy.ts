import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

const isEmployerRoute = createRouteMatcher(['/employer(.*)', '/api/exams(.*)']);
const isCandidateRoute = createRouteMatcher(['/candidate(.*)']);

function extractRoleFromSessionClaims(sessionClaims: unknown): 'EMPLOYER' | 'CANDIDATE' {
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return 'CANDIDATE';
  }

  const claims = sessionClaims as Record<string, unknown>;
  const rawRole = claims?.role;

  if (typeof rawRole !== 'string') {
    return 'CANDIDATE';
  }

  return rawRole.toUpperCase() === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE';
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Resolve role from Clerk API first (source of truth), fallback to session claims
  const role = extractRoleFromSessionClaims(sessionClaims);

  // Handle /dashboard redirect based on role
  if (req.nextUrl.pathname === '/dashboard') {
    if (role === 'EMPLOYER') {
      return NextResponse.redirect(new URL('/employer/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/candidate/dashboard', req.url));
  }

  // Protect employer routes
  if (isEmployerRoute(req) && role !== 'EMPLOYER') {
    return NextResponse.redirect(new URL('/candidate/dashboard', req.url));
  }

  // Protect candidate routes
  if (isCandidateRoute(req) && role !== 'CANDIDATE') {
    return NextResponse.redirect(new URL('/employer/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};