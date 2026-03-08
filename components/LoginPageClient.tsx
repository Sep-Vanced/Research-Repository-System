'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/app/providers';
import heroBackground from '@/app/public/image/1bg.jpg';
import prmsuLogo from '@/app/public/image/prmsu_logo.png';

export default function LoginPageClient() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isSignUp = false;
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: '', email, password }),
        });
        const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        if (!response.ok) throw new Error(result?.error || 'Sign up failed');
        setSuccess(result?.message || 'Check your email for the confirmation link.');
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(result?.error || 'Authentication failed');
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
    <div className="relative min-h-screen overflow-hidden">
      <Image src={heroBackground} alt="Campus background" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-slate-950/50" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-center px-4 py-10 sm:px-6">
        <Card className="w-full overflow-hidden border-white/50 bg-white/95 shadow-2xl">
          <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-2">
            <section className="relative hidden lg:block">
              <Image src={heroBackground} alt="Research visual panel" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/25 via-slate-900/50 to-blue-950/80" />

              <div className="absolute left-8 right-8 top-8 flex items-center gap-4">
                <div className="rounded-full bg-white/90 p-2 shadow-lg">
                  <Image src={prmsuLogo} alt="PRMSU Logo" className="h-16 w-16 object-contain" />
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/20 bg-slate-900/55 p-6 text-white backdrop-blur-md">
                <p className="text-3xl font-semibold tracking-tight">Research Portal</p>
                <p className="mt-2 text-sm text-slate-200">
                  Access submissions, reviews, and records in one secure workspace.
                </p>
              </div>
            </section>

            <section className="relative flex items-center">
              <button
                type="button"
                onClick={toggleTheme}
                suppressHydrationWarning
                className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              >
                {!hydrated ? (
                  <span className="h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <div className="mx-auto w-full max-w-[520px] px-6 py-12 sm:px-10">
                <CardHeader className="px-0 pb-6 pt-0">
                  <CardTitle className="text-5xl tracking-tight">{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
                  <CardDescription className="pt-2 text-lg">
                    {isSignUp ? 'Set up your account to access the portal.' : 'Continue to your research workspace.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {isSignUp ? (
                      <Input
                        id="full-name"
                        name="fullName"
                        type="text"
                        required
                        value=""
                        onChange={() => {}}
                        placeholder="Full name"
                        className="h-12"
                      />
                    ) : null}
                    <Input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="h-12"
                    />

                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
                    {error ? <p className="text-sm text-red-700">{error}</p> : null}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 w-full rounded-xl bg-blue-700 text-base font-semibold hover:bg-blue-800"
                    >
                      {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Continue'}
                    </Button>
                  </form>

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-600">
                      <Link href="/" className="font-semibold text-blue-700 hover:text-blue-900">
                        Back Home
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
