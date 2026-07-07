import type { StoreRec } from '../types';

/**
 * Phase-1 store seed: Home Depot / Walmart / Dollar Tree locations across the
 * 15 largest Canadian metros. Coordinates are real-neighbourhood accurate;
 * addresses are representative and replaceable via the CSV importer
 * (scripts/import-stores.ts). See DECISIONS.md #7.
 */
export const STORES: StoreRec[] = [
  // ── Toronto, ON ──
  { id: 's-hd-tor-1', retailerId: 'r-home-depot', name: 'Home Depot — Toronto Stockyards', slug: 'toronto-stockyards', address: '100 Weston Rd', city: 'Toronto', province: 'ON', postalCode: 'M6N 3P8', lat: 43.6672, lng: -79.4778, friendlinessAvg: 4.2, friendlinessCount: 18 },
  { id: 's-hd-tor-2', retailerId: 'r-home-depot', name: 'Home Depot — Leaside', slug: 'toronto-leaside', address: '45 Wicksteed Ave', city: 'Toronto', province: 'ON', postalCode: 'M4G 4H9', lat: 43.7076, lng: -79.3652, friendlinessAvg: 3.6, friendlinessCount: 11 },
  { id: 's-wm-tor-1', retailerId: 'r-walmart', name: 'Walmart — Toronto Dufferin Mall', slug: 'toronto-dufferin-mall', address: '900 Dufferin St', city: 'Toronto', province: 'ON', postalCode: 'M6H 4A9', lat: 43.6562, lng: -79.4353, friendlinessAvg: 3.9, friendlinessCount: 14 },
  { id: 's-dt-tor-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Toronto Gerrard Square', slug: 'toronto-gerrard-square', address: '1000 Gerrard St E', city: 'Toronto', province: 'ON', postalCode: 'M4M 3G6', lat: 43.6688, lng: -79.3427, friendlinessAvg: 4.5, friendlinessCount: 7 },
  // ── Mississauga, ON ──
  { id: 's-hd-mis-1', retailerId: 'r-home-depot', name: 'Home Depot — Mississauga Heartland', slug: 'mississauga-heartland', address: '5975 Mavis Rd', city: 'Mississauga', province: 'ON', postalCode: 'L5R 3T7', lat: 43.6153, lng: -79.7104, friendlinessAvg: 4.0, friendlinessCount: 9 },
  { id: 's-wm-mis-1', retailerId: 'r-walmart', name: 'Walmart — Mississauga Square One', slug: 'mississauga-square-one', address: '100 City Centre Dr', city: 'Mississauga', province: 'ON', postalCode: 'L5B 2C9', lat: 43.5931, lng: -79.6403, friendlinessAvg: 3.4, friendlinessCount: 8 },
  // ── Brampton, ON ──
  { id: 's-hd-bra-1', retailerId: 'r-home-depot', name: 'Home Depot — Brampton South', slug: 'brampton-south', address: '50 Great Lakes Dr', city: 'Brampton', province: 'ON', postalCode: 'L6R 2K7', lat: 43.7315, lng: -79.7624, friendlinessAvg: 3.8, friendlinessCount: 6 },
  // ── Hamilton, ON ──
  { id: 's-hd-ham-1', retailerId: 'r-home-depot', name: 'Home Depot — Hamilton Upper James', slug: 'hamilton-upper-james', address: '1301 Upper James St', city: 'Hamilton', province: 'ON', postalCode: 'L9C 3B4', lat: 43.2113, lng: -79.8896, friendlinessAvg: 4.1, friendlinessCount: 10 },
  { id: 's-wm-ham-1', retailerId: 'r-walmart', name: 'Walmart — Hamilton Centre Mall', slug: 'hamilton-centre-mall', address: '1227 Barton St E', city: 'Hamilton', province: 'ON', postalCode: 'L8H 2V4', lat: 43.2497, lng: -79.8135, friendlinessAvg: 3.7, friendlinessCount: 5 },
  // ── Kitchener-Waterloo, ON ──
  { id: 's-hd-kit-1', retailerId: 'r-home-depot', name: 'Home Depot — Kitchener', slug: 'kitchener', address: '1050 Victoria St N', city: 'Kitchener', province: 'ON', postalCode: 'N2B 3C9', lat: 43.4645, lng: -80.4551, friendlinessAvg: 4.3, friendlinessCount: 8 },
  // ── London, ON ──
  { id: 's-hd-lon-1', retailerId: 'r-home-depot', name: 'Home Depot — London North', slug: 'london-north', address: '1050 Wonderland Rd N', city: 'London', province: 'ON', postalCode: 'N6G 5B9', lat: 43.0126, lng: -81.3153, friendlinessAvg: 3.9, friendlinessCount: 7 },
  { id: 's-dt-lon-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — London White Oaks', slug: 'london-white-oaks', address: '1105 Wellington Rd', city: 'London', province: 'ON', postalCode: 'N6E 1V4', lat: 42.9298, lng: -81.2257, friendlinessAvg: 4.6, friendlinessCount: 4 },
  // ── Ottawa, ON ──
  { id: 's-hd-ott-1', retailerId: 'r-home-depot', name: 'Home Depot — Ottawa Merivale', slug: 'ottawa-merivale', address: '1900 Merivale Rd', city: 'Ottawa', province: 'ON', postalCode: 'K2G 4N4', lat: 45.3372, lng: -75.7301, friendlinessAvg: 4.0, friendlinessCount: 12 },
  { id: 's-wm-ott-1', retailerId: 'r-walmart', name: 'Walmart — Ottawa Trainyards', slug: 'ottawa-trainyards', address: '450 Terminal Ave', city: 'Ottawa', province: 'ON', postalCode: 'K1G 0Z3', lat: 45.4137, lng: -75.6513, friendlinessAvg: 3.5, friendlinessCount: 9 },
  // ── Montréal, QC ──
  { id: 's-hd-mtl-1', retailerId: 'r-home-depot', name: 'Home Depot — Montréal Anjou', slug: 'montreal-anjou', address: '7300 Boul des Galeries d’Anjou', city: 'Montréal', province: 'QC', postalCode: 'H1M 3M2', lat: 45.6058, lng: -73.5645, friendlinessAvg: 3.8, friendlinessCount: 6 },
  { id: 's-wm-mtl-1', retailerId: 'r-walmart', name: 'Walmart — Montréal Marché Central', slug: 'montreal-marche-central', address: '9100 Boul de l’Acadie', city: 'Montréal', province: 'QC', postalCode: 'H4N 3K1', lat: 45.5342, lng: -73.6591, friendlinessAvg: 3.6, friendlinessCount: 8 },
  { id: 's-dt-mtl-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Montréal LaSalle', slug: 'montreal-lasalle', address: '7575 Boul Newman', city: 'Montréal', province: 'QC', postalCode: 'H8N 1X7', lat: 45.4302, lng: -73.6301, friendlinessAvg: 4.2, friendlinessCount: 3 },
  // ── Québec City, QC ──
  { id: 's-hd-qc-1', retailerId: 'r-home-depot', name: 'Home Depot — Québec Lebourgneuf', slug: 'quebec-lebourgneuf', address: '5555 Boul des Gradins', city: 'Québec', province: 'QC', postalCode: 'G2J 1C8', lat: 46.8353, lng: -71.2932, friendlinessAvg: 3.9, friendlinessCount: 4 },
  // ── Gatineau, QC ──
  { id: 's-wm-gat-1', retailerId: 'r-walmart', name: 'Walmart — Gatineau Hull', slug: 'gatineau-hull', address: '425 Boul Saint-Joseph', city: 'Gatineau', province: 'QC', postalCode: 'J8Y 3Z8', lat: 45.4453, lng: -75.7361, friendlinessAvg: 3.3, friendlinessCount: 3 },
  // ── Calgary, AB ──
  { id: 's-hd-cal-1', retailerId: 'r-home-depot', name: 'Home Depot — Calgary Sunridge', slug: 'calgary-sunridge', address: '2525 36 St NE', city: 'Calgary', province: 'AB', postalCode: 'T1Y 5T4', lat: 51.0713, lng: -113.9811, friendlinessAvg: 4.4, friendlinessCount: 21 },
  { id: 's-hd-cal-2', retailerId: 'r-home-depot', name: 'Home Depot — Calgary Beacon Hill', slug: 'calgary-beacon-hill', address: '11655 Sarcee Trail NW', city: 'Calgary', province: 'AB', postalCode: 'T3R 0A1', lat: 51.1602, lng: -114.1503, friendlinessAvg: 3.7, friendlinessCount: 13 },
  { id: 's-wm-cal-1', retailerId: 'r-walmart', name: 'Walmart — Calgary Chinook', slug: 'calgary-chinook', address: '6455 Macleod Trail SW', city: 'Calgary', province: 'AB', postalCode: 'T2H 0K8', lat: 50.9975, lng: -114.0714, friendlinessAvg: 4.1, friendlinessCount: 16 },
  { id: 's-dt-cal-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Calgary Marlborough', slug: 'calgary-marlborough', address: '1240 36 St NE', city: 'Calgary', province: 'AB', postalCode: 'T2A 6M6', lat: 51.0587, lng: -113.9814, friendlinessAvg: 4.7, friendlinessCount: 9 },
  // ── Edmonton, AB ──
  { id: 's-hd-edm-1', retailerId: 'r-home-depot', name: 'Home Depot — Edmonton Westmount', slug: 'edmonton-westmount', address: '11803 104 Ave NW', city: 'Edmonton', province: 'AB', postalCode: 'T5K 2T7', lat: 53.5479, lng: -113.5311, friendlinessAvg: 4.0, friendlinessCount: 11 },
  { id: 's-wm-edm-1', retailerId: 'r-walmart', name: 'Walmart — Edmonton South Common', slug: 'edmonton-south-common', address: '1418 99 St NW', city: 'Edmonton', province: 'AB', postalCode: 'T6N 1M5', lat: 53.4577, lng: -113.4893, friendlinessAvg: 3.8, friendlinessCount: 12 },
  { id: 's-dt-edm-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Edmonton Kingsway', slug: 'edmonton-kingsway', address: '109 Kingsway Mall', city: 'Edmonton', province: 'AB', postalCode: 'T5G 3A6', lat: 53.5602, lng: -113.5036, friendlinessAvg: 4.3, friendlinessCount: 5 },
  // ── Vancouver, BC ──
  { id: 's-hd-van-1', retailerId: 'r-home-depot', name: 'Home Depot — Vancouver Terminal', slug: 'vancouver-terminal', address: '900 Terminal Ave', city: 'Vancouver', province: 'BC', postalCode: 'V6A 4G4', lat: 49.2731, lng: -123.0912, friendlinessAvg: 3.5, friendlinessCount: 15 },
  { id: 's-wm-van-1', retailerId: 'r-walmart', name: 'Walmart — Vancouver Grandview', slug: 'vancouver-grandview', address: '3585 Grandview Hwy', city: 'Vancouver', province: 'BC', postalCode: 'V5M 2G7', lat: 49.2588, lng: -123.0276, friendlinessAvg: 3.9, friendlinessCount: 10 },
  { id: 's-dt-van-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Vancouver Kingsgate', slug: 'vancouver-kingsgate', address: '370 E Broadway', city: 'Vancouver', province: 'BC', postalCode: 'V5T 4G5', lat: 49.2625, lng: -123.0949, friendlinessAvg: 4.4, friendlinessCount: 6 },
  // ── Surrey, BC ──
  { id: 's-hd-sur-1', retailerId: 'r-home-depot', name: 'Home Depot — Surrey Central', slug: 'surrey-central', address: '10160 152 St', city: 'Surrey', province: 'BC', postalCode: 'V3R 4G8', lat: 49.1898, lng: -122.8007, friendlinessAvg: 4.2, friendlinessCount: 8 },
  { id: 's-wm-sur-1', retailerId: 'r-walmart', name: 'Walmart — Surrey Guildford', slug: 'surrey-guildford', address: '10355 152 St', city: 'Surrey', province: 'BC', postalCode: 'V3R 7C1', lat: 49.1926, lng: -122.8009, friendlinessAvg: 3.6, friendlinessCount: 7 },
  // ── Burnaby, BC ──
  { id: 's-wm-bur-1', retailerId: 'r-walmart', name: 'Walmart — Burnaby Metrotown', slug: 'burnaby-metrotown', address: '4545 Central Blvd', city: 'Burnaby', province: 'BC', postalCode: 'V5H 4J5', lat: 49.2276, lng: -123.0076, friendlinessAvg: 3.8, friendlinessCount: 9 },
  // ── Victoria, BC ──
  { id: 's-hd-vic-1', retailerId: 'r-home-depot', name: 'Home Depot — Victoria Langford', slug: 'victoria-langford', address: '850 Langford Pkwy', city: 'Victoria', province: 'BC', postalCode: 'V9B 4V5', lat: 48.4474, lng: -123.5046, friendlinessAvg: 4.1, friendlinessCount: 5 },
  // ── Winnipeg, MB ──
  { id: 's-hd-win-1', retailerId: 'r-home-depot', name: 'Home Depot — Winnipeg Polo Park', slug: 'winnipeg-polo-park', address: '1665 Kenaston Blvd', city: 'Winnipeg', province: 'MB', postalCode: 'R3P 2M4', lat: 49.8231, lng: -97.2032, friendlinessAvg: 4.0, friendlinessCount: 6 },
  { id: 's-wm-win-1', retailerId: 'r-walmart', name: 'Walmart — Winnipeg Regent', slug: 'winnipeg-regent', address: '1576 Regent Ave W', city: 'Winnipeg', province: 'MB', postalCode: 'R2C 3B4', lat: 49.8992, lng: -97.0623, friendlinessAvg: 3.7, friendlinessCount: 4 },
  // ── Saskatoon, SK ──
  { id: 's-hd-sas-1', retailerId: 'r-home-depot', name: 'Home Depot — Saskatoon Preston Crossing', slug: 'saskatoon-preston-crossing', address: '1730 Preston Ave N', city: 'Saskatoon', province: 'SK', postalCode: 'S7N 4Y1', lat: 52.1580, lng: -106.6099, friendlinessAvg: 4.2, friendlinessCount: 3 },
  // ── Regina, SK ──
  { id: 's-wm-reg-1', retailerId: 'r-walmart', name: 'Walmart — Regina East', slug: 'regina-east', address: '2150 Prince of Wales Dr', city: 'Regina', province: 'SK', postalCode: 'S4V 3A6', lat: 50.4515, lng: -104.5453, friendlinessAvg: 3.9, friendlinessCount: 2 },
  // ── Halifax, NS ──
  { id: 's-hd-hal-1', retailerId: 'r-home-depot', name: 'Home Depot — Halifax Bayers Lake', slug: 'halifax-bayers-lake', address: '368 Susie Lake Cres', city: 'Halifax', province: 'NS', postalCode: 'B3S 1C7', lat: 44.6412, lng: -63.6733, friendlinessAvg: 4.3, friendlinessCount: 5 },
  { id: 's-dt-hal-1', retailerId: 'r-dollar-tree', name: 'Dollar Tree — Halifax Shopping Centre', slug: 'halifax-shopping-centre', address: '7001 Mumford Rd', city: 'Halifax', province: 'NS', postalCode: 'B3L 4N9', lat: 44.6497, lng: -63.6207, friendlinessAvg: 4.5, friendlinessCount: 2 },
  // ── St. John's, NL ──
  { id: 's-wm-stj-1', retailerId: 'r-walmart', name: "Walmart — St. John's Stavanger", slug: 'st-johns-stavanger', address: '55 Stavanger Dr', city: "St. John's", province: 'NL', postalCode: 'A1A 5E8', lat: 47.6153, lng: -52.7362, friendlinessAvg: 4.0, friendlinessCount: 2 },
];

export const storeById = new Map(STORES.map((s) => [s.id, s]));
