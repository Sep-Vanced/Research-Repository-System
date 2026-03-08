'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  Menu,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import prmsuLogo from '@/app/public/image/prmsu_logo.png';
import { GlobalSearchInput } from '@/components/common/global-search-input';
import ProfileDropdown from '@/components/dashboard/profile-dropdown';

type DashboardShellProps = {
  children: ReactNode;
  user: {
    full_name?: string | null;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
  formattedTime: string;
  formattedDate: string;
  unreadNotificationsCount?: number;
};

export default function DashboardShell({
  children,
  user,
  formattedTime,
  formattedDate,
  unreadNotificationsCount = 0,
}: DashboardShellProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const inResearchSection = pathname.startsWith('/research') || pathname.startsWith('/submit');
  const inAdminSection = pathname.startsWith('/admin');
  const [researchOpen, setResearchOpen] = useState<boolean>(inResearchSection);
  const [adminOpen, setAdminOpen] = useState<boolean>(inAdminSection);
  const displayName = user.full_name || user.email;
  const initials = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName]);
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
    collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
  }`;
  const navItemBase = 'flex items-center rounded-lg py-2 text-sm transition';
  const navItemState = (active: boolean) => {
    if (!active) {
      return 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70';
    }
    return collapsed
      ? 'text-slate-700 dark:text-slate-200'
      : 'bg-blue-600 text-white shadow-sm';
  };
  const navIconState = (active: boolean) =>
    active
      ? collapsed
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-white'
      : 'text-slate-500 dark:text-slate-400';
  const sectionTriggerState = (active: boolean) =>
    active
      ? 'text-blue-700 dark:text-blue-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70';
  const mobileNavItemState = (active: boolean) =>
    active
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70';

  const mobileTabs = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      active: pathname === '/dashboard',
      show: true,
    },
    {
      href: '/research',
      label: 'Research',
      icon: ClipboardList,
      active: pathname.startsWith('/research'),
      show: true,
    },
    {
      href: '/submit',
      label: 'Submit',
      icon: FileText,
      active: pathname.startsWith('/submit'),
      show: user.role === 'researcher' || user.role === 'admin',
    },
    {
      href: '/admin',
      label: 'Admin',
      icon: GraduationCap,
      active: pathname.startsWith('/admin'),
      show: user.role === 'admin',
    },
  ].filter((item) => item.show);

  const searchSections = useMemo(() => {
    const items = [
      {
        href: '/dashboard',
        label: 'Dashboard Home',
        description: 'Overview, stats, and activity',
        keywords: ['home', 'dashboard', 'overview', 'stats', 'activity'],
      },
      {
        href: '/dashboard/profile',
        label: 'Profile',
        description: 'Manage your profile details and avatar',
        keywords: ['profile', 'account', 'avatar', 'picture', 'user'],
      },
      {
        href: '/dashboard/notifications',
        label: 'Notifications',
        description: 'Submission and moderation updates',
        keywords: ['notifications', 'updates', 'messages', 'alerts'],
      },
      {
        href: '/dashboard/alerts',
        label: 'Alert Subscriptions',
        description: 'Manage category and keyword alerts',
        keywords: ['alerts', 'subscriptions', 'keywords', 'categories'],
      },
      {
        href: '/dashboard/settings',
        label: 'Settings',
        description: 'Theme and accessibility preferences',
        keywords: ['settings', 'theme', 'dark mode', 'light mode', 'accessibility'],
      },
      {
        href: '/research',
        label: 'Browse Research',
        description: 'Explore repository records',
        keywords: ['research', 'browse', 'papers', 'projects', 'repository'],
      },
    ];

    if (user.role === 'researcher' || user.role === 'admin') {
      items.push({
        href: '/submit',
        label: 'Submit Research',
        description: 'Create a new research submission',
        keywords: ['submit', 'upload', 'new research', 'create submission'],
      });
    }

    if (user.role === 'admin') {
      items.push({
        href: '/admin',
        label: 'Admin Panel',
        description: 'Moderation, users, and admin tools',
        keywords: ['admin', 'moderation', 'users', 'taxonomy', 'security'],
      });
    }

    return items;
  }, [user.role]);

  const filteredSearchSections = useMemo(() => {
    if (!deferredSearchQuery) {
      return searchSections;
    }

    return searchSections
      .map((item) => {
        const haystack = `${item.label} ${item.description} ${item.keywords.join(' ')}`.toLowerCase();
        const exactLabel = item.label.toLowerCase() === deferredSearchQuery ? 4 : 0;
        const startsWithLabel = item.label.toLowerCase().startsWith(deferredSearchQuery) ? 3 : 0;
        const includesLabel = item.label.toLowerCase().includes(deferredSearchQuery) ? 2 : 0;
        const includesKeywords = item.keywords.some((keyword) => keyword.toLowerCase().includes(deferredSearchQuery)) ? 1 : 0;
        const includesAny = haystack.includes(deferredSearchQuery) ? 1 : 0;
        const score = exactLabel + startsWithLabel + includesLabel + includesKeywords + includesAny;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  }, [deferredSearchQuery, searchSections]);

  const visibleSearchSections = filteredSearchSections.slice(0, 6);
  const showSearchResults = searchFocused && visibleSearchSections.length > 0;
  const mobileSearchVisible = mobileSearchOpen || searchQuery.length > 0;

  const navigateToSearchResult = (href: string) => {
    setSearchQuery('');
    setSearchFocused(false);
    setMobileSearchOpen(false);
    if (mobileNavOpen) {
      setMobileNavOpen(false);
    }
    router.push(href);
  };

  const handleSearchEnter = () => {
    if (visibleSearchSections.length === 0) return;
    navigateToSearchResult(visibleSearchSections[0].href);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--surface-border)] bg-[var(--surface)] backdrop-blur transition-[width,background-color,border-color,color,box-shadow] duration-300 ease-in-out lg:flex ${
            collapsed ? 'w-[84px]' : 'w-[252px]'
          }`}
        >
          <div className="border-b border-[var(--surface-border)] px-2 py-3">
            <div className="flex w-[80px] items-center justify-center">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                suppressHydrationWarning
                className="rounded-lg bg-[var(--surface)] p-2 text-[var(--foreground)] transition hover:bg-slate-100 dark:hover:bg-slate-800/70"
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
            </div>

            <div
              className={`overflow-hidden text-center transition-all duration-300 ease-in-out ${
                collapsed ? 'mt-0 max-h-0 opacity-0' : 'mt-3 max-h-64 opacity-100'
              }`}
            >
              <div className="pt-1">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-100 bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-bold text-white shadow-lg">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Profile picture"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">{user.email}</p>
                <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <nav className={`flex-1 space-y-7 overflow-y-auto py-6 transition-all duration-300 ease-in-out ${collapsed ? 'px-0' : 'px-3'}`}>
            <Link
              href="/dashboard"
              className={`flex items-center rounded-xl text-sm font-medium ${
                navItemState(pathname === '/dashboard')
              } ${collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'gap-3 px-4 py-3'}`}
              title="Home"
            >
              <Home className={`h-4 w-4 ${navIconState(pathname === '/dashboard')}`} />
              <span className={labelClass}>Home</span>
            </Link>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setResearchOpen((prev) => !prev)}
                suppressHydrationWarning
                className={`flex items-center rounded-lg text-left text-sm font-semibold transition ${
                  sectionTriggerState(inResearchSection)
                } ${
                  collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'w-full justify-between px-3 py-2'
                }`}
                title="Research Sections"
                aria-expanded={researchOpen}
              >
                <span className={`flex items-center ${collapsed ? '' : 'gap-2'}`}>
                  <BookOpen className="h-4 w-4" />
                  <span className={labelClass}>Research Sections</span>
                </span>
                {!collapsed ? (
                  <ChevronDown
                    className={`h-4 w-4 transition-all duration-300 ease-in-out ${
                      researchOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                ) : null}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  !collapsed && researchOpen ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <Link
                  href="/research"
                  className={`${navItemBase} ${navItemState(pathname.startsWith('/research'))} ${
                    collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'gap-2 px-8'
                  }`}
                  title="Browse Research"
                >
                  <ClipboardList className={`h-4 w-4 ${navIconState(pathname.startsWith('/research'))}`} />
                  <span className={labelClass}>Browse Research</span>
                </Link>
                {(user.role === 'researcher' || user.role === 'admin') && (
                  <Link
                    href="/submit"
                    className={`${navItemBase} ${navItemState(pathname.startsWith('/submit'))} ${
                      collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'gap-2 px-8'
                    }`}
                    title="Submit Research"
                  >
                      <FileText className={`h-4 w-4 ${navIconState(pathname.startsWith('/submit'))}`} />
                      <span className={labelClass}>Submit Research</span>
                    </Link>
                )}
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setAdminOpen((prev) => !prev)}
                  suppressHydrationWarning
                  className={`flex items-center rounded-lg text-left text-sm font-semibold transition ${
                    sectionTriggerState(inAdminSection)
                  } ${
                    collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'w-full justify-between px-3 py-2'
                  }`}
                  title="Administration"
                  aria-expanded={adminOpen}
                >
                  <span className={`flex items-center ${collapsed ? '' : 'gap-2'}`}>
                    <ShieldCheck className="h-4 w-4" />
                    <span className={labelClass}>Administration</span>
                  </span>
                  {!collapsed ? (
                    <ChevronDown
                      className={`h-4 w-4 transition-all duration-300 ease-in-out ${
                        adminOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  ) : null}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    !collapsed && adminOpen ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <Link
                    href="/admin"
                    className={`${navItemBase} ${navItemState(pathname.startsWith('/admin'))} ${
                      collapsed ? 'mx-auto h-11 w-11 justify-center px-0 py-0' : 'gap-2 px-8'
                    }`}
                    title="Admin Panel"
                  >
                    <GraduationCap className={`h-4 w-4 ${navIconState(pathname.startsWith('/admin'))}`} />
                    <span className={labelClass}>Admin Panel</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          <div className={`border-t border-[var(--surface-border)] ${collapsed ? 'p-2' : 'p-4'}`}>
            <div
              className={`overflow-hidden text-center transition-all duration-300 ease-in-out ${
                collapsed ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
              }`}
            >
              <p className="pt-1 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-300">@SepVanced 2026</p>
            </div>
          </div>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation overlay"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[340px] rounded-r-3xl border-r border-[var(--surface-border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!mobileNavOpen}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  <Image src={prmsuLogo} alt="PRMSU Logo" className="h-10 w-10 object-contain" />
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Menu</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 text-slate-600 dark:text-slate-300"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--surface-border)] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white shadow-lg">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="Profile picture"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-300">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${mobileNavItemState(pathname === '/dashboard')}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setResearchOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    inResearchSection ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  aria-expanded={researchOpen}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Research Sections
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${researchOpen ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                <div className={`${researchOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300`}>
                  <Link
                    href="/research"
                    className={`mt-1 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${mobileNavItemState(pathname.startsWith('/research'))}`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Browse Research
                  </Link>
                  {(user.role === 'researcher' || user.role === 'admin') ? (
                    <Link
                      href="/submit"
                      className={`mt-1 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${mobileNavItemState(pathname.startsWith('/submit'))}`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      Submit Research
                    </Link>
                  ) : null}
                </div>
              </div>

              {user.role === 'admin' ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setAdminOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                      inAdminSection ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    aria-expanded={adminOpen}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Administration
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${adminOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                  <div className={`${adminOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300`}>
                    <Link
                      href="/admin"
                      className={`mt-1 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${mobileNavItemState(pathname.startsWith('/admin'))}`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  </div>
                </div>
              ) : null}
            </nav>

            <div className="border-t border-[var(--surface-border)] px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-300">
              @SepVanced 2026
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[var(--surface)]/95 backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-300 ease-in-out">
            <div className="flex h-[68px] items-center justify-between px-3 sm:px-5 lg:h-[74px] lg:px-8">
              <div className="flex min-w-0 items-center gap-3 lg:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setMobileNavOpen(true);
                  }}
                  className="inline-flex rounded-lg bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200 lg:h-12 lg:w-12">
                  <Image src={prmsuLogo} alt="PRMSU Logo" className="h-9 w-9 object-contain lg:h-11 lg:w-11" />
                </div>
                <p
                  className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg lg:text-[2rem]"
                  style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                  Research and Development
                </p>
              </div>

              <div className="hidden items-center gap-4 lg:flex">
                <div className="relative w-64">
                  <GlobalSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onEnter={handleSearchEnter}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                    placeholder="Search dashboard..."
                    className="w-full"
                    inputClassName="h-10 border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:bg-slate-800"
                    iconClassName="text-slate-400 dark:text-slate-500"
                  />
                  {showSearchResults ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all dark:border-slate-700 dark:bg-slate-900">
                      {visibleSearchSections.map((item) => (
                        <button
                          key={item.href}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => navigateToSearchResult(item.href)}
                          className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            pathname === item.href ? 'bg-blue-50 dark:bg-slate-800/80' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                          </div>
                          <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            Open
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Link
                  href="/dashboard/notifications"
                  aria-label="Open notifications"
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    pathname.startsWith('/dashboard/notifications')
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-slate-800 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  ) : null}
                </Link>
                <div className="text-right text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{formattedTime}</p>
                  <p className="text-slate-500 dark:text-slate-400">{formattedDate}</p>
                </div>
                <ProfileDropdown fullName={displayName} email={user.email} avatarUrl={user.avatar_url} />
              </div>

              <div className="flex items-center gap-1.5 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((prev) => !prev)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    mobileSearchVisible
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-slate-800 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  aria-label="Toggle search"
                >
                  <Search className="h-4 w-4" />
                </button>
                <Link
                  href="/dashboard/notifications"
                  aria-label="Open notifications"
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    pathname.startsWith('/dashboard/notifications')
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-slate-800 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  ) : null}
                </Link>
                <ProfileDropdown fullName={displayName} email={user.email} avatarUrl={user.avatar_url} />
              </div>
            </div>
            <div
              className={`overflow-hidden border-t border-[var(--surface-border)] transition-all duration-300 ease-out lg:hidden ${
                mobileSearchVisible ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-2 px-3 pb-3 pt-2 sm:px-5">
                <div className="relative">
                  <GlobalSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onEnter={handleSearchEnter}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                    placeholder="Search dashboard..."
                    className="w-full"
                    inputClassName="h-10 border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:bg-slate-800"
                  iconClassName="text-slate-400 dark:text-slate-500"
                />
                {showSearchResults ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all dark:border-slate-700 dark:bg-slate-900">
                    {visibleSearchSections.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => navigateToSearchResult(item.href)}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          pathname === item.href ? 'bg-blue-50 dark:bg-slate-800/80' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Open
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
                <div className="flex items-center justify-end text-[11px] leading-tight">
                  <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{formattedTime}</p>
                    <p className="text-slate-500 dark:text-slate-400">{formattedDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-3 py-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8 lg:pb-6">
            {children}
          </main>

          <nav className="fixed bottom-0 left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_16px_34px_rgba(2,6,23,0.24)] backdrop-blur-xl transition-[background-color,border-color,color,box-shadow] duration-300 ease-in-out lg:hidden">
            <div className="mx-auto grid max-w-md grid-flow-col auto-cols-fr gap-1">
              {mobileTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition ${
                      tab.active
                        ? 'bg-blue-600 text-white shadow-[0_10px_18px_rgba(37,99,235,0.35)]'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${tab.active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
