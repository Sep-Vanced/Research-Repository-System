'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/app/providers';

function subscribe() {
  return () => {};
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isHydrated = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isHydrated) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={toggleTheme}
        className="h-10 w-10 rounded-full p-0"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
