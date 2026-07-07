import type { DealFilters } from './queries';
import { resolvePostal } from './queries';
import type { PriceFilter } from '../core/pricing';

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** Translate feed URL search params (from FiltersBar) into DealFilters. */
export function parseDealFilters(sp: SearchParams): DealFilters {
  const filters: DealFilters = {};

  const retailer = first(sp.retailer);
  if (retailer) filters.retailers = retailer.split(',').filter(Boolean);

  const province = first(sp.province);
  if (province) filters.provinces = province.split(',').filter(Boolean);

  const city = first(sp.city);
  if (city) filters.city = city;

  const price = first(sp.price);
  if (price && ['penny', 'under10c', 'under1', 'off90', 'off70'].includes(price)) {
    filters.price = price as PriceFilter;
  }

  const category = first(sp.category);
  if (category) filters.category = category;

  const recency = parseInt(first(sp.recency) ?? '', 10);
  if (Number.isFinite(recency) && recency > 0) filters.recencyHours = recency;

  if (first(sp.verified)) filters.verifiedOnly = true;

  const sort = first(sp.sort);
  if (sort && ['newest', 'confirmed', 'value', 'closest'].includes(sort)) {
    filters.sort = sort as DealFilters['sort'];
  }

  const radiusKm = parseInt(first(sp.radius) ?? '25', 10) || 25;
  const lat = parseFloat(first(sp.lat) ?? '');
  const lng = parseFloat(first(sp.lng) ?? '');
  const postal = first(sp.postal);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    filters.near = { lat, lng, radiusKm };
  } else if (postal) {
    const origin = resolvePostal(postal);
    if (origin) filters.near = { lat: origin.lat, lng: origin.lng, radiusKm };
  }
  if (filters.near && !filters.sort) filters.sort = 'closest';

  return filters;
}
