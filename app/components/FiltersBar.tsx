'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { MapPin, SlidersHorizontal, X } from 'lucide-react';
import { RADIUS_OPTIONS_KM, PROVINCES } from '@/lib/core/geo';
import { CATEGORIES } from '@/lib/core/pricing';

interface RetailerOpt {
  slug: string;
  name: string;
}

/**
 * Sticky, mobile-first filter bar (spec §4.1). State lives in the URL so
 * filtered feeds are shareable and server-rendered.
 */
export function FiltersBar({ retailers }: { retailers: RetailerOpt[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const toggleMulti = (key: string, value: string) => {
    const current = params.get(key)?.split(',').filter(Boolean) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    set({ [key]: next.join(',') || null });
  };

  const activeCount = ['retailer', 'province', 'price', 'category', 'recency', 'verified', 'postal'].filter(
    (k) => params.get(k)
  ).length;

  const selected = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? [];

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => set({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4), postal: null }),
      () => alert('Location unavailable — try a postal code instead.')
    );
  };

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <button onClick={() => setOpen(!open)} className="btn-secondary !py-2" aria-expanded={open}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeCount ? ` (${activeCount})` : ''}
        </button>

        {/* Quick chips */}
        {(['penny', 'under10c', 'off90'] as const).map((p) => (
          <button
            key={p}
            onClick={() => set({ price: params.get('price') === p ? null : p })}
            className={`chip border px-3 py-1.5 ${
              params.get('price') === p
                ? 'border-penny-500 bg-penny-500 text-white'
                : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
            }`}
          >
            {p === 'penny' ? 'Penny only' : p === 'under10c' ? 'Under 10¢' : '90%+ off'}
          </button>
        ))}
        <button
          onClick={() => set({ verified: params.get('verified') ? null : '1' })}
          className={`chip border px-3 py-1.5 ${
            params.get('verified')
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
          }`}
        >
          ✓ Verified only
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="sr-only">Sort</label>
          <select
            id="sort"
            className="input !w-auto !py-2"
            value={params.get('sort') ?? 'newest'}
            onChange={(e) => set({ sort: e.target.value === 'newest' ? null : e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="confirmed">Most confirmed</option>
            <option value="value">Highest original value</option>
            <option value="closest">Closest to me</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-3 grid max-w-6xl gap-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 md:grid-cols-2 lg:grid-cols-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Retailer</legend>
            <div className="flex flex-wrap gap-1.5">
              {retailers.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => toggleMulti('retailer', r.slug)}
                  className={`chip border px-2.5 py-1 ${
                    selected('retailer').includes(r.slug)
                      ? 'border-penny-500 bg-penny-500 text-white'
                      : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
                  }`}
                >
                  {r.name.replace(' Canada', '')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Province</legend>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {Object.keys(PROVINCES).map((p) => (
                <button
                  key={p}
                  onClick={() => toggleMulti('province', p)}
                  className={`chip border px-2.5 py-1 ${
                    selected('province').includes(p)
                      ? 'border-penny-500 bg-penny-500 text-white'
                      : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Near me</legend>
            <div className="flex gap-2">
              <input
                className="input !py-2"
                placeholder="Postal code or FSA (T2P)"
                defaultValue={params.get('postal') ?? ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') set({ postal: (e.target as HTMLInputElement).value || null, lat: null, lng: null });
                }}
                aria-label="Postal code or FSA"
              />
              <button onClick={useMyLocation} className="btn-secondary !px-3 !py-2" title="Use my location" aria-label="Use my location">
                <MapPin className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {RADIUS_OPTIONS_KM.map((km) => (
                <button
                  key={km}
                  onClick={() => set({ radius: String(km) })}
                  className={`chip border px-2.5 py-1 ${
                    (params.get('radius') ?? '25') === String(km)
                      ? 'border-penny-500 bg-penny-500 text-white'
                      : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">More</legend>
            <div className="grid gap-2">
              <select
                className="input !py-2"
                value={params.get('category') ?? ''}
                onChange={(e) => set({ category: e.target.value || null })}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="input !py-2"
                value={params.get('recency') ?? ''}
                onChange={(e) => set({ recency: e.target.value || null })}
                aria-label="Recency"
              >
                <option value="">Any time</option>
                <option value="24">Last 24 hours</option>
                <option value="72">Last 3 days</option>
                <option value="168">Last 7 days</option>
                <option value="720">Last 30 days</option>
              </select>
              <select
                className="input !py-2"
                value={params.get('price') ?? ''}
                onChange={(e) => set({ price: e.target.value || null })}
                aria-label="Price range"
              >
                <option value="">Any price</option>
                <option value="penny">Penny only ($0.01)</option>
                <option value="under10c">Under $0.10</option>
                <option value="under1">Under $1</option>
                <option value="off90">90%+ off</option>
                <option value="off70">70%+ off</option>
              </select>
            </div>
          </fieldset>

          <div className="md:col-span-2 lg:col-span-4">
            <button onClick={() => router.push(pathname)} className="btn-secondary !py-2 text-sm">
              <X className="h-4 w-4" /> Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
