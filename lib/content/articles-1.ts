import type { Article } from './articles';

export const ARTICLES_1: Article[] = [
  {
    slug: 'what-are-penny-items',
    title: 'What Are Penny Items? How Penny Deals Work in Canada',
    description:
      'The complete beginner’s guide to penny items in Canada: why retailers mark items down to $0.01, how the markdown cycle works, and how hunters find them.',
    updated: '2026-06-15',
    minutes: 9,
    pillar: true,
    faq: [
      { q: 'What is a penny item?', a: 'A penny item is a product whose price in a retailer’s internal system has dropped to $0.01 (sometimes $0.02–$0.04). The penny price is a signal to staff that the item should be pulled from the floor — but items that get missed can be scanned and purchased at the register for that price.' },
      { q: 'Are penny items a glitch?', a: 'No. Penny pricing is a deliberate final step in the markdown cycle at retailers like Home Depot. The "glitch" is only that the item is still on the shelf when it was supposed to be removed.' },
      { q: 'Do stores have to sell penny items?', a: 'No. A store can refuse the sale — pennied items are flagged for removal, not for sale. Many stores will honour the scan; some won’t. Be polite either way.' },
      { q: 'Which Canadian stores have penny items?', a: 'Home Depot Canada is the most active. Walmart Canada produces 2–3 cent items and hidden clearance. Dollar Tree Canada pennies items on markdown days. Costco doesn’t penny out but has its own deep-markdown codes.' },
    ],
    body: `
Penny items sound like an urban legend: a $149 drill that rings up for one cent. But they're real, they're systematic, and once you understand *why* they exist, finding them stops being luck and starts being a repeatable process.

## Why penny items exist

Big-box retailers move enormous volumes of inventory, and every product eventually reaches end-of-life: a new model replaces it, a season ends, or a supplier deal changes. Retailers run this stock through a **markdown cycle** — a scheduled sequence of discounts (25% → 50% → 75% → deeper) applied in the internal pricing system.

Here's the key mechanic: when an item *still* hasn't sold at the end of its cycle, systems at retailers like Home Depot drop the SKU to **$0.01**. That penny price isn't meant for customers. It's an internal flag that tells staff: *this item is written off — pull it from the shelf and dispose of it or return it to the vendor.*

Staff sweep the clearance sections and pull flagged items. But stores are big. Items hide in **top stock** (the high shelves above the sales floor), on returns racks, behind other products, or in the wrong aisle entirely. Every item the sweep misses is still sitting in the system at $0.01 — and the register charges the system price.

## The shelf tag lies

The single most important thing to understand: **the shelf tag and the system price are two different things.** A pennied item almost never has a $0.01 tag. The tag usually shows the last marked-down price — or even full price. The only way to know the real price is to scan the item's **UPC** (the barcode on the product itself, not the shelf label) at a price checker, self-checkout, or with the retailer's app.

This is also what separates penny hunting from its cousin, **hidden clearance** — items marked 50–97% off in the system while the shelf still shows full price. Same mechanic, less extreme price. Walmart Canada is the classic hidden-clearance retailer: the shelf says $39.97, the app scan says $3.00.

## The hunt, in practice

Experienced Canadian hunters work a simple loop:

1. **Learn the tag language.** Each retailer's clearance tags carry signals — price endings like .02/.03/.04 at Home Depot mark the late stage of the markdown cycle. Our [Clearance Tag Decoder](/decoder) covers each retailer.
2. **Scout candidates.** Walk clearance endcaps, note late-stage items and their dates, and check back after the expected drop window.
3. **Scan, don't assume.** Scan the product's UPC. If it shows a penny, it's live *at that store, right now*.
4. **Check the community list.** Penny drops often happen chain-wide on the same schedule. When one hunter reports a pennied SKU in Calgary, the same SKU is often — not always — a penny in Halifax. That's exactly what the [live penny list](/deals) is for.
5. **Buy politely.** Self-checkout is simplest. If staff refuse the sale, accept it and move on — it's their call to make.

## What penny items are NOT

- **Not theft or a scam.** You pay the price in the retailer's own system at their own register.
- **Not guaranteed.** Stores may refuse, and one store's penny is another store's full-price item (the community says **YMMV** — your mileage may vary).
- **Not shelf-price arbitrage.** Swapping tags or misrepresenting an item is fraud, full stop, and gets you banned from this site.

## Penny hunting in Canada specifically

Canada adds a few twists that US guides miss. We killed the physical penny in 2013, so **cash totals round to the nearest 5¢** — a single $0.01 item literally rounds to $0.00 in cash (card charges the exact cent). Sales tax (GST/HST/PST) applies to the scanned price, which on a penny rounds to zero in most provinces. And the [Scanner Price Accuracy Code](/guides/scanner-price-accuracy-code) — a voluntary code most large Canadian retailers follow — can even get you an item free when it scans *higher* than the shelf price.

Ready to go deeper? Start with the retailer that built the Canadian penny scene: our [Home Depot Canada complete guide](/guides/home-depot-canada-penny-guide), then check [today's live list](/deals) to see what's scanning right now near you.
`,
  },
  {
    slug: 'home-depot-canada-penny-guide',
    title: 'Home Depot Canada Penny Items: The Complete Guide',
    description:
      'How Home Depot Canada’s markdown cycle works: yellow tags, .02/.03/.04 price endings, the 14-week pattern, where pennied items hide, and how to check out smoothly.',
    updated: '2026-06-20',
    minutes: 11,
    faq: [
      { q: 'What do Home Depot price endings mean?', a: 'Endings like .06 mark earlier clearance stages, while .02/.03/.04 are late-stage markdown signals. The community pattern is that late-stage endings drop to $0.01 roughly 14 weeks after the clearance date on the tag — but it varies by store and category.' },
      { q: 'Should I scan the shelf tag or the item?', a: 'Always scan the item’s own UPC barcode. The yellow clearance tag often shows a stale price; the register charges the system price attached to the product barcode.' },
      { q: 'What if staff refuse to sell a penny item?', a: 'Accept it politely. Pennied items are flagged for removal and the store is within its rights to refuse. Arguing gets the whole hobby a bad name — and often gets remaining stock pulled immediately.' },
      { q: 'When do new pennies drop?', a: 'Markdowns process overnight in the system. Many hunters check early in the day, midweek, when clearance sweeps are least likely to have caught up.' },
    ],
    body: `
Home Depot Canada is the beating heart of the Canadian penny scene. Its markdown system is consistent enough to be learnable, and its stores are big enough that flagged items get missed every single week.

## The markdown cycle

When a product goes on clearance, it gets a **yellow tag** with a printed date — the clearance start date. From there the system steps the price down on a schedule: typically around 25% off, then 50%, then 75%, then deeper. When the cycle ends and stock remains, the system drops the SKU to **$0.01**: the pull signal.

## Reading the tags

The community has reverse-engineered a lot of signal from Home Depot's price endings:

- **.06 endings** — early-to-mid clearance. More markdowns are coming; not worth a special trip yet.
- **.02 / .03 / .04 endings** — late-stage clearance. This is the watch list.
- **The 14-week pattern** — the most-cited heuristic in the hobby: late-stage endings tend to drop to a penny roughly **14 weeks after the clearance date printed on the tag**. Treat this as a scouting guideline, not a law of physics — stores vary, categories vary, and some items take 6–8 months.

Photograph tags on your scouting runs (tag + date + aisle). When the expected window arrives, check the [live list](/deals) and the [UPC lookup](/lookup) before driving back.

## Where pennied items hide

Staff sweep the obvious clearance aisle first. Missed pennies live in:

- **Top stock** — the high steel shelving above the sales floor. The #1 hiding spot.
- **Clearance endcaps mid-store** — especially endcaps that got restocked with mixed product.
- **Back racks and returns carts** — returned clearance items often go back out after the sweep.
- **Wrong-aisle strays** — an item abandoned two departments away is invisible to a sweep.

## Verifying and checking out

1. **Scan the item's UPC** at a price checker or self-checkout — never trust the shelf tag price in either direction.
2. **Self-checkout is your friend.** It's quiet, it's fast, and nobody has to make a judgment call.
3. **If the register asks for assistance** (some penny scans trigger an approval), stay relaxed. The attendant may honour it or may pull the item.
4. **If staff refuse: accept it.** Under Canadian law the store isn't obligated to complete the sale. Thank them and move on — there will be another penny next week.

One etiquette rule matters more than all others: **don't ask employees to find penny items for you.** They can't, they're often instructed not to, and it puts them in an awkward spot. Hunt with your own scanner.

## A realistic first hunt

Go midweek, early. Walk the clearance endcaps and note .02/.03/.04 tags and their dates. Scan anything late-stage sitting in top stock or on a back rack. Log your finds — even non-pennies — because today's $3.02 is a strong candidate for a penny 14 weeks after its tag date. Then [report your finds](/report) so the next hunter (and the future you) knows what's live.

Tax note: GST/HST applies to the scanned price — on a $0.01 item the tax rounds to zero in every province. Paying cash? Canada's rounding rules take a single penny total to $0.00; card charges the exact cent. Details in [how do you pay $0.01?](/guides/how-to-pay-one-cent-canada).
`,
  },
  {
    slug: 'walmart-canada-hidden-clearance',
    title: 'Walmart Canada Hidden Clearance: How to Find 2-Cent Items',
    description:
      'Walmart Canada’s shelf tags often show full price while the system price is 50–97% lower. Here’s how to reveal hidden clearance with the app scanner and find 2-cent items.',
    updated: '2026-06-18',
    minutes: 8,
    faq: [
      { q: 'What is hidden clearance?', a: 'A markdown that exists in Walmart’s pricing system but isn’t reflected on the shelf tag. The shelf shows $39.97; the item scans $3.00. The register always charges the system price.' },
      { q: 'How do I see the real price?', a: 'Scan the item’s barcode with the Walmart app’s built-in scanner or an in-store price checker. The app shows the current system price for your selected store.' },
      { q: 'Does Walmart Canada have true penny items?', a: 'Rarely. The realistic targets are 2-cent and 3-cent items — final-clearance endings that function the same way. Alberta and Ontario report the most.' },
      { q: 'Why does the app show a different price at another store?', a: 'Walmart prices are store-specific. Hidden clearance at one location says nothing about the next one — always scan at your own store.' },
    ],
    body: `
Walmart Canada's clearance system runs on a simple gap: **markdowns process in the system faster than shelf tags get updated** — and sometimes tags never get updated at all. That gap is hidden clearance, and it's the most accessible form of deal hunting in Canada because the only tool you need is the free Walmart app.

## How hidden clearance happens

Walmart pricing is store-specific and processed centrally. When head office or a store manager marks a category down — end of season, discontinued line, overstock — the new price lands in the system overnight. Updating shelf labels is a manual job that competes with everything else staff have to do. Seasonal resets (post-Christmas, post-Halloween, end of garden season) generate hundreds of markdowns at once, and the labels simply never catch up.

Result: aisles full of product where the tag says full price and the register says otherwise.

## The scan-everything method

1. **Open the Walmart app**, make sure your store is set correctly (prices are per-store), and use the barcode scanner.
2. **Work the seasonal aisle first** right after a season ends. This is where the biggest gaps live.
3. **Scan the item's UPC**, not the shelf label — the label is exactly what you're trying to bypass.
4. **Learn the endings.** A scanned price ending in **.02 or .03** is final clearance: that's the Canadian "2-cent item" when the base price bottoms out. Endings like **.94** generally mean clearance in progress; **.97** usually marks a rollback with more room to fall.
5. **Check the claw-back sections**: the clearance racks at the back, top shelves in seasonal, and mispicked items sitting on the wrong shelf.

## 2-cent items

True $0.01 items are rare at Walmart Canada; the community's realistic prize is the **$0.02–$0.03 item** — a final-clearance price that staff are supposed to pull, exactly like a Home Depot penny. Everything in our [etiquette guide](/guides/penny-shopping-etiquette) applies: the store can refuse, self-checkout is smoothest, and the tag price means nothing compared to the scan.

## Alberta and Ontario lead the waves

For whatever combination of volume and logistics, **AB and ON stores report the most hidden clearance** on our list. Waves are regional: when a DC-level markdown lands, several stores in the same region light up within days. That's why [area alerts](/alerts) exist — set your postal code and radius, and get an email when a wave starts near you instead of finding out a week late.

Found something scanning low? [Report it](/report) — store, price, date, and a shelf photo if you can. One report becomes a confirmed, mapped deal that saves everyone else the guesswork.
`,
  },
  {
    slug: 'dollar-tree-canada-penny-list',
    title: 'Dollar Tree Canada Penny List: How Markdown Days Work',
    description:
      'Dollar Tree Canada pennies out discontinued and seasonal SKUs on scheduled markdown days. How the pull process works, what typically pennies, and how to check.',
    updated: '2026-06-12',
    minutes: 7,
    faq: [
      { q: 'What is a Dollar Tree markdown day?', a: 'A scheduled date when discontinued/seasonal SKUs drop to $0.01 in the system as a signal for staff to pull them. Items missed in the pull scan for a penny until they’re found.' },
      { q: 'How do I know what pennied out?', a: 'Dollar Tree doesn’t publish lists. The community reconstructs each event from register scans — that’s what our live list and UPC lookup are for.' },
      { q: 'Can I ask staff for the penny list?', a: 'Please don’t. Staff are generally instructed to pull penny items, not sell them. Asking puts them in a bad position and often gets stock pulled faster.' },
    ],
    body: `
Dollar Tree's penny system is the simplest of the Phase-1 retailers — and the most feast-or-famine. There's no visible markdown ladder and no tag decoding: items go from full price to **$0.01 overnight** on scheduled **markdown days**, as a pull signal for discontinued and seasonal stock.

## How markdown days work

Dollar Tree operates on planograms that change with the seasons. When a seasonal set ends (Easter, Halloween, Christmas, back-to-school) or a SKU is discontinued, head office schedules the change in the system. On the markdown date, affected SKUs drop to a penny, and stores are expected to pull and dispose of them — often the same morning.

The hunt exists because pulls are done by humans reading a list against thousands of shelf positions. Items that migrated to the wrong shelf, sat in overstock, or hid behind other product survive the pull — still pennied in the system.

## What typically pennies out

- **Seasonal leftovers** — the classic. Anything still on the floor well past its season is a candidate.
- **Old packaging** — when a product gets rebranded, the old-package SKU is often discontinued and pennied while the new one takes the shelf.
- **Discontinued lines** — entire product categories occasionally leave the assortment at once, which is what creates the famous "penny wave" hauls.

## Hunting Dollar Tree in practice

1. **Timing beats everything.** The best window is the day of and the day after a markdown event, before pulls are complete. Markdown days aren't published; the community detects them when the first penny scans appear — which is exactly what the [live list](/deals) surfaces.
2. **Scan suspicious stragglers.** Seasonal item in July? Old logo? Scan it at the register or ask to price-check *one* item politely.
3. **Don't ask for "the penny list."** Staff can't give it to you and asking flags the store to sweep harder.
4. **Cash rounds to zero.** A single penny item paid in cash rounds to $0.00 under Canada's rounding rules — bring a card if that feels too strange, and see [our explainer](/guides/how-to-pay-one-cent-canada).

## Why report Dollar Tree finds fast

Dollar Tree penny events are **chain-wide**: the same SKUs penny at every location on the same date. One confirmed scan in Calgary means the same UPC is worth checking in every Canadian store — for a day or two, until pulls finish. Speed is everything, which makes Dollar Tree the most community-driven hunt we cover. [Report the UPC immediately](/report), even if you didn't buy: the next hunter can verify with our [barcode tool](/lookup) at their own store.
`,
  },
  {
    slug: 'penny-shopping-etiquette',
    title: 'Penny Shopping Etiquette & Rules in Canada',
    description:
      'The unwritten rules that keep penny hunting sustainable: stores can refuse, employees aren’t your scouts, shelves aren’t for wrecking, and pennied stock is flagged for removal.',
    updated: '2026-06-10',
    minutes: 6,
    faq: [
      { q: 'Can a store refuse to sell a penny item?', a: 'Yes. A shelf price or scan is generally an invitation to treat, not a binding contract — the sale isn’t complete until the store accepts payment. If they decline, that’s their right.' },
      { q: 'Should I tell the cashier it’s a penny item?', a: 'You don’t need to announce anything, but never misrepresent an item, swap tags, or hide what something is. Scan honestly and let the register decide.' },
      { q: 'Is it okay to buy all the stock?', a: 'It’s legal, but the community norm is to leave some for others when a find is big — and to always report the find so others get a chance at their own stores.' },
    ],
    body: `
Penny hunting only works long-term if stores tolerate it. Every hunter who argues with a cashier, wrecks an endcap, or badgers staff makes every store a little more hostile for everyone. These are the norms this community enforces.

## Rule 1: The store can say no — accept it

A pennied item is flagged for *removal*, not for sale. Legally, a displayed or scanned price is an **invitation to treat**: the contract completes when the store accepts your payment, and until then they can decline. Some stores honour every penny scan without blinking; some have a policy to pull on sight.

If a cashier or manager refuses: say "no problem, thanks for checking," and let them keep the item. Don't cite imaginary laws. Don't ask for a manager to overrule a manager. There will be more pennies.

## Rule 2: Employees are not your scouts

Don't ask staff for "the penny list," don't ask them to scan a cart of maybes, and don't ask them to check the back. Most retailers instruct employees to pull pennied stock, so asking is literally asking them to take your find away — and it puts hourly workers in an uncomfortable spot with their managers. Hunt with your own eyes and your own scanner.

## Rule 3: Leave the store better than you found it

- Don't tear apart top stock or unbox product to check UPCs.
- Put strays back where you found them (a wrong-aisle stray you *didn't* buy might be someone else's find — or a hazard).
- Don't hide items for later. It's the fastest way to get pennies swept.

## Rule 4: Honesty at the register, always

Scan the real UPC on the real product. **Tag-swapping, barcode stickers, or misrepresenting an item is fraud** — a crime, not a deal. It's also an instant permanent ban from PennyRadar. The entire point of penny hunting is that the store's own system sets the price; the moment you manipulate that, you're stealing.

## Rule 5: Be invisible-polite at checkout

Self-checkout is ideal: quiet, fast, no judgment calls. If a penny scan triggers an assistance prompt, be friendly and unhurried. Cashiers remember pleasant customers — and remember the other kind harder.

## Rule 6: Share your finds

Report finds — including "gone/didn't scan" updates — on the [live list](/report). Confirmations are what make the list trustworthy, and the hunter you help today is the one whose report saves you a wasted drive next month. Big haul? Post it on the [Receipt Wall](/wall) — brag responsibly.

## The one-sentence version

**Scan honestly, accept refusals gracefully, never involve employees, don't wreck anything, and report what you find.** That's the whole culture.
`,
  },
];
