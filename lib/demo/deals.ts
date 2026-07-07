import type { DealRec, ItemRec, ReportRec } from '../types';
import type { DealStatus } from '../core/confidence';

/**
 * 25 realistic sample deals (spec §12), badged isSample=true so admins can
 * purge them in one click. Recency is relative to server time so the demo
 * feed always looks live. UPCs are check-digit valid.
 */

const H = 3_600_000;
const hoursAgo = (h: number) => new Date(Date.now() - h * H).toISOString();

interface Seed {
  upc: string;
  sku?: string;
  name: string;
  brand: string;
  category: string;
  orig: number;
  price: number;
  retailer: string;
  status: DealStatus;
  confirms: number;
  dead: number;
  receipt: boolean;
  featured?: boolean;
  ageH: number; // hours since first report
  lastH: number; // hours since last confirmation
  stores: [storeId: string, userId: string, hoursAgo: number, note?: string][];
}

const SEEDS: Seed[] = [
  { upc: '885000110375', sku: '1001098765', name: 'RYOBI 18V ONE+ Cordless Drill Kit', brand: 'RYOBI', category: 'Tools', orig: 149.0, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 5, dead: 0, receipt: true, featured: true, ageH: 26, lastH: 3, stores: [['s-hd-tor-1', 'u-demo-2', 26, 'Clearance endcap aisle 12'], ['s-hd-mis-1', 'u-demo-2', 20], ['s-hd-cal-1', 'u-demo-1', 8, 'Top stock above aisle 9'], ['s-hd-van-1', 'u-demo-3', 3]] },
  { upc: '885000110740', name: 'Philips Hue White A19 2-Pack', brand: 'Philips', category: 'Lighting', orig: 49.98, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 3, dead: 0, receipt: true, ageH: 50, lastH: 9, stores: [['s-hd-cal-1', 'u-demo-1', 50, 'Back rack near returns'], ['s-hd-cal-2', 'u-demo-6', 30], ['s-hd-edm-1', 'u-demo-1', 9]] },
  { upc: '885000111112', name: 'Christmas Inflatable Snowman 8ft', brand: 'Holiday Living', category: 'Seasonal', orig: 89.98, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 4, dead: 1, receipt: false, ageH: 70, lastH: 12, stores: [['s-hd-ott-1', 'u-demo-4', 70], ['s-hd-tor-2', 'u-demo-2', 40], ['s-hd-win-1', 'u-demo-5', 12]] },
  { upc: '885000111488', name: 'Keter Outdoor Storage Bench 227L', brand: 'Keter', category: 'Garden', orig: 179.0, price: 0.03, retailer: 'r-home-depot', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 30, lastH: 30, stores: [['s-hd-sur-1', 'u-demo-3', 30, 'Garden centre clearance corner']] },
  { upc: '885000111853', name: 'Moen Chrome Bath Faucet', brand: 'Moen', category: 'Bath', orig: 89.0, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 2, dead: 0, receipt: true, ageH: 100, lastH: 20, stores: [['s-hd-vic-1', 'u-demo-3', 100], ['s-hd-van-1', 'u-demo-3', 20, 'Back rack, one unit left']] },
  { upc: '885000112225', name: 'GE 6-Outlet Surge Protector', brand: 'GE', category: 'Electronics', orig: 24.98, price: 0.02, retailer: 'r-walmart', status: 'verified', confirms: 3, dead: 0, receipt: true, ageH: 45, lastH: 6, stores: [['s-wm-cal-1', 'u-demo-1', 45], ['s-wm-edm-1', 'u-demo-6', 22], ['s-wm-tor-1', 'u-demo-2', 6, 'Electronics clearance shelf, bottom row']] },
  { upc: '885000112591', name: 'Mainstays 12-Piece Dinnerware Set', brand: 'Mainstays', category: 'Home Decor', orig: 39.97, price: 0.03, retailer: 'r-walmart', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 18, lastH: 18, stores: [['s-wm-mis-1', 'u-demo-2', 18, 'Hidden clearance — shelf shows $39.97']] },
  { upc: '885000112966', name: 'Ozark Trail 2-Person Dome Tent', brand: 'Ozark Trail', category: 'Seasonal', orig: 49.97, price: 0.02, retailer: 'r-walmart', status: 'verified', confirms: 4, dead: 0, receipt: false, featured: true, ageH: 55, lastH: 4, stores: [['s-wm-ott-1', 'u-demo-4', 55], ['s-wm-ham-1', 'u-demo-2', 33], ['s-wm-sur-1', 'u-demo-3', 4]] },
  { upc: '885000113338', name: 'Halloween LED Pathway Lights 4-Pack', brand: 'Way to Celebrate', category: 'Seasonal', orig: 14.97, price: 0.02, retailer: 'r-walmart', status: 'unconfirmed', confirms: 0, dead: 0, receipt: false, ageH: 7, lastH: 7, stores: [['s-wm-win-1', 'u-demo-7', 7]] },
  { upc: '885000113703', name: 'Craft Foam Sheets 40-Pack', brand: 'Crafter’s Square', category: 'Toys', orig: 1.25, price: 0.01, retailer: 'r-dollar-tree', status: 'verified', confirms: 6, dead: 0, receipt: true, ageH: 66, lastH: 5, stores: [['s-dt-cal-1', 'u-demo-1', 66, 'Craft aisle, old packaging'], ['s-dt-edm-1', 'u-demo-6', 40], ['s-dt-tor-1', 'u-demo-2', 5]] },
  { upc: '885000114076', name: 'Easter Basket Grass 3-Pack', brand: 'Greenbrier', category: 'Seasonal', orig: 1.25, price: 0.01, retailer: 'r-dollar-tree', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 40, lastH: 40, stores: [['s-dt-van-1', 'u-demo-3', 40, 'Seasonal shelf, missed on markdown day']] },
  { upc: '885000114441', name: 'DEWALT 20V MAX Battery 2-Pack', brand: 'DEWALT', category: 'Tools', orig: 199.0, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 7, dead: 1, receipt: true, featured: true, ageH: 96, lastH: 2, stores: [['s-hd-cal-1', 'u-demo-1', 96, 'Locked cage — ask for tool corral'], ['s-hd-edm-1', 'u-demo-6', 60], ['s-hd-tor-1', 'u-demo-2', 24], ['s-hd-lon-1', 'u-demo-2', 2]] },
  { upc: '885000114816', name: 'Rubbermaid 50L Storage Tote', brand: 'Rubbermaid', category: 'Home Decor', orig: 12.97, price: 0.97, retailer: 'r-walmart', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 44, lastH: 44, stores: [['s-wm-bur-1', 'u-demo-3', 44]] },
  { upc: '885000115189', name: 'Scotts Turf Builder 5kg', brand: 'Scotts', category: 'Garden', orig: 34.98, price: 0.04, retailer: 'r-home-depot', status: 'unconfirmed', confirms: 0, dead: 0, receipt: false, ageH: 12, lastH: 12, stores: [['s-hd-ham-1', 'u-demo-7', 12, 'Garden centre, pallet by the fence']] },
  { upc: '885000115554', name: 'Frameless LED Vanity Mirror 24"', brand: 'Glacier Bay', category: 'Bath', orig: 129.0, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 2, dead: 0, receipt: false, ageH: 58, lastH: 10, stores: [['s-hd-kit-1', 'u-demo-2', 58], ['s-hd-bra-1', 'u-demo-2', 10]] },
  { upc: '885000115929', name: 'Hot Wheels 5-Pack (Discontinued)', brand: 'Hot Wheels', category: 'Toys', orig: 6.97, price: 0.02, retailer: 'r-walmart', status: 'dead', confirms: 2, dead: 3, receipt: false, ageH: 200, lastH: 130, stores: [['s-wm-tor-1', 'u-demo-2', 200], ['s-wm-mtl-1', 'u-demo-8', 130]] },
  { upc: '885000116292', name: 'LED String Lights 25ft Outdoor', brand: 'Hampton Bay', category: 'Lighting', orig: 39.98, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 3, dead: 0, receipt: true, ageH: 33, lastH: 7, stores: [['s-hd-mtl-1', 'u-demo-8', 33], ['s-hd-qc-1', 'u-demo-8', 7]] },
  { upc: '885000116667', name: 'Garage Ceiling Storage Rack 4x8', brand: 'SafeRacks', category: 'Hardware', orig: 249.0, price: 0.02, retailer: 'r-home-depot', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 22, lastH: 22, stores: [['s-hd-sas-1', 'u-demo-5', 22, 'Overhead storage aisle, top shelf']] },
  { upc: '885000117039', name: 'Stainless Cabinet Pulls 10-Pack', brand: 'Richelieu', category: 'Hardware', orig: 29.98, price: 0.01, retailer: 'r-home-depot', status: 'unconfirmed', confirms: 0, dead: 1, receipt: false, ageH: 15, lastH: 15, stores: [['s-hd-hal-1', 'u-demo-7', 15]] },
  { upc: '885000117404', name: 'Party Balloon Arch Kit', brand: 'Way to Celebrate', category: 'Seasonal', orig: 9.97, price: 0.03, retailer: 'r-walmart', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 28, lastH: 28, stores: [['s-wm-reg-1', 'u-demo-5', 28]] },
  { upc: '885000117770', name: 'Ceramic Planter Set of 3', brand: 'Better Homes', category: 'Garden', orig: 24.97, price: 0.02, retailer: 'r-walmart', status: 'verified', confirms: 2, dead: 0, receipt: true, ageH: 80, lastH: 16, stores: [['s-wm-gat-1', 'u-demo-8', 80], ['s-wm-mtl-1', 'u-demo-8', 16]] },
  { upc: '885000118142', name: 'Gift Bag Assortment 12-Pack', brand: 'Voila', category: 'Other', orig: 1.25, price: 0.01, retailer: 'r-dollar-tree', status: 'unconfirmed', confirms: 0, dead: 0, receipt: false, ageH: 5, lastH: 5, stores: [['s-dt-lon-1', 'u-demo-6', 5]] },
  { upc: '885000118517', name: 'Vinyl Plank Flooring 20 sq ft Box', brand: 'Lifeproof', category: 'Hardware', orig: 64.98, price: 0.01, retailer: 'r-home-depot', status: 'verified', confirms: 5, dead: 0, receipt: true, featured: true, ageH: 42, lastH: 1, stores: [['s-hd-tor-2', 'u-demo-2', 42, '9 boxes in overstock'], ['s-hd-tor-1', 'u-demo-4', 26], ['s-hd-ott-1', 'u-demo-4', 1]] },
  { upc: '885000118883', name: 'Kids Craft Kit — Sticker Mosaic', brand: 'Crafter’s Square', category: 'Toys', orig: 1.25, price: 0.01, retailer: 'r-dollar-tree', status: 'dead', confirms: 1, dead: 4, receipt: false, ageH: 300, lastH: 250, stores: [['s-dt-hal-1', 'u-demo-7', 300]] },
  { upc: '885000119255', name: 'Smart Wi-Fi Plug 2-Pack', brand: 'Merkury', category: 'Electronics', orig: 29.97, price: 0.03, retailer: 'r-walmart', status: 'likely', confirms: 1, dead: 0, receipt: false, ageH: 36, lastH: 36, stores: [['s-wm-stj-1', 'u-demo-7', 36, 'Hidden clearance — scan to see $0.03']] },
];

