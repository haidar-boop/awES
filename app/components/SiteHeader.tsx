'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Moon, Sun, Coins } from 'lucide-react';

const NAV = [
  { href: '/deals', label: 'Live List' },
  { href: '/deals/map', label: 'Map' },
  { href: '/lookup', label: 'Lookup' },
  { href: '/decoder', label: 'Decoder' },
  { href: '/guides', label: 'Guides' },
  { href: '/retailers', label: 'Retailers' },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-penny-600 dark:text-penny-400">
          <Coins className="h-6 w-6" aria-hidden />
          PennyRadar
          <span className="hidden text-sm font-normal text-stone-400 sm:inline">Canada</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-penny-50 text-penny-700 dark:bg-penny-950 dark:text-penny-300'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/report" className="btn-primary hidden sm:inline-flex">
            🪙 Report a Find
          </Link>
          <Link href="/account" className="btn-secondary hidden md:inline-flex">
            Account
          </Link>
          <button
            className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-stone-200 px-4 py-3 dark:border-stone-800 md:hidden" aria-label="Mobile">
          <div className="grid gap-1">
            {[...NAV, { href: '/leaderboard', label: 'Leaderboard' }, { href: '/wall', label: 'Receipt Wall' }, { href: '/pro', label: 'Pro' }, { href: '/account', label: 'Account' }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
