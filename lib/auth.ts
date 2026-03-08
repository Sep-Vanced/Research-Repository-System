import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User, UserRole } from '@/types/research';

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData as User | null;
}

export async function requireAuth(requiredRole?: UserRole): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    redirect('/dashboard');
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  return requireAuth('admin');
}

export async function requireResearcher(): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'researcher' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();
  redirect('/login');
}

