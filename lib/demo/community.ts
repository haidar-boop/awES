import type { UserRec, BadgeRec, StoryRec } from '../types';

export const BADGES: BadgeRec[] = [
  { slug: 'first-find', name: 'First Find', icon: '🪙', criteria: 'First approved report' },
  { slug: 'verified-hunter', name: 'Verified Hunter', icon: '🧾', criteria: '5 receipt-verified reports' },
  { slug: 'wave-rider', name: 'Wave Rider', icon: '🌊', criteria: '3 finds in 24 hours' },
  { slug: 'province-scout', name: 'Province Scout', icon: '🗺️', criteria: 'Finds in 3+ provinces' },
  { slug: 'centurion', name: 'Centurion', icon: '💰', criteria: '$10,000 retail value found' },
  { slug: 'good-neighbour', name: 'Good Neighbour', icon: '🤝', criteria: '25 confirmations on other hunters’ finds' },
];

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const USERS: UserRec[] = [
  { id: 'u-demo-1', username: 'yyc_pennyqueen', email: 'demo1@example.com', avatarUrl: null, homeProvince: 'AB', trustLevel: 'trusted', role: 'user', approvedReports: 47, retailValueFound: 12480.5, createdAt: daysAgo(400) },
  { id: 'u-demo-2', username: 'gta_flips', email: 'demo2@example.com', avatarUrl: null, homeProvince: 'ON', trustLevel: 'trusted', role: 'user', approvedReports: 39, retailValueFound: 9312.75, createdAt: daysAgo(310) },
  { id: 'u-demo-3', username: 'vanisle_hunter', email: 'demo3@example.com', avatarUrl: null, homeProvince: 'BC', trustLevel: 'trusted', role: 'user', approvedReports: 28, retailValueFound: 6120.0, createdAt: daysAgo(250) },
  { id: 'u-demo-4', username: 'ottawa_deals', email: 'demo4@example.com', avatarUrl: null, homeProvince: 'ON', trustLevel: 'trusted', role: 'moderator', approvedReports: 22, retailValueFound: 4818.25, createdAt: daysAgo(370) },
  { id: 'u-demo-5', username: 'prairie_penny', email: 'demo5@example.com', avatarUrl: null, homeProvince: 'MB', trustLevel: 'trusted', role: 'user', approvedReports: 15, retailValueFound: 2204.0, createdAt: daysAgo(150) },
  { id: 'u-demo-6', username: 'darthclearance', email: 'demo6@example.com', avatarUrl: null, homeProvince: 'AB', trustLevel: 'new', role: 'user', approvedReports: 3, retailValueFound: 388.0, createdAt: daysAgo(20) },
  { id: 'u-demo-7', username: 'halifax_haul', email: 'demo7@example.com', avatarUrl: null, homeProvince: 'NS', trustLevel: 'new', role: 'user', approvedReports: 2, retailValueFound: 96.5, createdAt: daysAgo(12) },
  { id: 'u-demo-8', username: 'mtl_aubaines', email: 'demo8@example.com', avatarUrl: null, homeProvince: 'QC', trustLevel: 'trusted', role: 'user', approvedReports: 18, retailValueFound: 3402.0, createdAt: daysAgo(200) },
];

export const USER_BADGES: Record<string, string[]> = {
  'u-demo-1': ['first-find', 'verified-hunter', 'wave-rider', 'province-scout', 'centurion'],
  'u-demo-2': ['first-find', 'verified-hunter', 'wave-rider'],
  'u-demo-3': ['first-find', 'verified-hunter'],
  'u-demo-4': ['first-find', 'good-neighbour'],
  'u-demo-5': ['first-find'],
  'u-demo-6': ['first-find'],
  'u-demo-7': ['first-find'],
  'u-demo-8': ['first-find', 'verified-hunter'],
};

export const STORIES: StoryRec[] = [
  {
    id: 'st-1',
    userId: 'u-demo-1',
    title: 'The $1,200 patio set that rang up at 4 cents',
    body: 'Four boxes of a discontinued patio conversation set sitting in top stock at Sunridge. Tag said $299 each — every box scanned $0.01. Cashier called the manager, manager shrugged and said "system says a penny, it’s a penny." Paid 4 cents on my card (cash would have rounded to zero!). Two sets furnished my deck, two sold on Marketplace for $700.',
    photoUrl: null,
    retailValue: 1196.0,
    paidTotal: 0.04,
    approved: true,
    createdAt: daysAgo(45),
  },
  {
    id: 'st-2',
    userId: 'u-demo-2',
    title: 'Hidden clearance wave: 14 LED fixtures at 97% off',
    body: 'Walmart Dufferin Mall had a full shelf of track-lighting kits tagged $68. The app showed $1.97. Bought all 14, kept two, flipped the rest at $30 each on Kijiji within a week. Always scan the aisle after a seasonal reset.',
    photoUrl: null,
    retailValue: 952.0,
    paidTotal: 27.58,
    approved: true,
    createdAt: daysAgo(28),
  },
  {
    id: 'st-3',
    userId: 'u-demo-3',
    title: 'My first penny: a $89 faucet',
    body: 'Followed the .03-ending tip from the decoder, waited two weeks, went back — and the tag was gone but one unit was hiding on the back rack. Scanned $0.01 at self-checkout. Shaking-hands-emoji moment with the greeter on the way out.',
    photoUrl: null,
    retailValue: 89.0,
    paidTotal: 0.01,
    approved: true,
    createdAt: daysAgo(14),
  },
];
