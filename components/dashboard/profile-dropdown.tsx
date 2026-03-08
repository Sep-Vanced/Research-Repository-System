'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BellRing, ChevronDown, LogOut, Moon, Settings, Sun, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/app/providers';

type ProfileDropdownProps = {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfileDropdown({ fullName, email, avatarUrl }: ProfileDropdownProps) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(fullName || email);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        suppressHydrationWarning
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <span className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-blue-200">
            <Image src={avatarUrl} alt="Profile picture" fill className="object-cover" sizes="36px" />
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
            {initials}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="px-2 py-2">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{fullName || email}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-300">{email}</p>
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <UserIcon className="h-4 w-4" />
            User Profile
          </Link>
          <Link
            href="/dashboard/alerts"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <BellRing className="h-4 w-4" />
            Alerts
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            suppressHydrationWarning
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Theme
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-300">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              suppressHydrationWarning
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
