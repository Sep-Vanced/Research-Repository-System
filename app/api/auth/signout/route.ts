import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const rateState = checkRateLimit({
    namespace: 'auth-signout-ip',
    key: ip,
    max: 30,
    windowMs: 60_000,
  });
  if (!rateState.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-out requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateState.retryAfterSec) },
      }
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...(options as object) });
        },
      },
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url));
}
