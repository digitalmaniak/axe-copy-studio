# Doc 2 — Copy Asset Types

> **Job:** Defines every copy asset the tool can write — its fields, character limits, placement,
> guidelines, and approved examples.
> **Feeds:** The asset picker in the app AND the generation prompt. Read at request time, so edits
> apply on the next generation (no redeploy).
> **Owner:** Copy lead. Other teams (e.g. Web / PDP) add their own asset types by copying a block.
>
> Source: "AX Copy & Voice Optimization" deck — Copy Assets for Promotional Requests.
> *Please use asset names exactly as they appear here on requests.*

---

## How to add or edit an asset type

Each asset type is one `##` section. Copy an existing block and edit it. Keep this structure so
the app can read it:

```
## <Asset name exactly as used on requests>
ID: <short-kebab-id, unique, never change once in use>
Group: <Promotional | Retail | Web | …>   ← the picker groups assets by this
Placement: <where it runs>
Dimensions: <e.g. 1600x600, or leave blank>
Channels: <e.g. LG.COM, FB>
CTA: <Yes / No / Yes (Shop Now)>

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| headline | Headline | 60 | anything the writer should know |

### Guidelines
- One rule per bullet.

### Examples
**Example #1234**
Headline: …
Body: …
```

- **Field keys** are lowercase (`eyebrow`, `headline`, `body`, `cta`, or new ones like `subject_line`).
  Examples map to fields by their label or key (`Subcopy:` and `Body:` both map to `body`).
- **Max** is a hard character limit (spaces included). Leave blank for no limit.
- Only sections with an `ID:` line and a `Fields:` table are loaded as assets — this intro is ignored.

---

## Homepage (HP) Hero Banner
ID: hp-hero
Group: Promotional
Placement: Homepage Hero Carousel
Dimensions: 1600x600
Channels: LG.COM, FB
CTA: Yes

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 42 | Optional. UPPERCASE; flags the promo or channel. |
| headline | Headline | 67 | ~3 lines max. Aim for 60 characters or less (2 lines). |
| body | Body Copy | 230 | The fullest story of any asset: experience → product proof → offer. |
| cta | CTA | 20 | Default "Shop Now". |

### Guidelines
- If the CTA leads to a dedicated promo page, "terms" and validity dates are not required.

### Examples
**Example #1244**
Headline: True-to-life QNED picture. Off-the-wall installation savings.
Body: Watch sports and games like you're on the sideline. Powered by Mini LED and a native 120Hz refresh rate, the LG QNED8MB delivers enhanced contrast, smoother motion, and lifelike picture. Earn 5% myLG Rewards and 50% off installation.

**Example #1235**
Headline: Make every game bigger—$200 NFL Shop eGift Card with big screen TVs
Body: Every play is larger than life on an LG Big Screen TV. Score up to $200 NFL Shop eGift Card and $XX off when you bring one home, plus free professional installation on select models.

**Example #1305**
Headline: Make football season cinematic with an LG Projector & a free Soundbar
Body: Transform any space into a cinematic experience this football season. The LG CineBeam S projects up to 100 inches of stunning 4K from just inches away—no ceiling mounts needed. Get a free Soundbar ($199.99 value) with your purchase.

**Example #1413 (QNED)**
Headline: Cash in on rich QNED color before the holiday rush
Body: Beat the holiday rush with savings on stunning picture quality that can't be beat. Enjoy up to XX% off our QNED TVs and up to $200 Visa Prepaid Card with purchase—plus free installation with mount or stand included.

**Example #1413 (OLED)**
Headline: Score a $200 NFL Shop eGift Card with select fan-favorite OLED TVs
Body: See every play like you're on the sideline with Hyper Radiant Color Technology on LG's best-selling OLED TVs. Enjoy up to $XX off and $200 NFL Shop eGift Card, plus free professional installation.

**Example #1275**
Headline: Power Duo: Up to 30% off LG gram, plus a free mouse
Body: Pair the ultra-light power of LG gram with a free High-Performance Mouse when you buy select models. Enjoy exceptional AI performance, long-lasting battery life and up to 30% off — only at LG.com.

---

## Product Listing Page (PLP) Hero Banner
ID: plp-hero
Group: Promotional
Also known as: Collections Page / Dedicated promo page Hero Banner
Placement: Category pages / Static hero
Dimensions: 1600x600
Channels: LG.COM, FB, T
CTA: No

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 42 | UPPERCASE. |
| headline | Headline | 67 | |
| body | Body Copy | 230 | Or 2 lines max. When there's an offer, close with validity + "Terms may apply." |

### Guidelines
- Evergreen category description.
- The category / subcategory name must appear in the headline or the eyebrow.
- No CTA on this asset.

### Examples
**Example #1244**
Headline: True-to-life QNED picture. Off-the-wall installation savings.
Body: Experience sports and games like you're there. Powered by Mini LED and a 120Hz refresh rate, the LG QNED8MB delivers a lifelike screen display. Earn 5% myLG Rewards and 50% off installation. Offer ends 10/4/26. Terms may apply.

