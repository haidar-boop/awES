'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import type { DealView } from '@/lib/types';
import { formatCad } from '@/lib/core/pricing';
import { timeAgo } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  verified: '#059669',
  likely: '#d97706',
  unconfirmed: '#78716c',
  dead: '#dc2626',
};

interface Pin {
  storeId: string;
  lat: number;
  lng: number;
  storeName: string;
  city: string;
  province: string;
  deals: DealView[];
  bestStatus: string;
}

/** Cluster reports by store; pin colour = best confidence at that store (spec §4.1). */
function buildPins(views: DealView[]): Pin[] {
  const rank: Record<string, number> = { verified: 3, likely: 2, unconfirmed: 1, dead: 0 };
  const byStore = new Map<string, Pin>();
  for (const v of views) {
    for (const r of v.reports) {
      const pin = byStore.get(r.storeId) ?? {
        storeId: r.storeId,
        lat: r.store.lat,
        lng: r.store.lng,
        storeName: r.store.name,
        city: r.store.city,
        province: r.store.province,
        deals: [],
        bestStatus: 'unconfirmed',
      };
      if (!pin.deals.includes(v)) pin.deals.push(v);
      if (rank[v.deal.status] > rank[pin.bestStatus]) pin.bestStatus = v.deal.status;
      byStore.set(r.storeId, pin);
    }
  }
  return [...byStore.values()];
}

export default function DealMapInner({ views }: { views: DealView[] }) {
  const pins = buildPins(views);

  return (
    <MapContainer center={[54.5, -98]} zoom={4} className="h-[70vh]" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <CircleMarker
          key={pin.storeId}
          center={[pin.lat, pin.lng]}
          radius={7 + Math.min(pin.deals.length * 1.5, 8)}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: STATUS_COLOR[pin.bestStatus],
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div className="min-w-52">
              <p className="font-semibold">{pin.storeName}</p>
              <p className="text-xs text-stone-500">
                {pin.city}, {pin.province} · {pin.deals.length} deal{pin.deals.length === 1 ? '' : 's'}
              </p>
              <ul className="mt-2 space-y-1.5">
                {pin.deals.slice(0, 4).map((v) => (
                  <li key={v.deal.id}>
                    <Link href={`/item/${v.item.upc}`} className="text-sm font-medium text-penny-600 hover:underline">
                      {formatCad(v.deal.bestPrice)} — {v.item.name}
                    </Link>
                    <span className="block text-xs text-stone-400">{timeAgo(v.deal.lastConfirmedAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