export const ITEMS: ItemRec[] = SEEDS.map((s, i) => ({
  id: `i-${i + 1}`,
  upc: s.upc,
  sku: s.sku ?? null,
  retailerId: s.retailer,
  name: s.name,
  brand: s.brand,
  category: s.category,
  imageUrl: null,
  originalPrice: s.orig,
}));

export const DEALS: DealRec[] = SEEDS.map((s, i) => ({
  id: `d-${i + 1}`,
  itemId: `i-${i + 1}`,
  status: s.status,
  bestPrice: s.price,
  firstReportedAt: hoursAgo(s.ageH),
  lastConfirmedAt: hoursAgo(s.lastH),
  confirmCount: s.confirms,
  deadVotes: s.dead,
  hasReceipt: s.receipt,
  featured: s.featured ?? false,
  isSample: true,
  createdBy: s.stores[0][1],
}));

export const REPORTS: ReportRec[] = SEEDS.flatMap((s, i) =>
  s.stores.map(([storeId, userId, h, note], j) => ({
    id: `rep-${i + 1}-${j + 1}`,
    dealId: `d-${i + 1}`,
    userId,
    storeId,
    scannedPrice: s.price,
    quantitySeen: j === 0 ? 3 : 1,
    foundAt: hoursAgo(h),
    locationNote: note ?? null,
    notes: null,
    hasReceipt: j === 0 ? s.receipt : false,
    moderationStatus: 'approved' as const,
  }))
);
