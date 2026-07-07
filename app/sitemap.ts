import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/utils';
import { getDealViews, getRetailers, getStores, getCities, getAreaStats } from '@/lib/data/queries';
import { ARTICLES } from '@/lib/content/articles';
import { PROVINCE_CODES } from '@/lib/core/geo';

export const revalidate = 86_400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '', '/deals', '/deals/map', '/retailers', '/stores', '/lookup', '/decoder', '/report',
    '/guides', '/glossary', '/wall', '/leaderboard', '/pro', '/about', '/faq', '/contact',
    '/legal/terms', '/legal/privacy', '/legal/disclaimer',
  ].map((p) => ({ url: siteUrl(p), changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.7 }));

  const articles = ARTICLES.map((a) => ({
    url: siteUrl(`/guides/${a.slug}`),
    lastModified: new Date(a.updated),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const retailers = (await getRetailers()).map((r) => ({
    url: siteUrl(`/retailers/${r.slug}`),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const items = (await getDealViews({ includeDead: true })).map((v) => ({
    url: siteUrl(`/item/${v.item.upc}`),
    lastModified: new Date(v.deal.lastConfirmedAt),
    changeFrequency: 'hourly' as const,
    priority: 0.6,
  }));

  const stores = (await getStores()).map((s) => ({
    url: siteUrl(`/stores/${s.retailer.slug}/${s.province.toLowerCase()}/${s.slug}`),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // Thin-content protection (spec §4.11): only index areas with ≥3 deals.
  const provinces: MetadataRoute.Sitemap = [];
  for (const p of PROVINCE_CODES) {
    const stats = await getAreaStats(p);
    if (stats.total >= 3) {
      provinces.push({ url: siteUrl(`/deals/${p.toLowerCase()}`), changeFrequency: 'daily', priority: 0.8 });
    }
  }
  const cities: MetadataRoute.Sitemap = [];
  for (const c of await getCities()) {
    const stats = await getAreaStats(c.province, c.city);
    if (stats.total >= 3) {
      cities.push({
        url: siteUrl(`/deals/${c.province.toLowerCase()}/${c.slug}`),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  }

  return [...staticRoutes, ...articles, ...retailers, ...items, ...stores, ...provinces, ...cities];
}
