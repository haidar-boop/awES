import type { DealStatus } from './core/confidence';

export interface DecoderSignal {
  signal: string;
  meaning: string;
  example_image: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface RetailerRec {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  pennyNotesMd: string;
  cadenceNotesMd: string;
  decoder: DecoderSignal[];
  supportsUpcLookup: boolean;
  supportsSkuLookup: boolean;
  phase: 1 | 2;
  active: boolean;
}

export interface StoreRec {
  id: string;
  retailerId: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  friendlinessAvg: number | null;
  friendlinessCount: number;
}

export interface ItemRec {
  id: string;
  upc: string;
  sku: string | null;
  retailerId: string;
  name: string;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  originalPrice: number | null;
}

export interface DealRec {
  id: string;
  itemId: string;
  status: DealStatus;
  bestPrice: number;
  firstReportedAt: string; // ISO
  lastConfirmedAt: string;
  confirmCount: number;
  deadVotes: number;
  hasReceipt: boolean;
  featured: boolean;
  isSample: boolean;
  createdBy: string | null;
}

export interface ReportRec {
  id: string;
  dealId: string;
  userId: string;
  storeId: string;
  scannedPrice: number;
  quantitySeen: number | null;
  foundAt: string;
  locationNote: string | null;
  notes: string | null;
  hasReceipt: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface UserRec {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  homeProvince: string | null;
  trustLevel: 'new' | 'trusted' | 'banned';
  role: 'user' | 'moderator' | 'admin';
  approvedReports: number;
  retailValueFound: number;
  createdAt: string;
}

export interface BadgeRec {
  slug: string;
  name: string;
  icon: string;
  criteria: string;
}

export interface StoryRec {
  id: string;
  userId: string;
  title: string;
  body: string;
  photoUrl: string | null;
  retailValue: number;
  paidTotal: number;
  approved: boolean;
  createdAt: string;
}

/** A deal joined with everything the UI needs. */
export interface DealView {
  deal: DealRec;
  item: ItemRec;
  retailer: RetailerRec;
  reports: (ReportRec & { store: StoreRec })[];
  /** e.g. { ON: 4, AB: 2 } */
  provinceCounts: Record<string, number>;
  commentCount: number;
}