**Example #1415**
Headline: Art meets entertainment. Savings greet the season.
Body: Celebrate the start of gifting season with up to XX% off Gallery TVs and Touchscreens—stunning displays that double as design statements. Earn up to $100 Visa® Prepaid Card with your purchase. Offer ends 10/18/26. Terms may apply.

**Example #1413**
Headline: Cozy up to XX% off space-enhancing screens
Body: Celebrate the start of gifting season with up to XX% off Gallery TVs and Touchscreens. From flush-mount elegance to portable touchscreen freedom, both displays are perfect for any living space. Offer ends 10/18/26. Terms may apply.

---

## PLP Content Card
ID: plp-content-card
Group: Promotional
Placement: Category / Subcategory page, within results
Channels: Partner Store, FB
CTA: Yes

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 27 | Suggested 25 characters or less. UPPERCASE. |
| headline | Headline | 58 | |
| body | Body Copy | 140 | Or 3 lines max. Offer-forward. |
| cta | CTA | 20 | Default "Shop Now". |

### Examples
**Example #1235 (A)**
Headline: Score up to $200 NFL Shop eGift Card with LG Big Screen TVs
Body: Go big for less with up to $200 NFL Shop eGift Card and $XX off on select LG Big Screen TVs—plus free installation.

**Example #1235 (B)**
Headline: Score up to $200 NFL Shop eGift Card with LG Big Screen TVs
Body: Score up to $200 NFL Shop eGift Card and $XX off when you buy select LG Big Screen TVs—plus free installation.

---

## HP Bento Card/Tile
ID: hp-bento
Group: Promotional
Placement: Below Category Savings / Above Media Breaker
Dimensions: 340x150
Channels: Partner Store
CTA: Yes (Shop Now)

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| headline | Headline | 68 | Must stand alone — the tile can be swapped from the larger P1 position to a smaller one. |
| body | Subcopy | 132 | |
| cta | CTA | 20 | "Shop Now". |

### Guidelines
- Dynamic element: the headline must work on its own in case the position is switched from the larger "P1" to a smaller asset.

### Examples
**Example #1244**
Headline: Earn 5% back MyLG Rewards with QNED8MB
Subcopy: Sports and games come alive with Mini LED and a native 120Hz refresh rate for enhanced contrast and smoother motion.

**Example #1235**
Headline: Make every game bigger—$200 NFL Shop eGift Card with big screen TVs
Subcopy: Score up to $200 NFL Shop eGift Card and $XX off when you buy select LG Big Screen TVs—plus free installation.

**Example #1236**
Headline: Score a $200 NFL Shop eGift Card and $XX off select OLED TVs
Subcopy: Shop our best-selling OLED TVs and get up to $XX off, up to $200 NFL Shop eGift Card and free professional installation.

---

## Promo Hub Tile
ID: promo-hub-tile
Group: Promotional
Placement: All Promotions page / Promo Hub
Channels: LG.COM
CTA: Yes (Shop Now)

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 42 | UPPERCASE. |
| headline | Headline | 80 | Carries the whole message — no body copy on this asset. |
| cta | CTA | 20 | "Shop Now". |

### Examples
**Example #1244**
Headline: Earn 5% back MyLG Rewards with your QNED8MB purchase

---

## PLP Mini Card
ID: plp-mini-card
Group: Promotional
Placement: Category / subcategory landing pages (e.g. OLED TVs, refrigerators)
Channels: Partner Store
CTA: Yes

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 27 | "ONLINE EXCLUSIVE" or promo details. UPPERCASE. |
| body | Body Copy | 52 | 2 lines or less (approx. 52 characters, depends on formatting). The offer in one tight line. |
| cta | CTA | 20 | Default "Shop Now". |

### Examples
**Example #1244**
Body: Earn 5% back MyLG Rewards with QNED8MB

**Example #1235**
Body: Up to $200 NFL Shop eGift Card and $XX off select TVs

---

## PDP Mini Card (Special Offers Card)
ID: pdp-mini-card
Group: Promotional
Placement: Product description pages where a promotion / value-add applies (bundle offers, giveaways, Premium Care, Handy wall mounting, etc.)
Channels: Partner Store
CTA: Yes

Fields:
| Key | Label | Max | Notes |
|-----|-------|-----|-------|
| eyebrow | Eyebrow | 27 | "SEE TERMS" or promo details. UPPERCASE. |
| body | Body Copy | 52 | 2 lines or less (approx. 52 characters, depends on formatting). |
| cta | CTA | 20 | Default "Shop Now". |

### Guidelines
- "SEE TERMS" must be added to the body copy for savings/promotions — unless it's already in the eyebrow.

### Examples
**Example #1235**
Body: Up to $200 NFL Shop eGift Card and $XX off select TVs

---

*Retail request assets (DCO frames, Social/FB, PMAX headlines) are listed in the deck but have no
specs yet — add them here once limits and examples are confirmed.*
