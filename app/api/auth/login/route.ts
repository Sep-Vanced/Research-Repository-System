import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const cookieStore = await cookies();

  const body = await request.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const ipRate = checkRateLimit({
    namespace: 'auth-login-ip',
    key: ip,
    max: 10,
    windowMs: 60_000,
  });
  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(ipRate.retryAfterSec) },
      }
    );
  }

  const emailRate = checkRateLimit({
    namespace: 'auth-login-email',
    key: email,
    max: 15,
    windowMs: 5 * 60_000,
  });
  if (!emailRate.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts for this account. Please wait before retrying.' },
      {
        status: 429,
        headers: { 'Retry-After': String(emailRate.retryAfterSec) },
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
