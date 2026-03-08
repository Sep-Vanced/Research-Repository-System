'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPageClient() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'viewer',
            },
          },
        });

        if (signUpError) throw signUpError;
        setError('Check your email for the confirmation link.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-wrap flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-lg border-blue-200/90 bg-white/90 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? 'Register and start exploring research.' : 'Sign in to continue to your workspace.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (
              <Input
                id="full-name"
                name="fullName"
                type="text"
                required={isSignUp}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            )}
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && (
              <p className={error.includes('Check your email') ? 'text-green-700' : 'text-red-700'}>{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-blue-900/80">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              suppressHydrationWarning
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              {isSignUp ? 'Already have an account?' : 'Create a new account'}
            </button>
            <Link href="/" className="font-semibold text-blue-700 hover:text-blue-900">
              Back Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
