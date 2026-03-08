'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/research';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};
type ThemeMode = 'light' | 'dark';
type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};
type AccessibilityContextType = {
  fontScale: number;
  highContrast: boolean;
  reducedMotion: boolean;
  setFontScale: (value: number) => void;
  setHighContrast: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});
const AccessibilityContext = createContext<AccessibilityContextType>({
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  setFontScale: () => {},
  setHighContrast: () => {},
  setReducedMotion: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
export function useTheme() {
  return useContext(ThemeContext);
}
export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return storedTheme ?? (prefersDark ? 'dark' : 'light');
  });
  const [fontScale, setFontScaleState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem('a11y_font_scale') || 1);
  });
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('a11y_high_contrast') === 'true';
  });
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('a11y_reduced_motion') === 'true';
  });
  const supabase = createClient();

  const applyTheme = (nextTheme: ThemeMode) => {
    const root = document.documentElement;
    root.classList.toggle('dark', nextTheme === 'dark');
    root.style.colorScheme = nextTheme;
  };

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontScale * 100}%`;
    localStorage.setItem('a11y_font_scale', String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-high-contrast', highContrast);
    localStorage.setItem('a11y_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-reduced-motion', reducedMotion);
    localStorage.setItem('a11y_reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser(userData as User | null);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUser(data as User | null);
          });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const setFontScale = (value: number) => setFontScaleState(Math.min(1.25, Math.max(0.9, value)));
  const setHighContrast = (value: boolean) => setHighContrastState(value);
  const setReducedMotion = (value: boolean) => setReducedMotionState(value);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <AccessibilityContext.Provider
        value={{ fontScale, highContrast, reducedMotion, setFontScale, setHighContrast, setReducedMotion }}
      >
        <AuthContext.Provider value={{ user, loading, signOut }}>
          {children}
        </AuthContext.Provider>
      </AccessibilityContext.Provider>
    </ThemeContext.Provider>
  );
}

