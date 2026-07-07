import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  uuid,
  varchar,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  doublePrecision,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'moderator', 'admin']);
export const trustLevel = pgEnum('trust_level', ['new', 'trusted', 'banned']);
export const dealStatus = pgEnum('deal_status', ['verified', 'likely', 'unconfirmed', 'dead']);
export const moderationStatus = pgEnum('moderation_status', ['pending', 'approved', 'rejected']);
export const photoKind = pgEnum('photo_kind', ['product', 'tag', 'receipt']);
export const voteKind = pgEnum('vote_kind', ['confirm', 'dead']);
export const alertFrequency = pgEnum('alert_frequency', ['instant', 'daily']);
export const alertSensitivity = pgEnum('alert_sensitivity', ['penny', 'amazing', 'great', 'all']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 40 }).notNull().unique(),
    avatarUrl: text('avatar_url'),
    homeProvince: varchar('home_province', { length: 2 }),
    trustLevel: trustLevel('trust_level').notNull().default('new'),
    role: userRole('role').notNull().default('user'),
    approvedReports: integer('approved_reports').notNull().default(0),
    retailValueFound: numeric('retail_value_found', { precision: 12, scale: 2 }).notNull().default('0'),
    emailDigest: boolean('email_digest').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ usernameIdx: index('users_username_idx').on(t.username) })
);

export const retailers = pgTable('retailers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  logoUrl: text('logo_url'),
  brandColor: varchar('brand_color', { length: 9 }).notNull().default('#B87333'),
  pennyNotesMd: text('penny_notes_md'),
  cadenceNotesMd: text('cadence_notes_md'),
  /** Array of { signal, meaning, example_image, confidence } for the tag decoder */
  decoderJson: jsonb('decoder_json'),
  supportsUpcLookup: boolean('supports_upc_lookup').notNull().default(true),
  supportsSkuLookup: boolean('supports_sku_lookup').notNull().default(false),
  phase: integer('phase').notNull().default(1),
  active: boolean('active').notNull().default(true),
});

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    retailerId: uuid('retailer_id').notNull().references(() => retailers.id),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    address: text('address').notNull(),
    city: varchar('city', { length: 80 }).notNull(),
    province: varchar('province', { length: 2 }).notNull(),
    postalCode: varchar('postal_code', { length: 7 }),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    friendlinessAvg: numeric('friendliness_avg', { precision: 3, scale: 2 }),
    friendlinessCount: integer('friendliness_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex('stores_retailer_slug_idx').on(t.retailerId, t.province, t.slug),
    geoIdx: index('stores_lat_lng_idx').on(t.lat, t.lng),
    cityIdx: index('stores_city_idx').on(t.province, t.city),
  })
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    upc: varchar('upc', { length: 14 }).notNull(),
    sku: varchar('sku', { length: 20 }),
    retailerId: uuid('retailer_id').notNull().references(() => retailers.id),
    name: varchar('name', { length: 200 }).notNull(),
    brand: varchar('brand', { length: 80 }),
    category: varchar('category', { length: 40 }).notNull().default('Other'),
    imageUrl: text('image_url'),
    originalPrice: numeric('original_price', { precision: 10, scale: 2 }),
  },
  (t) => ({ upcIdx: uniqueIndex('items_upc_retailer_idx').on(t.upc, t.retailerId) })
);

export const deals = pgTable(
  'deals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull().references(() => items.id),
    status: dealStatus('status').notNull().default('unconfirmed'),
    bestPrice: numeric('best_price', { precision: 10, scale: 2 }).notNull(),
    firstReportedAt: timestamp('first_reported_at', { withTimezone: true }).notNull().defaultNow(),
    lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }).notNull().defaultNow(),
    confirmCount: integer('confirm_count').notNull().default(0),
    deadVotes: integer('dead_votes').notNull().default(0),
    hasReceipt: boolean('has_receipt').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    isSample: boolean('is_sample').notNull().default(false),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (t) => ({
    statusIdx: index('deals_status_idx').on(t.status),
    recentIdx: index('deals_first_reported_idx').on(t.firstReportedAt),
  })
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    storeId: uuid('store_id').notNull().references(() => stores.id),
    scannedPrice: numeric('scanned_price', { precision: 10, scale: 2 }).notNull(),
    quantitySeen: integer('quantity_seen'),
    foundAt: timestamp('found_at', { withTimezone: true }).notNull(),
    locationNote: varchar('location_note', { length: 200 }),
    notes: text('notes'),
    hasReceipt: boolean('has_receipt').notNull().default(false),
    moderationStatus: moderationStatus('moderation_status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dealIdx: index('reports_deal_idx').on(t.dealId),
    modIdx: index('reports_moderation_idx').on(t.moderationStatus),
    storeIdx: index('reports_store_idx').on(t.storeId),
  })
);

