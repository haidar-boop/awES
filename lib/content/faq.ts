export interface FaqEntry {
  q: string;
  a: string;
}

export const FAQ: FaqEntry[] = [
  {
    q: 'What is PennyRadar?',
    a: 'A community-powered live list of penny items ($0.01–$0.10 register prices) and hidden clearance at Canadian retailers, plus the education and tools to verify finds yourself: UPC lookup, scannable barcodes, tag decoding, and area alerts.',
  },
  {
    q: 'Is the penny list really free?',
    a: 'Yes — the full live list, UPC lookup, tag decoder, community features, and one area alert are free forever. Pro ($7/month or $49/year) adds unlimited alerts, instant notifications, a 15-minute early-access window on newly verified deals, price-history charts, and CSV export.',
  },
  {
    q: 'Where do the deals come from?',
    a: 'From hunters like you. Every deal starts as a community report with store, price, and date. Other hunters confirm or refute it, and our confidence system (Verified / Likely Active / Unconfirmed / Dead) scores the result.',
  },
  {
    q: 'What does “Verified” mean on a deal?',
    a: 'At least two independent hunters confirmed the same item within 72 hours, or a report included a receipt photo. It is the strongest signal we have — but stock and store decisions still vary (YMMV).',
  },
  {
    q: 'Is penny shopping legal in Canada?',
    a: 'Yes. You pay the price the store’s own register charges. Stores can refuse to sell a pennied item — it is flagged for removal — and our etiquette rules say to accept that politely. See our full legality guide.',
  },
  {
    q: 'Can a store refuse to sell me a penny item?',
    a: 'Yes, and some will. A scanned price is an invitation to treat, not a completed contract. If staff decline, thank them and move on — there will be more pennies.',
  },
  {
    q: 'How do I pay $0.01 if Canada doesn’t have pennies?',
    a: 'Card and debit charge the exact cent. Cash totals round to the nearest 5¢ under federal rounding guidelines, so a single penny item paid in cash rounds to $0.00.',
  },
  {
    q: 'Why don’t you just publish retailers’ internal penny lists?',
    a: 'We only publish community-observed register prices. Employee-only internal data (markdown reports, pull lists, internal apps) is prohibited content here — submitting it gets an account banned.',
  },
  {
    q: 'Do you tell me exact stock counts?',
    a: 'Reports can include “quantity seen,” which is a hunter’s eyeball count at one moment. Treat it as a hint, not inventory truth — penny stock disappears fast.',
  },
  {
    q: 'What is hidden clearance?',
    a: 'A markdown that exists in the store’s pricing system while the shelf tag still shows a higher price. The only way to see the real price is to scan the item’s UPC — our deal pages include a scannable barcode for exactly that.',
  },
  {
    q: 'How accurate is the “near me” search?',
    a: 'We geocode stores and use your browser location or postal code/FSA centroid, computing distances in kilometres. Postal-code searches accept a full code (T2P 1J9) or just the FSA (T2P).',
  },
  {
    q: 'Do ads or affiliate links affect deal rankings?',
    a: 'Never. Ranking is determined solely by recency, confirmations, and confidence status. Ad slots and affiliate links are clearly separated from the list and have zero input into ordering. This is a founding rule of the site.',
  },
  {
    q: 'What earns a ban?',
    a: 'Fabricated reports, tag-swapping or any checkout deception, posting employee-only internal data, encouraging theft, or harassment. Moderators log every action and bans are permanent for fraud-related offences.',
  },
  {
    q: 'How do I become a “trusted” reporter?',
    a: 'Get five reports approved. Trusted hunters skip the moderation queue and publish instantly, and their reports carry more weight in confidence scoring. Receipt photos speed up both approval and verification.',
  },
  {
    q: 'Is PennyRadar affiliated with Home Depot, Walmart, or any retailer?',
    a: 'No. PennyRadar is independent and community-run. Prices are community-reported and not guaranteed; retailer names and logos are used only to identify where finds were reported.',
  },
];
