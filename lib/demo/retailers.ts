import type { RetailerRec } from '../types';

/**
 * Phase-1 retailers ship with full decoder + guide content.
 * Phase-2 retailers ship as inactive records so admins can flip them on.
 */
export const RETAILERS: RetailerRec[] = [
  {
    id: 'r-home-depot',
    name: 'Home Depot Canada',
    slug: 'home-depot-canada',
    logoUrl: null,
    brandColor: '#F96302',
    phase: 1,
    active: true,
    supportsUpcLookup: true,
    supportsSkuLookup: true,
    pennyNotesMd: `Home Depot Canada is the flagship penny retailer. Clearance items ride a continuous markdown ladder; when an item still hasn't sold at the end of the cycle, the system drops the SKU to **$0.01** as an internal signal for staff to pull and dispose of it. Items missed by staff remain on shelves, in top stock, or on back racks — and they scan for a penny.

Key things to know:

- **Scan the item's UPC, not the shelf tag.** The yellow tag often shows a stale price; the register price lives on the product barcode.
- Pennied items are flagged for removal. Staff may refuse the sale — that's their right. Be polite, accept it, move on.
- Self-checkout is the least disruptive way to verify a price.`,
    cadenceNotesMd: `Markdowns typically step **25% → 50% → 75% → penny**. The commonly cited pattern in the community: price endings **.02/.03/.04** appear in the last stage, and those endings tend to drop to $0.01 roughly **14 weeks after the clearance date printed on the tag** — but this varies by store and by category, with some cycles stretching 6–8 months. Treat the 14-week rule as a scouting heuristic, not a guarantee.`,
    decoder: [
      {
        signal: 'Yellow clearance tag',
        meaning: 'Item has entered the markdown cycle. The date printed on the tag is the clearance start date — the clock the markdown cadence runs on.',
        example_image: null,
        confidence: 'high',
      },
      {
        signal: 'Price ending in .06',
        meaning: 'Early-stage clearance ending used in many stores. Item is discounted but has markdowns left to go.',
        example_image: null,
        confidence: 'medium',
      },
      {
        signal: 'Price ending in .02 / .03 / .04',
        meaning: 'Late-stage markdown signal. Community pattern: these endings drop to $0.01 roughly 14 weeks after the tag’s clearance date (varies by store; sometimes 6–8 months).',
        example_image: null,
        confidence: 'medium',
      },
      {
        signal: 'Item scans $0.01',
        meaning: 'The SKU has pennied out — the system is telling staff to pull it. If it’s still on the shelf, it slipped through.',
        example_image: null,
        confidence: 'high',
      },
      {
        signal: 'Clearance endcaps mid-store, top stock, back racks',
        meaning: 'Where missed penny items hide. Staff sweep the clearance aisle first; overstock in top stock and returns racks get missed.',
        example_image: null,
        confidence: 'high',
      },
    ],
  },
  {
    id: 'r-walmart',
    name: 'Walmart Canada',
    slug: 'walmart-canada',
    logoUrl: null,
    brandColor: '#0071CE',
    phase: 1,
    active: true,
    supportsUpcLookup: true,
    supportsSkuLookup: false,
    pennyNotesMd: `Walmart Canada is the home of **hidden clearance**: the shelf tag shows full price while the system price is 50–97% lower. The only way to see the real price is to scan the item's UPC with the Walmart app or a price checker. True penny items are rare at Walmart Canada, but **$0.02 and $0.03 items** show up regularly, especially in Alberta and Ontario.`,
    cadenceNotesMd: `Hidden clearance appears when a markdown is processed in the system before (or without) shelf tags being updated. Seasonal resets — post-Christmas, post-Halloween, garden-season end — are the biggest waves. Endings like **.02/.03** on a scanned price usually mean final clearance.`,
    decoder: [
      {
        signal: 'Shelf shows full price, app scan shows lower',
        meaning: 'Hidden clearance. The system price is the register price. Scan with the Walmart app scanner to reveal it.',
        example_image: null,
        confidence: 'high',
      },
      {
        signal: 'Scanned price ending in .02 / .03',
        meaning: 'Final-stage clearance at Walmart Canada. These are the "2-cent items" the community hunts.',
        example_image: null,
        confidence: 'medium',
      },
      {
        signal: 'Scanned price ending in .97 / .94',
        meaning: 'Standard rollback/clearance endings. .94 often indicates clearance; .97 a rollback. More markdowns may follow.',
        example_image: null,
        confidence: 'medium',
      },
      {
        signal: 'Seasonal aisle after a reset',
        meaning: 'Post-season merchandise is the most common source of hidden clearance waves.',
        example_image: null,
        confidence: 'high',
      },
    ],
  },
  {
    id: 'r-dollar-tree',
    name: 'Dollar Tree Canada',
    slug: 'dollar-tree-canada',
    logoUrl: null,
    brandColor: '#47A23F',
    phase: 1,
    active: true,
    supportsUpcLookup: true,
    supportsSkuLookup: false,
    pennyNotesMd: `Dollar Tree Canada runs **markdown days**: on scheduled dates, discontinued and seasonal SKUs drop to $0.01 in the system as a pull signal. Items that staff miss remain on shelves and scan for a penny. The community tracks which product categories penny out after each markdown event — seasonal goods are the most common.`,
    cadenceNotesMd: `Markdown events are periodic (often tied to season changeovers). Unlike Home Depot there is no visible tag ladder — items go straight from full price to penny in the system, which makes UPC scanning the only reliable check.`,
    decoder: [
      {
        signal: 'Seasonal item lingering after the season',
        meaning: 'Prime penny candidate. If it was supposed to be pulled on markdown day and wasn’t, it may scan $0.01.',
        example_image: null,
        confidence: 'medium',
      },
      {
        signal: 'Item scans $0.01 at register',
        meaning: 'The SKU was pennied on a markdown day and missed during the pull. Stores may refuse the sale.',
        example_image: null,
        confidence: 'high',
      },
      {
        signal: 'Discontinued packaging / old branding',
        meaning: 'Old stock is the most likely to have been discontinued in the system and pennied.',
        example_image: null,
        confidence: 'low',
      },
    ],
  },
  // ── Phase 2 (inactive at launch; enable from /admin/retailers) ──
  {
    id: 'r-canadian-tire',
    name: 'Canadian Tire',
    slug: 'canadian-tire',
    logoUrl: null,
    brandColor: '#D31145',
    phase: 2,
    active: false,
    supportsUpcLookup: true,
    supportsSkuLookup: false,
    pennyNotesMd: `Canadian Tire uses red-tag clearance with store-level pricing — the same SKU can be deeply discounted at one store and full price at the next.`,
    cadenceNotesMd: `Red-tag clearance percentages step down over weeks. True penny-outs are rare; sub-$1 clearance is the realistic target.`,
    decoder: [
      {
        signal: 'Red clearance tag',
        meaning: 'Store-level clearance. Price and depth of discount vary per store.',
        example_image: null,
        confidence: 'high',
      },
    ],
  },
  {
    id: 'r-costco',
    name: 'Costco Canada',
    slug: 'costco-canada',
    logoUrl: null,
    brandColor: '#005DAA',
    phase: 2,
    active: false,
    supportsUpcLookup: false,
    supportsSkuLookup: false,
    pennyNotesMd: `Costco doesn't penny out, but its price codes are legendary: **.97 endings** are manager markdowns, and an **asterisk (the "death star")** on the sign means the item is discontinued and won't be restocked.`,
    cadenceNotesMd: `.97 markdowns appear when a warehouse manager clears local stock. Death-star items with a .97 price are the deepest, last-chance deals.`,
    decoder: [
      { signal: 'Price ending .97', meaning: 'Manager markdown — cleared at that warehouse.', example_image: null, confidence: 'high' },
      { signal: 'Asterisk on the sign ("death star")', meaning: 'Discontinued; will not be restocked.', example_image: null, confidence: 'high' },
      { signal: 'Price ending .00 / .88', meaning: 'Often a manager special even deeper than .97.', example_image: null, confidence: 'medium' },
    ],
  },
  {
    id: 'r-rona',
    name: 'RONA',
    slug: 'rona',
    logoUrl: null,
    brandColor: '#00549A',
    phase: 2,
    active: false,
    supportsUpcLookup: true,
    supportsSkuLookup: false,
    pennyNotesMd: `RONA (including converted Lowe's Canada banners) runs store-level clearance pricing with periodic deep-discount events.`,
    cadenceNotesMd: `Clearance depth varies by banner conversion status; converted stores clear old-banner stock aggressively.`,
    decoder: [
      { signal: 'Yellow "Liquidation" tag', meaning: 'Clearance item; check the scan price, shelf tags lag.', example_image: null, confidence: 'medium' },
    ],
  },
  {
    id: 'r-giant-tiger',
    name: 'Giant Tiger',
    slug: 'giant-tiger',
    logoUrl: null,
    brandColor: '#FFD200',
    phase: 2,
    active: false,
    supportsUpcLookup: true,
    supportsSkuLookup: false,
    pennyNotesMd: `Giant Tiger clearance is aisle-based with frequent unadvertised markdowns.`,
    cadenceNotesMd: `Weekly markdown sweeps; seasonal clearance goes deepest.`,
    decoder: [],
  },
];

export const retailerById = new Map(RETAILERS.map((r) => [r.id, r]));
export const retailerBySlug = new Map(RETAILERS.map((r) => [r.slug, r]));
