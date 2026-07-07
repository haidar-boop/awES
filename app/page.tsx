import Link from 'next/link';
import { getFeatured, getDealViews, getRetailers } from '@/lib/data/queries';
import { DealCard } from './components/DealCard';
import { EmailCapture } from './components/EmailCapture';
import { JsonLd } from './components/JsonLd';
import { siteUrl } from '@/lib/utils';

export const revalidate = 300;

export default async function HomePage() {
  const [featured, latest, retailers] = await Promise.all([
    getFeatured(),
    getDealViews({ sort: 'newest' }),
    getRetailers(),
  ]);
  const feed = latest.slice(0, 9);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PennyRadar Canada',
          url: siteUrl(),
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl()}/lookup?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Hero */}
      <section className="border-b border-stone-200 bg-gradient-to-b from-penny-50 to-stone-50 dark:border-stone-800 dark:from-penny-950/40 dark:to-stone-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <p className="chip mx-auto bg-penny-100 text-penny-800 dark:bg-penny-950 dark:text-penny-300">
            🇨🇦 Built for Canada — {latest.length} live deals right now
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            The <s className="text-stone-400">$149.00</s>{' '}
            <span className="text-penny-600 dark:text-penny-400">$0.01</span> you almost walked past
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600 dark:text-stone-400">
            Canada&apos;s community-powered live list of penny items and hidden clearance at Home Depot,
            Walmart, Dollar Tree and more. Verified by hunters, mapped by store, free forever.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/deals" className="btn-primary !px-6 !py-3 !text-base">
              Browse the live list
            </Link>
            <Link href="/guides/what-are-penny-items" className="btn-secondary !px-6 !py-3 !text-base">
              How penny deals work
            </Link>
          </div>
        </div>
      </section>

      {/* Featured + live feed */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live penny list</h2>
            <p className="mt-1 text-sm text-stone-500">Community-reported in the last few days · prices not guaranteed</p>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-penny-600 hover:underline dark:text-penny-400">
            See all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(featured.length ? [...featured, ...feed.filter((v) => !featured.includes(v))] : feed)
            .slice(0, 9)
            .map((view) => (
              <DealCard key={view.deal.id} view={view} />
            ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold">How the hunt works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                emoji: '🏷️',
                title: 'Retailers mark down on a cycle',
                body: 'Clearance steps 25% → 50% → 75% — and when stock still doesn’t sell, the system drops the SKU to $0.01 as a signal for staff to pull it. Learn each store’s tags in the decoder.',
                link: { href: '/decoder', label: 'Open the tag decoder' },
              },
              {
                emoji: '📱',
                title: 'Hunters scan and report',
                body: 'The shelf tag lies — only scanning the item’s UPC reveals the system price. When a hunter finds a penny, they report it here with store, price, and photos.',
                link: { href: '/report', label: 'Report a find' },
              },
              {
                emoji: '✅',
                title: 'The community verifies',
                body: 'Confirmations and receipt photos move deals from Unconfirmed to Verified; dead votes retire them. You always know how much to trust a listing before you drive.',
                link: { href: '/guides/verify-before-you-drive', label: 'Verification checklist' },
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <p className="text-4xl" aria-hidden>{step.emoji}</p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{step.body}</p>
                <Link href={step.link.href} className="mt-3 inline-block text-sm font-semibold text-penny-600 hover:underline dark:text-penny-400">
                  {step.link.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retailers */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Supported retailers</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {retailers.map((r) => (
            <Link key={r.slug} href={`/retailers/${r.slug}`} className="card group p-5 transition-shadow hover:shadow-md">
              <span className="chip text-white" style={{ backgroundColor: r.brandColor }}>
                {r.name}
              </span>
              <p className="mt-3 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                {r.pennyNotesMd.split('\n')[0].replace(/\*\*/g, '')}
              </p>
              <p className="mt-3 text-sm font-semibold text-penny-600 group-hover:underline dark:text-penny-400">
                Deals, decoder & stores →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Email capture */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card bg-penny-600 p-8 text-center dark:bg-penny-700 md:p-12">
          <h2 className="text-2xl font-bold text-white">This week&apos;s penny finds, in your inbox</h2>
          <p className="mx-auto mt-2 max-w-xl text-penny-100">
            The weekly digest: top verified finds in your province, new guides, and leaderboard movers. Free, no spam.
          </p>
          <EmailCapture />
        </div>
      </section>
    </>
  );
}
