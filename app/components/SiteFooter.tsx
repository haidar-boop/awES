import Link from 'next/link';

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Hunt',
    links: [
      { href: '/deals', label: 'Live Penny List' },
      { href: '/deals/map', label: 'Map View' },
      { href: '/lookup', label: 'UPC / SKU Lookup' },
      { href: '/decoder', label: 'Tag Decoder' },
      { href: '/scout', label: 'Scout Tracker' },
      { href: '/report', label: 'Report a Find' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/guides', label: 'Guides' },
      { href: '/guides/what-are-penny-items', label: 'What Are Penny Items?' },
      { href: '/glossary', label: 'Glossary' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/wall', label: 'Receipt Wall' },
      { href: '/retailers', label: 'Retailers' },
      { href: '/stores', label: 'Store Finder' },
      { href: '/pro', label: 'Go Pro' },
    ],
  },
  {
    title: 'Site',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/legal/terms', label: 'Terms' },
      { href: '/legal/privacy', label: 'Privacy (PIPEDA)' },
      { href: '/legal/disclaimer', label: 'Disclaimer' },
      { href: '/rss.xml', label: 'RSS Feed' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-penny-600 dark:text-penny-400">🪙 PennyRadar</p>
            <p className="mt-2 text-sm text-stone-500">
              Canada&apos;s community-powered penny list and hidden-clearance finder.
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-stone-500 hover:text-penny-600 dark:hover:text-penny-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-stone-200 pt-6 dark:border-stone-800">
          <p className="text-xs leading-relaxed text-stone-400">
            Prices are community-reported and not guaranteed. This site is not affiliated with or endorsed
            by any retailer. Stores may refuse to sell items that scan at $0.01. Always verify in-store.
            Paying cash? Totals round to the nearest 5¢ — card pays the exact amount.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            © {new Date().getFullYear()} PennyRadar Canada · Made for Canadian hunters, eh 🇨🇦
          </p>
        </div>
      </div>
    </footer>
  );
}
