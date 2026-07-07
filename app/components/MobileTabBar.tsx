'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, Map, Coins, Telescope, User } from 'lucide-react';

/** Bottom tab bar on mobile: Deals / Map / Report / Scout / Profile. */
const TABS = [
  { href: '/deals', label: 'Deals', icon: List },
  { href: '/deals/map', label: 'Map', icon: Map },
  { href: '/report', label: 'Report', icon: Coins, primary: true },
  { href: '/scout', label: 'Scout', icon: Telescope },
  { href: '/account', label: 'Profile', icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] font-medium ${
                tab.primary
                  ? 'text-penny-600 dark:text-penny-400'
                  : active
                    ? 'text-penny-600 dark:text-penny-400'
                    : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${tab.primary ? '-mt-3 rounded-full bg-penny-500 p-1 text-white h-8 w-8 shadow-lg' : ''}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
