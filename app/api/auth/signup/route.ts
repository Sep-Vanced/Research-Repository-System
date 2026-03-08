import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const cookieStore = await cookies();

  const body = await request.json().catch(() => null);
  const fullName = String(body?.fullName || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Full name, email, and password are required.' }, { status: 400 });
  }

  const ipRate = checkRateLimit({
    namespace: 'auth-signup-ip',
    key: ip,
    max: 6,
    windowMs: 10 * 60_000,
  });
  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(ipRate.retryAfterSec) },
      }
    );
  }

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'viewer',
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: 'Unable to complete sign up at this time.' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: 'Check your email for the confirmation link.',
  });
}
