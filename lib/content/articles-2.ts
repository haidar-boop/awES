import type { Article } from './articles';

export const ARTICLES_2: Article[] = [
  {
    slug: 'is-penny-shopping-legal-canada',
    title: 'Is Penny Shopping Legal in Canada?',
    description:
      'Yes — buying an item at the price the store’s own register charges is legal. What the law actually says about scanned prices, refusals, and where the real lines are.',
    updated: '2026-06-08',
    minutes: 6,
    faq: [
      { q: 'Is it legal to buy a penny item?', a: 'Yes. You are paying the price the retailer’s own system charges at their own register. There is nothing deceptive about scanning an item and paying what the till asks.' },
      { q: 'Can the store make me give it back after I paid?', a: 'Once a sale is complete — payment accepted, receipt issued — the item is generally yours. A store asking politely for a return may offer a refund, but completed sales are not "reversible" just because a manager regrets the price.' },
      { q: 'What IS illegal?', a: 'Tag swapping, applying fake barcodes, misrepresenting an item at checkout, or deceiving staff about what something is. That’s fraud under the Criminal Code, and it’s also an instant ban here.' },
    ],
    body: `
*This article is general information, not legal advice. If you have a real dispute, consult a professional.*

The short answer: **yes, penny shopping is legal in Canada.** You select an item, the store's own register states a price, you pay it. There is no law against a retailer selling something cheaply, and no law against you accepting.

## The legal shape of a retail sale

In Canadian contract law, a shelf price — or a scanned price — is an **invitation to treat**, not a binding offer. The customer makes the offer by presenting the item at checkout; the store accepts by taking payment. Two clean consequences:

1. **Before payment**: the store can decline to sell. A manager who says "this item was flagged for removal, I can't sell it" is exercising a legal right. Frustrating, but legitimate — see our [etiquette guide](/guides/penny-shopping-etiquette).
2. **After payment**: the contract is complete. The store can't force you to undo a finished sale because someone regrets the system price (they can *ask*, and you can decline politely).

## What the register charges is the price

There's a persistent myth that paying a "wrong" price is somehow theft. It isn't. The price in the system **is** the store's price — set by the store, charged by the store's own equipment, received by the store's own staff. A pennied SKU is priced at $0.01 *on purpose*, as an internal signal. The store's remedy for missed pulls is operational (sweep the shelves), not legal (blame the customer).

Canada also has a consumer-protection layer pointing the other way: the [Scanner Price Accuracy Code](/guides/scanner-price-accuracy-code), followed voluntarily by most large retailers, compensates you when items scan *higher* than the displayed price. The system price cuts both ways, and the industry itself says the scan governs.

## Where the actual legal lines are

Everything above assumes you're honest. These things are **not** penny shopping:

- **Tag swapping or barcode stickers** — presenting an item under a different SKU is fraud (Criminal Code s. 380) and/or theft.
- **Deceiving staff** — lying about what an item is or what it scanned.
- **Price-tag tampering of any kind** — even "as a joke."
- **Trespass** — if a store bans you and you return, that's its own problem.

None of that is a grey area, and none of it is welcome on this site: reports that involve deception are removed and the account banned.

## Practical bottom line

Scan honestly, pay what the register asks, accept a refusal if it comes, keep your receipt. That's a legal purchase in every province and territory. The rest is etiquette — which, in this hobby, matters just as much.
`,
  },
  {
    slug: 'scanner-price-accuracy-code',
    title: 'The Scanner Price Accuracy Code: Canada’s Free-Item Rule',
    description:
      'Most big Canadian retailers voluntarily follow the Scanner Price Accuracy Code: scan higher than the shelf price and the item is free up to $10 (or $10 off above that). How to invoke it politely.',
    updated: '2026-06-05',
    minutes: 7,
    faq: [
      { q: 'What does the Code give me?', a: 'If an item (without a price sticker on it) scans higher than the displayed shelf/advertised price: items $10 or less are free; items over $10 get $10 off the correct (lower) price. First item only; additional identical items ring at the corrected price.' },
      { q: 'Is it a law?', a: 'No — it’s a voluntary industry code administered by the Retail Council of Canada, but participating retailers (most major chains) commit to honouring it at the register.' },
      { q: 'Which stores participate?', a: 'Most large Canadian chains including major grocery, pharmacy, and general merchandise banners. Look for the Code decal at the entrance or ask; participation lists are maintained by the Retail Council of Canada.' },
      { q: 'Does it work in Quebec?', a: 'Quebec has its own legally binding price accuracy rules under the Consumer Protection Act with a similar $10 remedy — stronger than the voluntary code.' },
    ],
    body: `
Penny hunters obsess over items that scan *lower* than the tag. But Canada has an official mechanism for the opposite case — and every deal hunter should know it, because it turns pricing mistakes into free items.

## What the Code says

The **Scanner Price Accuracy Code** is a voluntary commitment, administered by the Retail Council of Canada, that most major Canadian retailers have adopted. The core promise, for items that don't have a price sticker directly on them:

> If the scanned price at checkout is **higher** than the shelf price or advertised price, the customer receives the item **free** if it's $10 or under — or **$10 off the correct price** if it's over $10.

The correction applies to the *first* item; if you're buying several of the same product, the rest ring up at the corrected (lower) price.

In **Quebec**, this isn't voluntary at all: the province's Consumer Protection Act imposes a similar price-accuracy remedy by law.

## Why this matters to penny hunters

You're already the person scanning everything and reading shelf labels carefully. That means you'll catch scanner errors constantly — regular-price items that ring up above the displayed tag. Each one is a free item (≤$10) or $10 off, *if you notice and speak up*. Over a year of active hunting, the Code quietly pays for a lot of gas.

It's also the perfect answer to anyone who claims scanned prices "don't count": the retail industry's own code says the register price governs the transaction — and compensates you when it's wrong in the store's favour.

## How to invoke it (politely)

1. **Watch prices as they scan.** Catching it live at the till is cleanest; customer service after the fact also works with a receipt.
2. **Say the magic words, gently:** "I think this scanned higher than the shelf price — could we check it against the Scanner Price Accuracy Code?" Naming the Code signals you know the drill without being combative.
3. **Be ready to show the shelf tag** (a quick photo saves everyone a walk).
4. **Know the boundaries:** it doesn't apply to items with a price sticker physically on them, and the store can correct obvious gross errors in an ad. Individual banners publish their exact terms.
5. **Take the win gracefully.** Staff process Code claims all the time; it's routine, not a confrontation.

## Where it does NOT apply

The Code is about items scanning **higher** than displayed. It has nothing to do with penny items — a penny scan is the system price working as designed, and no code obligates the store to sell (that's covered in [is penny shopping legal?](/guides/is-penny-shopping-legal-canada)). Keep the two ideas separate and you'll never have an awkward checkout conversation.
`,
  },
  {
    slug: 'how-to-pay-one-cent-canada',
    title: 'Canada Killed the Penny — So How Do You Pay $0.01?',
    description:
      'Canada withdrew the penny in 2013. Cash totals round to the nearest 5¢ — so a single $0.01 item is literally $0.00 in cash. Card charges the exact cent. Here’s the fun math.',
    updated: '2026-06-01',
    minutes: 5,
    faq: [
      { q: 'So a penny item is FREE with cash?', a: 'A single $0.01 item, with no other items and no tax owing, rounds to $0.00 under Canada’s cash-rounding guideline: totals ending in 1–2¢ round down. Most stores will just wave it through; some registers can’t process a $0.00 cash sale and staff may ask for a nickel or a card.' },
      { q: 'What does a card charge?', a: 'Electronic payments are exempt from rounding — debit or credit charges the exact total, so one penny item costs exactly $0.01.' },
      { q: 'What about tax?', a: 'Sales tax applies to the scanned price. 13% HST on $0.01 is $0.0013, which rounds to $0.00 — so in practice a penny item’s total is one cent (card) or zero (cash).' },
    ],
    body: `
On February 4, 2013, the Royal Canadian Mint distributed its last penny. The one-cent coin still exists as a *unit of account* — prices can end in any cent — but cash transactions round to the nearest nickel. Which creates the single funniest edge case in Canadian retail: **the penny item you can't physically pay for.**

## The rounding rules

The Government of Canada's rounding guideline, applied to the **final cash total** (after tax):

| Total ends in | Cash rounds to |
|---|---|
| 1¢ or 2¢ | down to 0¢ |
| 3¢ or 4¢ | up to 5¢ |
| 6¢ or 7¢ | down to 5¢ |
| 8¢ or 9¢ | up to 10¢ |

Card, debit, and gift-card payments are **not rounded** — electronic money still counts every cent.

## The $0.00 purchase

Run the math on a single penny item in Ontario: $0.01 + 13% HST ($0.0013 → $0.00) = **total $0.01**. Pay cash → rounds **down to $0.00**. You hand the cashier nothing, they hand you a receipt for a completed zero-dollar sale.

In practice this goes one of three ways: the register processes $0.00 and everyone laughs; the register refuses a zero-cash tender and you tap a card for one cent; or the cashier asks for a nickel and hands you back… nothing (four cents rounds to zero too — $0.05 tendered, $0.04 change becomes $0.05 change). Any way it lands, you paid at most a cent. Tap your card if you want the cleanest receipt for the [Receipt Wall](/wall).

## Stack strategy for multi-item hauls

Because rounding applies to the **total**, hunters buying several pennies can play with it:

- **2 penny items** = $0.02 cash → rounds to **$0.00**.
- **3 penny items** = $0.03 cash → rounds up to **$0.05**. (Split into two transactions of 1–2 items and cash pays zero. Or just tap — three cents is three cents.)
- **Mixed cart**: the pennies barely move the total; rounding rides on whatever the last digit is.

Is engineering your checkout into two transactions to save three cents worth it? Absolutely not, and absolutely yes — this hobby has never been about the money so much as the scoreboard.

## Why prices still end in .99 (and .01)

Retail systems never stopped pricing in cents because most payments are electronic — roughly three-quarters of Canadian transactions. The penny price lives on in the database even though the coin is gone, which is precisely why penny *items* still exist: the markdown system needs a one-cent flag, and the register happily charges it. The coin died; the price immortal. Full background on the flag itself: [what are penny items?](/guides/what-are-penny-items)
`,
  },
  {
    slug: 'reselling-penny-finds-canada',
    title: 'Reselling Penny Finds in Canada: FB Marketplace, Kijiji, and eBay.ca Basics',
    description:
      'Turning pennies into profit: which platforms fit which finds, pricing sold-comps honestly, safe local meetups, and the tax reality of reselling income in Canada.',
    updated: '2026-05-28',
    minutes: 9,
    faq: [
      { q: 'Is it legal to resell items I bought for a penny?', a: 'Yes. Once a sale is complete the items are yours to keep, gift, or resell. First-sale principles apply — you’re selling used/clearance goods you lawfully own.' },
      { q: 'Do I have to report reselling income?', a: 'Income from reselling can be taxable business income in Canada, even as a side hustle. Whether yours crosses from hobby to business depends on your facts — track everything and talk to a tax professional. This site doesn’t give tax advice.' },
      { q: 'Which platform is best?', a: 'Local + bulky + cheap = Facebook Marketplace or Kijiji (no shipping, cash). Small + brand-name + shippable = eBay.ca. High-value tools often do best locally where buyers can test them.' },
    ],
    body: `
A $199 tool-battery two-pack bought for a penny is a fun story. Selling it for $120 the same weekend is a business model. Retail arbitrage on clearance and penny finds is the engine behind half the serious hunters on this site — here's the honest version of how it works in Canada.

## Platform triage

**Facebook Marketplace** — the default for local flips. Free listings, huge Canadian reach, cash or e-transfer on pickup. Best for bulky or heavy finds (patio sets, flooring, storage) where shipping would eat the margin.

**Kijiji** — still strong in Ontario, Alberta and Quebec, especially for tools, hardware, and building materials. Buyers skew practical and haggle-prone; price with a small cushion.

**eBay.ca** — for brand-name, small, shippable items (smart-home gear, name-brand fixtures, collectible seasonal). Fees are real (~13%+ in most categories), but you reach the whole country and sold-listing comps make pricing trivial.

**Amazon.ca** — mostly skip it. Gated brands and condition rules make one-off clearance flips more trouble than they're worth; it's a volume game for a different kind of seller.

## Pricing that actually sells

Look up **sold** comps, not asking prices (eBay's sold-listings filter; Marketplace search sorted by recent). Penny finds have a 100% margin floor, so resist the urge to price at retail: **50–60% of current retail moves in days**; 80% sits for months. Your inventory cost is a cent — velocity beats margin every time.

Two honesty rules that keep your accounts healthy: disclose condition accurately (open-box is open-box), and never claim warranty coverage you can't pass on — clearance and discontinued goods often have none.

## Local-meetup safety, briefly

Public, daytime, busy: grocery-store parking lots and police-station "safe exchange zones" exist for this. E-transfer before or cash in person; no cheques, no "my courier will collect it." High-value tool sales attract scan-and-run scammers — meet where cameras are.

## The tax paragraph (read it anyway)

Canada doesn't have a "hobby exemption" magic number. If you're buying *in order to resell* — which is what arbitrage is — CRA can consider the profit **business income**, reportable on your return, potentially from dollar one. Occasional decluttering is different from systematic flipping; where your operation sits on that line is a facts-and-circumstances question. What every reseller should do regardless: **keep receipts** (your penny receipts are gold — cost basis of $0.01 is a beautiful thing), track sales per platform, and get an hour with an accountant once the numbers stop being funny. Platforms increasingly report seller data to CRA, so the paper trail exists whether you keep your side or not. *This is general information, not tax advice.*

## The workflow that scales

1. Hunt with [alerts](/alerts) on so waves come to you.
2. Photograph and list the same day — clearance value decays as more hunters find the same item.
3. Batch your meetups geographically.
4. Log costs (gas counts) and sales in a spreadsheet from flip #1.
5. Report your finds back to the [live list](/report) — the community that feeds you data eats first because people share.
`,
  },
  {
    slug: 'verify-before-you-drive',
    title: 'How to Verify a Penny Item Before Driving Across Town',
    description:
      'A 5-minute verification checklist that saves 45-minute drives: read the report’s freshness and confirmations, check price history, call nothing, and scan on arrival.',
    updated: '2026-05-25',
    minutes: 6,
    faq: [
      { q: 'Should I call the store to check a penny item?', a: 'No. Staff who look up a pennied SKU are typically expected to pull the remaining stock. Calling ahead usually kills the find for you and everyone else.' },
      { q: 'What’s the most reliable signal a deal is still live?', a: 'Recent independent confirmations — multiple hunters scanning the same UPC at different stores within the last day or two. That’s exactly what our Verified badge means.' },
      { q: 'What does YMMV mean on a deal?', a: '"Your mileage may vary" — pricing is store-specific. A penny in one city can be full price in the next store over, especially at Walmart where prices are set per store.' },
    ],
    body: `
The worst outcome in penny hunting isn't a refused sale — it's a 40-minute drive for an empty shelf. Every wasted trip traces back to skipping the same five checks. Here's the pre-drive routine that separates veterans from the disappointed.

## 1. Read the report like a skeptic

On any [deal page](/deals), three signals do most of the work:

- **Status badge.** *Verified* means ≥2 independent confirmations within 72 hours or a receipt photo — the strongest signal we have. *Likely Active* is one credible report under a week old. *Unconfirmed* means exactly that. *Dead* means multiple hunters found nothing — believe them.
- **Last confirmed timestamp.** A verified deal confirmed 2 hours ago and one confirmed 6 days ago are different bets. Penny stock decays fast: staff pulls, other hunters, and weekly sweeps all eat it.
- **Province spread.** A UPC confirmed in ON, AB *and* BC is a system-wide markdown — excellent odds it's pennied at your store too. A single-store report is a local stray: real, but only at that store.

## 2. Check the price history ladder

Open the item's page (/item/&lt;UPC&gt;) and look at the price timeline. A clean markdown ladder — $24.98 → $6.03 → $3.02 → $0.01 — is the signature of a real cycle completing, and it tells you the *whole chain* is on the same trajectory. A lone $0.01 report with no history behind it deserves more caution (and more weight on those confirmation badges).

## 3. Do NOT call the store

The single most common rookie mistake. When staff look up a pennied SKU, standard practice is to **pull the remaining stock** — it's flagged for removal, and you just told them where it is. Calling ahead converts "probably on the shelf" into "definitely in the compactor." The same goes for asking on arrival. Verification is a self-serve activity.

## 4. Bring the barcode with you

Every deal page has a **scannable barcode** rendered from the UPC — open it on your phone and any self-checkout or price-checker can read it straight off your screen. That means you can verify the *system price at your store* in the first two minutes of the trip, before hunting shelves: scan at the price checker; if it shows a penny, the item exists in your store's system at that price and the only question is whether stock survived. If it shows full price, save yourself the aisle-crawl — YMMV just varied.

## 5. Know where to look when you arrive

The report's **location note** ("top stock aisle 9", "garden centre clearance corner") is the finder's gift to you. No note? Default search order: clearance endcaps → top stock in the item's home aisle → back racks/returns area → seasonal. Ten minutes, in and out.

## 6. Close the loop

Whatever happens, spend the ten seconds: **"Found it too"** (with your store) or **"Gone at my store."** Confirmations keep the list alive; dead votes save the next hunter the drive you just took. The list is only as good as the hunters who feed it — and the algorithm is watching either way: three dead votes retire a deal automatically.

*Checklist version: badge fresh? → history real? → didn't call? → barcode saved? → location note read? Drive.*
`,
  },
];
