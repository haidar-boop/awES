export interface GlossaryTerm {
  slug: string;
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: 'penny-item',
    term: 'Penny item',
    definition:
      'A product whose price in a retailer’s internal system has dropped to $0.01 as a signal that staff should pull it from the floor. Items missed by the pull scan — and sell — for one cent.',
  },
  {
    slug: 'penny-sku',
    term: 'Penny SKU',
    definition:
      'The specific SKU (stock-keeping unit) that has reached $0.01 in the system. Because markdowns are processed chain-wide, one confirmed penny SKU is often pennied at many stores at once.',
  },
  {
    slug: 'pennied-out',
    term: 'Pennied out',
    definition:
      'What a SKU does at the end of its markdown cycle: “that shop-light pennied out last Thursday.” Once pennied out, remaining stock is flagged for removal.',
  },
  {
    slug: 'hidden-clearance',
    term: 'Hidden clearance',
    definition:
      'A markdown that exists in the retailer’s system while the shelf tag still shows a higher (often full) price. Revealed only by scanning the item’s UPC. Walmart Canada is the classic source.',
  },
  {
    slug: 'markdown-cadence',
    term: 'Markdown cadence',
    definition:
      'The schedule a retailer’s clearance system follows when stepping prices down (e.g., 25% → 50% → 75% → penny), including the timing between steps. Learning a retailer’s cadence lets you predict when late-stage clearance will penny.',
  },
  {
    slug: 'upc-vs-sku',
    term: 'UPC vs SKU',
    definition:
      'The UPC is the universal barcode printed on the product (12–13 digits, same everywhere it’s sold). The SKU is the retailer’s internal inventory code for that product. Registers price by the system record behind the UPC; hunters share UPCs because they work at any store.',
  },
  {
    slug: 'endcap',
    term: 'Endcap',
    definition:
      'The display shelf at the end of an aisle. Clearance endcaps are where markdown stock is consolidated — and the first place staff sweep for pennied items, which is why misplaced stock elsewhere survives longer.',
  },
  {
    slug: 'top-stock',
    term: 'Top stock',
    definition:
      'The high steel shelving above the sales floor where overstock is stored. The #1 hiding place for missed penny items, since pull sweeps focus on shelf level.',
  },
  {
    slug: 'ymmv',
    term: 'YMMV',
    definition:
      '“Your mileage may vary.” Deal-community shorthand for store-specific results: a price confirmed at one location may not exist at another, especially at retailers with per-store pricing.',
  },
  {
    slug: 'death-star',
    term: 'Death star',
    definition:
      'The asterisk (*) on a Costco price sign, indicating the item is discontinued at that warehouse and won’t be restocked. Combined with a .97 price ending, it marks Costco’s deepest last-chance markdowns.',
  },
  {
    slug: 'price-ending',
    term: 'Price ending',
    definition:
      'The cents portion of a price, used by retailers as internal code. Examples: Home Depot .02/.03/.04 = late-stage clearance; Costco .97 = manager markdown; Walmart .94 = clearance in progress.',
  },
  {
    slug: 'fsa',
    term: 'FSA',
    definition:
      'Forward Sortation Area — the first three characters of a Canadian postal code (e.g., T2P), identifying a geographic area. PennyRadar accepts a bare FSA anywhere a postal code is asked for.',
  },
  {
    slug: 'cash-rounding',
    term: 'Cash rounding',
    definition:
      'Since Canada withdrew the penny in 2013, cash totals round to the nearest 5¢ (1–2¢ down, 3–4¢ up). A single $0.01 item rounds to $0.00 in cash; card payments charge the exact amount.',
  },
  {
    slug: 'retail-arbitrage',
    term: 'Retail arbitrage',
    definition:
      'Buying discounted retail goods (clearance, pennies, hidden clearance) to resell at market price on platforms like Facebook Marketplace, Kijiji, or eBay.ca. The reseller’s wing of the penny-hunting community.',
  },
  {
    slug: 'bolo',
    term: 'BOLO',
    definition:
      '“Be on the lookout.” A community heads-up about an item worth scanning — often a SKU showing late-stage clearance signals that hasn’t pennied yet, or a fresh penny wave spreading between stores.',
  },
];

export const glossaryBySlug = new Map(GLOSSARY.map((g) => [g.slug, g]));
