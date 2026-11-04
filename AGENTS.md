# Cherry Picked Chaos — Codex working guidelines

## Project objective
Continue the Cherry Picked Chaos website built in ChatGPT from the original Google Stitch export. Preserve the distinctive retro, playful, cherry-heavy personality rather than replacing it with a generic retail theme.

## Files to know
- `index.html`: landing page with gallery, Visit/map, contact form, and Cherry Bombs signup
- `shop.html`: independent sample shop linked in the landing-page footer
- `guide.html`: restored Schulenburg day-trip guide (Painted Churches, downtown, coffee/kolaches), reached from the small Visit teaser
- `estate.html`, `estate.css`, `assets/estate-keepsakes.svg`: separate estate liquidation/downsizing inquiry page, linked in the public navigation and home footer
- `drops.html`: legacy redirect to the Cherry Bombs signup section
- `style.css`: base styling
- `groove.css`: v2 retro visual design
- `app.js`: shared navigation and local contact/signup previews; no commerce code or storage
- `landing.css`: landing-page additions
- `guide.css`: mobile-first day-trip teaser and guide layout
- `hospitality.css`: mimosa note, social placeholders, Cherry Bombs CTA and native signup dialog
- `opening.js`: shared next-opening date/hour labels; update when the client supplies the schedule
- `opening.css` and `assets/out-pickin.svg`: hero opening card and decorative Closed — Out Pickin’ sign
- `assets/mimosas.svg`: lightweight decorative mimosa illustration
- `assets/schulenburg-detour.svg`: decorative church/road illustration, not a depiction of a specific attraction
- `demo.js` and `demo.css`: products, filtering, demo bag/drawer, Surprise Me, and commerce styles; loaded only by shop.html
- `assets/`: graphics and sample product imagery
- `assets/illustrated_storefront_concept.png`: illustrated building used in the landing hero and temporary brand gallery, visibly labeled as an illustration with imagined details.
- `reference/original_google_stitch_export.zip`: initial Google Stitch export
- `reference/storefront_streetview_may_2024.png`: image reference of the real building, labeled May 2024 in source screenshot
- `reference/website_v2_*.png`: screenshots of v2

## Critical guardrails
1. This is a client preview, not a live storefront. No actual payments, holds, checkout, inventory sync, pickup reservations, mailing-list subscription, or order placement is implemented.
2. Demo product prices, descriptions, and photos are NOT confirmed real inventory. Never present them as current stock.
3. Store address, opening hours, next event dates, contact details, policies, and social URLs must be confirmed by client before publishing.
4. The illustrated storefront includes a **fictional decorative Cherry Picked Chaos sign**, not an installed/verified physical sign. Do not present the art as a photograph or factual record of current storefront.
5. Respect keyboard use, mobile layouts, accessible contrast and prefers-reduced-motion.
6. Preserve existing HTML/CSS/JS behavior and keep changes reviewable; avoid introducing frameworks or third-party services without a specific reason.
7. Work locally and explain significant changes before connecting any external services or publishing anything.

## Desired visual direction
Groovy 60s/70s-inspired boutique treasure-hunt aesthetic. Cream, warm cherry red, blush pink, olive green, rich brown. Big expressive typography, illustrated cherries and flowers, wavy/scalloped motifs, gentle hover animations, micro-interactions, warm quirky copy. Maintain a recognizable identity and use real store content once available.

Mobile is the priority. Keep decorative stars and other floating accents clear of text and controls. Preserve the Schulenburg day-trip content when reorganizing shopping features. The guide's `data-partner-slot` cards allow future partner links; current links are ordinary visitor-information links. Add real affiliate destinations and clear nearby disclosures only after arrangements are confirmed.

The user confirmed complimentary mimosas during open retail hours. Keep this hospitality note without inventing a regular opening schedule. Cherry Bombs signup lives in a native modal slideout, opened on request by its separate CTA, navigation, or footer; keep Contact as the only inline form. Instagram/Facebook icons remain labeled, disabled placeholders until client URLs are supplied. The newsletter dialog is independent of the sample shopping drawer.

The Next chance to cherry-pick card sits below the hero buttons, before the storefront illustration on mobile. Its date/hour placeholders and the Visit labels share opening.js. The Closed — Out Pickin’ artwork is visibly labeled as a sign preview while the schedule is unconfirmed; do not infer a live open/closed state.

Estate liquidation is an offering the user asked to restore. The estate inquiry remains a local preview with its own form response. Confirm service area, fees, scope, timing, and specific arrangements with the client rather than promising appraisals, full property clear-outs, or immediate availability. Public navigation collapses to the mobile menu through 950px to accommodate the estate service link comfortably.

## First task suggestion
Audit the current site with a local browser preview, report any issues, then develop a considered plan to integrate `assets/illustrated_storefront_concept.png` into the design (possibly as a Visit section feature) without pretending that its fictional sign is real. Ask approval before substantial redesign.
