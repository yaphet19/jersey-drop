# Jersey Drop — Online Shop Design

## Overview

Jersey Drop is an online storefront for a jersey shop based in Ethiopia. Customers browse jerseys, add to cart, enter delivery details, and get an itemized receipt with delivery fee and total before sending the order to the shop via WhatsApp or Telegram. No online payment gateway — payment happens after the order is placed, via Telebirr or CBE transfer, confirmed manually by the shop owner. Other sportswear categories may be added later; jerseys are the only category for launch.

## Branding

- **Name:** Jersey Drop
- **Colors:** Black and white only
- **Logo:** A solid black serif monogram — capital "D" with a "J" overlapping it (the J sits in the upper-middle of the D, elongated, its base close to the D's bottom curve; where the two letters cross, the J's fill covers the D's strokes rather than showing both outlines). Wordmark "JERSEY DROP" in letter-spaced serif caps below the mark. The finished logo file is saved at `assets/jersey-drop-logo.jpg` (provided by the owner — this is the shop's existing logo, already in use on its social media) and should be used as-is for the site's nav bar, hero, and favicon.
- **Style direction:** Adidas.com-inspired — bold, minimal, editorial black/white design language, not the logo style itself.

## Homepage

Campaign-hero layout:
- **Nav bar:** logo left, text links (SHOP / NEW / OFFERS) center, search + cart icons right.
- **Hero:** full-width black banner with bold headline (e.g. "NEW SEASON. NEW KITS."), short subtext, a white CTA button ("SHOP NOW").
- **Product grid below the hero:** jersey cards in a 2-column (mobile) grid, each showing a photo, name, and price. When a jersey has a discount, a badge (e.g. "-20%") sits on the top-left corner of the photo, and the price shows the old price struck through next to the new price.
- **Footer note:** a short line reminding customers the delivery fee is calculated at checkout and payment happens on delivery, not in advance.

## Product Catalog

- Each jersey has: name, price (ETB), photo, optional discount, and a size selector (S/M/L/XL, etc. — required before adding to cart).
- **No admin dashboard for launch.** Products live in one straightforward data file (name, price, photo path, discount, sizes) that the owner — or a future session — edits directly. No login, no backend, no database.
- **Product photos:** launch with plain placeholder image blocks. No AI-generated jersey images (risk of misrepresenting the real product and of reproducing trademarked club crests/sponsor logos) and no images copied from other sites (copyright). The owner will supply real photos of the physical jerseys they stock to swap in later — this doesn't block launch.

## Delivery Fee

- **No live courier API for launch.** Yango Delivery has no confirmed public offering in Ethiopia, and even where it operates, business API access requires a manual sales process (emailing `integration-support@yango.com`, getting a business account, then an API key) — not something to build against today.
- **Zone-based estimate instead:** the owner defines a short list of delivery zones (e.g. "Bole, Addis Ababa," "Piassa, Addis Ababa," "Other city (Ethiopia)"), each with a flat fee the owner sets to roughly match what a courier actually charges. This list lives in the same simple data file as the product catalog.
- Designed so the fee lookup is a single, swappable piece of logic — if the owner later gets real Yango API access (or another courier's), it can replace the zone lookup without reworking the rest of checkout.

## Cart & Checkout Flow

1. **Cart:** line items with thumbnail, jersey name, selected size, quantity, and price; a subtotal; "Proceed to Checkout" button.
2. **Delivery details:** full name, phone number, a delivery zone selector (each option shows its fee), and a free-text field for exact address/landmark.
3. **Order summary (receipt):** itemized list (name, size, qty, price per line), subtotal, delivery fee line, and a bold **TOTAL** at the bottom — mirroring the Beu Delivery-style receipt the owner referenced.
4. **Payment method:** Telebirr or CBE bank transfer only (no cash option — the shop doesn't hand-deliver, a courier does, so there's no one for the customer to pay cash to). Selecting either shows the shop's number/account to send to. A note makes explicit: **no payment happens now** — the customer pays via Telebirr/CBE once the order arrives, confirmed manually by the owner (screenshot-based confirmation, no automated payment verification).
5. **Send order:** two buttons — "Send on WhatsApp" and "Send on Telegram" — the customer picks whichever app they have. Tapping one opens that app with the full order (items, sizes, quantities, delivery details, chosen zone/fee, total, payment method) pre-filled as a message to the shop. No backend order storage for launch — orders live in the resulting chat thread.

## Explicitly Out of Scope for Launch

- Online payment gateway / automated payment verification
- Admin dashboard or backend order management (orders are handled via WhatsApp/Telegram chat)
- Live delivery-courier API integration (zone-based estimate only, built to be swappable)
- Customer accounts / login
- Real product photography (placeholders until the owner supplies real photos)
- Non-jersey product categories (may be added later, not yet decided)