export const reportPhotos = pgTable('report_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  kind: photoKind('kind').notNull(),
  altText: varchar('alt_text', { length: 200 }),
});

export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull().references(() => items.id),
    storeId: uuid('store_id').references(() => stores.id),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
  },
  (t) => ({ itemIdx: index('price_history_item_idx').on(t.itemId, t.observedAt) })
);

export const votes = pgTable(
  'votes',
  {
    userId: uuid('user_id').notNull().references(() => users.id),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    kind: voteKind('kind').notNull(),
    storeId: uuid('store_id').references(() => stores.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.dealId, t.kind] }) })
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dealId: uuid('deal_id').notNull().references(() => deals.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    body: text('body').notNull(),
    flagged: boolean('flagged').notNull().default(false),
    hidden: boolean('hidden').notNull().default(false),
    flagCount: integer('flag_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ dealIdx: index('comments_deal_idx').on(t.dealId) })
);

export const watchlist = pgTable(
  'watchlist',
  {
    userId: uuid('user_id').notNull().references(() => users.id),
    itemId: uuid('item_id').notNull().references(() => items.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.itemId] }) })
);

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    postalCode: varchar('postal_code', { length: 7 }).notNull(),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    radiusKm: integer('radius_km').notNull().default(25),
    retailerIds: jsonb('retailer_ids').$type<string[]>(),
    sensitivity: alertSensitivity('sensitivity').notNull().default('penny'),
    frequency: alertFrequency('frequency').notNull().default('daily'),
    active: boolean('active').notNull().default(true),
    lastMatchedAt: timestamp('last_matched_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index('alerts_user_idx').on(t.userId) })
);

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  description: varchar('description', { length: 300 }),
  bodyMd: text('body_md').notNull(),
  heroUrl: text('hero_url'),
  authorId: uuid('author_id').references(() => users.id),
  faqJson: jsonb('faq_json').$type<{ q: string; a: string }[]>(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 16 }).notNull(),
  criteria: varchar('criteria', { length: 240 }).notNull(),
});

export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id').notNull().references(() => users.id),
    badgeId: uuid('badge_id').notNull().references(() => badges.id),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.badgeId] }) })
);

export const subscriptions = pgTable('subscriptions', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 60 }),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  status: varchar('status', { length: 30 }).notNull().default('inactive'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
});

export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 160 }).notNull(),
  body: text('body').notNull(),
  photoUrl: text('photo_url'),
  receiptUrl: text('receipt_url'),
  retailValue: numeric('retail_value', { precision: 10, scale: 2 }),
  paidTotal: numeric('paid_total', { precision: 10, scale: 2 }),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fsaCentroids = pgTable('fsa_centroids', {
  fsa: varchar('fsa', { length: 3 }).primaryKey(),
  province: varchar('province', { length: 2 }).notNull(),
  place: varchar('place', { length: 80 }),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
});

export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  toEmail: varchar('to_email', { length: 255 }).notNull(),
  template: varchar('template', { length: 60 }).notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moderationLog = pgTable('moderation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  moderatorId: uuid('moderator_id').references(() => users.id),
  action: varchar('action', { length: 60 }).notNull(),
  targetType: varchar('target_type', { length: 40 }).notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 60 }).notNull(),
  resource: varchar('resource', { length: 60 }).notNull(),
  resourceId: uuid('resource_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const emailSubscribers = pgTable('email_subscribers', {
  email: varchar('email', { length: 255 }).primaryKey(),
  province: varchar('province', { length: 2 }),
  confirmed: boolean('confirmed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
