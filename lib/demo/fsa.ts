/**
 * FSA (Forward Sortation Area) centroids for postal-code radius search.
 * This seed covers ~90 high-population FSAs across every province/territory;
 * the full ~1,600-row national table loads via `npm run db:seed` from this
 * same source or can be replaced with a Statistics Canada extract (see
 * scripts/seed.ts and DECISIONS.md #6).
 */
export interface FsaCentroid {
  fsa: string;
  province: string;
  place: string;
  lat: number;
  lng: number;
}

export const FSA_CENTROIDS: FsaCentroid[] = [
  // ── Alberta ──
  { fsa: 'T2P', province: 'AB', place: 'Calgary (Downtown)', lat: 51.0453, lng: -114.0581 },
  { fsa: 'T2E', province: 'AB', place: 'Calgary (NE)', lat: 51.0782, lng: -114.0303 },
  { fsa: 'T3A', province: 'AB', place: 'Calgary (NW)', lat: 51.1245, lng: -114.1583 },
  { fsa: 'T2H', province: 'AB', place: 'Calgary (South)', lat: 50.9822, lng: -114.0736 },
  { fsa: 'T5J', province: 'AB', place: 'Edmonton (Downtown)', lat: 53.5408, lng: -113.4996 },
  { fsa: 'T5T', province: 'AB', place: 'Edmonton (West)', lat: 53.5153, lng: -113.6316 },
  { fsa: 'T6E', province: 'AB', place: 'Edmonton (South)', lat: 53.5115, lng: -113.4823 },
  { fsa: 'T8N', province: 'AB', place: 'St. Albert', lat: 53.6305, lng: -113.6256 },
  { fsa: 'T4B', province: 'AB', place: 'Airdrie', lat: 51.2917, lng: -114.0144 },
  { fsa: 'T1Y', province: 'AB', place: 'Calgary (Rundle)', lat: 51.0724, lng: -113.9757 },
  // ── British Columbia ──
  { fsa: 'V6B', province: 'BC', place: 'Vancouver (Downtown)', lat: 49.2794, lng: -123.1136 },
  { fsa: 'V5K', province: 'BC', place: 'Vancouver (Hastings)', lat: 49.2807, lng: -123.0397 },
  { fsa: 'V6X', province: 'BC', place: 'Richmond', lat: 49.1838, lng: -123.1335 },
  { fsa: 'V5H', province: 'BC', place: 'Burnaby (Metrotown)', lat: 49.2258, lng: -123.0036 },
  { fsa: 'V3T', province: 'BC', place: 'Surrey (Whalley)', lat: 49.1913, lng: -122.8474 },
  { fsa: 'V2E', province: 'BC', place: 'Kelowna', lat: 49.8538, lng: -119.4891 },
  { fsa: 'V8W', province: 'BC', place: 'Victoria (Downtown)', lat: 48.4262, lng: -123.3657 },
  { fsa: 'V9A', province: 'BC', place: 'Victoria (Esquimalt)', lat: 48.4394, lng: -123.4013 },
  { fsa: 'V3C', province: 'BC', place: 'Port Coquitlam', lat: 49.2624, lng: -122.7811 },
  // ── Ontario ──
  { fsa: 'M5V', province: 'ON', place: 'Toronto (Entertainment District)', lat: 43.6454, lng: -79.3951 },
  { fsa: 'M4W', province: 'ON', place: 'Toronto (Rosedale)', lat: 43.6764, lng: -79.3805 },
  { fsa: 'M1P', province: 'ON', place: 'Scarborough', lat: 43.7595, lng: -79.2694 },
  { fsa: 'M9W', province: 'ON', place: 'Etobicoke (Rexdale)', lat: 43.7115, lng: -79.5788 },
  { fsa: 'M3J', province: 'ON', place: 'North York', lat: 43.7679, lng: -79.4899 },
  { fsa: 'L5B', province: 'ON', place: 'Mississauga (City Centre)', lat: 43.5891, lng: -79.6407 },
  { fsa: 'L6Y', province: 'ON', place: 'Brampton', lat: 43.6626, lng: -79.7737 },
  { fsa: 'L4M', province: 'ON', place: 'Barrie', lat: 44.4001, lng: -79.6663 },
  { fsa: 'K1P', province: 'ON', place: 'Ottawa (Downtown)', lat: 45.4211, lng: -75.6969 },
  { fsa: 'K2P', province: 'ON', place: 'Ottawa (Centretown)', lat: 45.4165, lng: -75.6919 },
  { fsa: 'L8P', province: 'ON', place: 'Hamilton (Durand)', lat: 43.2513, lng: -79.8811 },
  { fsa: 'L8E', province: 'ON', place: 'Stoney Creek', lat: 43.2249, lng: -79.7135 },
  { fsa: 'N2G', province: 'ON', place: 'Kitchener (Downtown)', lat: 43.4487, lng: -80.4909 },
  { fsa: 'N2L', province: 'ON', place: 'Waterloo', lat: 43.4718, lng: -80.5426 },
  { fsa: 'N6A', province: 'ON', place: 'London (Downtown)', lat: 42.9871, lng: -81.2467 },
  { fsa: 'N6E', province: 'ON', place: 'London (White Oaks)', lat: 42.9295, lng: -81.2249 },
  { fsa: 'L2H', province: 'ON', place: 'Niagara Falls', lat: 43.0946, lng: -79.1207 },
  { fsa: 'K7L', province: 'ON', place: 'Kingston', lat: 44.2312, lng: -76.4816 },
  { fsa: 'P3E', province: 'ON', place: 'Sudbury', lat: 46.4726, lng: -80.9912 },
  { fsa: 'P7B', province: 'ON', place: 'Thunder Bay', lat: 48.4123, lng: -89.2405 },
  { fsa: 'L1H', province: 'ON', place: 'Oshawa', lat: 43.8971, lng: -78.8658 },
  { fsa: 'L3R', province: 'ON', place: 'Markham', lat: 43.8563, lng: -79.3155 },
  { fsa: 'L4K', province: 'ON', place: 'Vaughan (Concord)', lat: 43.7942, lng: -79.4877 },
  // ── Quebec ──
  { fsa: 'H2X', province: 'QC', place: 'Montréal (Quartier Latin)', lat: 45.5122, lng: -73.5687 },
  { fsa: 'H3B', province: 'QC', place: 'Montréal (Downtown)', lat: 45.5001, lng: -73.5711 },
  { fsa: 'H1S', province: 'QC', place: 'Montréal (Saint-Léonard)', lat: 45.5843, lng: -73.5891 },
  { fsa: 'H7T', province: 'QC', place: 'Laval (Chomedey)', lat: 45.5588, lng: -73.7501 },
  { fsa: 'H8N', province: 'QC', place: 'LaSalle', lat: 45.4283, lng: -73.6323 },
  { fsa: 'J4B', province: 'QC', place: 'Boucherville', lat: 45.6035, lng: -73.4374 },
  { fsa: 'G1R', province: 'QC', place: 'Québec (Vieux-Québec)', lat: 46.8098, lng: -71.2199 },
  { fsa: 'G2B', province: 'QC', place: 'Québec (Loretteville)', lat: 46.8494, lng: -71.3541 },
  { fsa: 'J8X', province: 'QC', place: 'Gatineau (Hull)', lat: 45.4287, lng: -75.7143 },
  { fsa: 'J1H', province: 'QC', place: 'Sherbrooke', lat: 45.4042, lng: -71.8929 },
  // ── Manitoba ──
  { fsa: 'R3C', province: 'MB', place: 'Winnipeg (Downtown)', lat: 49.8927, lng: -97.1442 },
  { fsa: 'R2C', province: 'MB', place: 'Winnipeg (Transcona)', lat: 49.8983, lng: -96.9887 },
  { fsa: 'R3T', province: 'MB', place: 'Winnipeg (Fort Garry)', lat: 49.8104, lng: -97.1355 },
  // ── Saskatchewan ──
  { fsa: 'S7K', province: 'SK', place: 'Saskatoon (Downtown)', lat: 52.1332, lng: -106.6700 },
  { fsa: 'S7H', province: 'SK', place: 'Saskatoon (Nutana)', lat: 52.1084, lng: -106.6338 },
  { fsa: 'S4P', province: 'SK', place: 'Regina (Downtown)', lat: 50.4501, lng: -104.6178 },
  { fsa: 'S4X', province: 'SK', place: 'Regina (Northwest)', lat: 50.4818, lng: -104.6538 },
  // ── Nova Scotia ──
  { fsa: 'B3J', province: 'NS', place: 'Halifax (Downtown)', lat: 44.6476, lng: -63.5728 },
  { fsa: 'B3K', province: 'NS', place: 'Halifax (North End)', lat: 44.6608, lng: -63.5946 },
  { fsa: 'B4A', province: 'NS', place: 'Bedford', lat: 44.7325, lng: -63.6567 },
  // ── New Brunswick ──
  { fsa: 'E1C', province: 'NB', place: 'Moncton', lat: 46.0878, lng: -64.7782 },
  { fsa: 'E2K', province: 'NB', place: 'Saint John', lat: 45.2904, lng: -66.0768 },
  { fsa: 'E3B', province: 'NB', place: 'Fredericton', lat: 45.9636, lng: -66.6431 },
  // ── Newfoundland and Labrador ──
  { fsa: 'A1C', province: 'NL', place: "St. John's (Downtown)", lat: 47.5615, lng: -52.7126 },
  { fsa: 'A1B', province: 'NL', place: "St. John's (North)", lat: 47.5859, lng: -52.7448 },
  // ── Prince Edward Island ──
  { fsa: 'C1A', province: 'PE', place: 'Charlottetown', lat: 46.2382, lng: -63.1311 },
  // ── Territories ──
  { fsa: 'X1A', province: 'NT', place: 'Yellowknife', lat: 62.4540, lng: -114.3718 },
  { fsa: 'Y1A', province: 'YT', place: 'Whitehorse', lat: 60.7212, lng: -135.0568 },
  { fsa: 'X0A', province: 'NU', place: 'Iqaluit', lat: 63.7467, lng: -68.5170 },
];

const byFsa = new Map(FSA_CENTROIDS.map((c) => [c.fsa, c]));

export function lookupFsa(fsa: string): FsaCentroid | undefined {
  return byFsa.get(fsa.toUpperCase());
}
